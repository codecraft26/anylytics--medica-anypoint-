'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Activity, AlertCircle, CheckCircle, Clock, Server, ArrowLeft, RotateCcw, Search, Loader2, ExternalLink, Cpu, MemoryStick } from 'lucide-react';

// Real axios import - make sure to install: npm install axios
import axios from 'axios';

// TypeScript interfaces
interface ApiData {
  id: number;
  name: string;
  type: 'Application' | 'API';
  requestVolume: number;
  responseTime: string;
  errorRate: number;
  successRate: number;
  deploymentType: string;
  version: string;
  status: string;
  memoryUtil: string;
  cpuUtil: string;
  throughput: string;
  lastUpdateTime: number;
  createTime: number;
}

interface Environment {
  envId: string;
  name: string;
  orgId: string;
}

interface ApiEntity {
  appName: string;
  reqVolume: number;
  errorVolume: number;
  status: string;
  deploymentType: string;
  responseTime: number;
  memoryUtil: string;
  throughput: string;
  cpuUtil: string;
  version: string;
  lastUpdateTime: number;
  createTime: number;
}

type TimeFilter = '1h' | '2h' | '12h' | '24h';
type ViewMode = 'dashboard' | 'details';

// Development mode toggle - set to false for production
const ENABLE_MOCK_MODE = false; // Set to true to use mock data during development

// Mock data functions for development
const getMockEnvironments = () => [
  { envId: "prod-123", name: "PROD", orgId: "org-456" },
  { envId: "qa-789", name: "QA", orgId: "org-456" },
  { envId: "dev-101", name: "DEV", orgId: "org-456" }
];

const getMockMetrics = (request: any) => ({
  response: {
    envId: request.envId,
    orgId: request.orgId,
    timeFrom: request.timeFrom,
    timeTo: request.timeTo,
    entities: [
      {
        appName: `${request.appName || 'claim'}-processing-api`,
        reqVolume: Math.floor(Math.random() * 10000) + 1000,
        errorVolume: Math.floor(Math.random() * 100),
        status: "Running",
        deploymentType: "Kubernetes",
        responseTime: Math.random() * 500 + 50,
        memoryUtil: "75%",
        throughput: "1200 req/min",
        cpuUtil: "45%",
        version: "v2.1.0",
        lastUpdateTime: Date.now(),
        createTime: Date.now() - 86400000
      },
      {
        appName: `${request.appName || 'claim'}-validation-service`,
        reqVolume: Math.floor(Math.random() * 8000) + 800,
        errorVolume: Math.floor(Math.random() * 50),
        status: "Running",
        deploymentType: "Docker",
        responseTime: Math.random() * 300 + 30,
        memoryUtil: "60%",
        throughput: "900 req/min",
        cpuUtil: "35%",
        version: "v1.8.2",
        lastUpdateTime: Date.now(),
        createTime: Date.now() - 172800000
      }
    ]
  }
});

// API Configuration - Update these values with your actual API details
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082/v1/api',
  HEADERS: {
    'Content-Type': 'application/json',
    'client_id': process.env.NEXT_PUBLIC_CLIENT_ID || 'your-client-id',
    'client_secret': process.env.NEXT_PUBLIC_CLIENT_SECRET || 'your-client-secret',
    // Add any additional headers your API requires
    // 'Authorization': `Bearer ${token}`,
    // 'X-API-Key': 'your-api-key'
  },
  TIMEOUT: 30000
};

// Splunk URL Generator
const generateSplunkUrl = (apiName: string, environment: string): string => {
  const baseUrl = "https://medica.splunkcloud.com/en-US/app/search/search?q=search%20index%3D";
  
  let indexSuffix = "";
  switch (environment.toUpperCase()) {
    case 'DEV':
      indexSuffix = "d_mulesoft";
      break;
    case 'QA':
      indexSuffix = "q_mulesoft";
      break;
    case 'STAGE':
      indexSuffix = "s_mulesoft";
      break;
    case 'PROD':
      indexSuffix = "p_mulesoft";
      break;
    default:
      indexSuffix = "q_mulesoft";
  }
  
  const applicationPart = "%20AND%20application%3D%22" + encodeURIComponent(apiName) + "%22";
  const endPart = "%20AND%20level%3D*%20%20%7C%20table%20application%20%7C%20dedup%20application%20%7C%20sort%20application&display.page.search.mode=verbose&dispatch.sample_ratio=1&earliest=-30m%40m&latest=now&display.page.search.tab=statistics&display.general.type=statistics&workload_pool=standard_perf&sid=1749459758.941503";
  
  return baseUrl + indexSuffix + applicationPart + endPart;
};

// Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
  timeout: API_CONFIG.TIMEOUT,
  // Enable CORS if needed
  withCredentials: false,
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Custom hooks for better state management
const useEnvironments = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post('/environments', {
        action: "Clear"
      });

      setEnvironments(response.data || []);
    } catch (err) {
      console.error('Error fetching environments:', err);
      setError('Failed to fetch environments');
      
      // Fallback data
      const fallbackEnvs: Environment[] = [
        { envId: "prod-123", name: "PROD", orgId: "org-456" },
        { envId: "qa-789", name: "QA", orgId: "org-456" },
        { envId: "dev-101", name: "DEV", orgId: "org-456" }
      ];
      setEnvironments(fallbackEnvs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  return { environments, loading, error, refetch: fetchEnvironments };
};

const useApiMetrics = () => {
  const [apiData, setApiData] = useState<ApiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTimeRange = useCallback((timeFilter: TimeFilter) => {
    const now = new Date();
    const timeTo = now.toISOString();
    
    const hoursMap = { '1h': 1, '2h': 2, '12h': 12, '24h': 24 };
    const hoursBack = hoursMap[timeFilter];
    
    const timeFrom = new Date(now.getTime() - hoursBack * 60 * 60 * 1000).toISOString();
    return { timeFrom, timeTo };
  }, []);

  const convertToApiData = useCallback((entity: ApiEntity, index: number): ApiData => {
    const errorRate = entity.reqVolume > 0 ? (entity.errorVolume / entity.reqVolume) * 100 : 0;
    const successRate = 100 - errorRate;
    
    return {
      id: index + 1,
      name: entity.appName,
      type: 'Application',
      requestVolume: entity.reqVolume,
      responseTime: `${entity.responseTime.toFixed(2)}ms`,
      errorRate,
      successRate,
      deploymentType: entity.deploymentType,
      version: entity.version,
      status: entity.status,
      memoryUtil: entity.memoryUtil,
      cpuUtil: entity.cpuUtil,
      throughput: entity.throughput,
      lastUpdateTime: entity.lastUpdateTime,
      createTime: entity.createTime
    };
  }, []);

  const fetchMetrics = useCallback(async (
    query: string, 
    timeFilter: TimeFilter, 
    environment: Environment
  ) => {
    if (!environment || !query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { timeFrom, timeTo } = getTimeRange(timeFilter);
      
      const requestBody = {
        request: {
          envId: environment.envId,
          orgId: environment.orgId,
          timeFrom,
          timeTo,
          appName: query.trim()
        },
        action: "clear"
      };

      let responseData;
      
      if (ENABLE_MOCK_MODE) {
        // Use mock data in development
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        responseData = getMockMetrics(requestBody.request);
      } else {
        const response = await apiClient.post('/metrics', requestBody);
        responseData = response.data;
      }
      
      const convertedData = responseData.response.entities.map((entity: ApiEntity, index: number) =>
        convertToApiData(entity, index)
      );
      
      setApiData(convertedData);
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      
      // Provide detailed error information
      let errorMessage = 'Failed to fetch API metrics';
      if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to API server. Please check if the server is running.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please check your client credentials.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access forbidden. Please check your permissions.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check the API URL.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'ENOTFOUND') {
        errorMessage = 'DNS resolution failed. Please check the API hostname.';
      }
      
      setError(errorMessage);
      setApiData([]);
    } finally {
      setLoading(false);
    }
  }, [getTimeRange, convertToApiData]);

  const clearData = useCallback(() => {
    setApiData([]);
    setError(null);
  }, []);

  return { apiData, loading, error, fetchMetrics, clearData };
};

// Environment Selector Component
const EnvironmentSelector: React.FC<{
  environments: Environment[];
  selectedEnv: Environment | null;
  onSelect: (env: Environment) => void;
  loading: boolean;
}> = ({ environments, selectedEnv, onSelect, loading }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {selectedEnv?.name || 'Select Environment'}
            <ChevronDown className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
      
      {isOpen && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
          <div className="py-1">
            {environments.map((env) => (
              <button
                key={env.envId}
                onClick={() => {
                  onSelect(env);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  selectedEnv?.envId === env.envId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {env.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Time Filter Component
const TimeFilterSelector: React.FC<{
  selected: TimeFilter;
  onSelect: (filter: TimeFilter) => void;
}> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const timeFilterOptions = [
    { value: '1h' as TimeFilter, label: 'Last 1 hour' },
    { value: '2h' as TimeFilter, label: 'Last 2 hours' },
    { value: '12h' as TimeFilter, label: 'Last 12 hours' },
    { value: '24h' as TimeFilter, label: 'Last 24 hours' }
  ];

  const selectedOption = timeFilterOptions.find(opt => opt.value === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedOption?.label}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Time Range
            </div>
            {timeFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  selected === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Search Bar Component
const SearchBar: React.FC<{
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
}> = ({ query, onQueryChange, onSearch, onClear, loading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch();
    }
  };

  return (
    <div className="relative flex-1">
      <div className="absolute inset-y-0 start-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-5 h-5 text-gray-500" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search APIs by name (use commas for multiple APIs)"
        className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
};

// Metrics Cards Component
const MetricsCards: React.FC<{
  totalEntities: number;
  entitiesWithErrors: number;
  totalRequests: number;
  overallErrorRate: number;
}> = ({ totalEntities, entitiesWithErrors, totalRequests, overallErrorRate }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div className="bg-white p-6 rounded-lg shadow">
      <Server className="h-8 w-8 text-blue-600 mb-2" />
      <p className="text-sm font-medium text-gray-500">Total Entities</p>
      <p className="text-3xl font-bold text-gray-900">{totalEntities}</p>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow">
      <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
      <p className="text-sm font-medium text-gray-500">Entities with Errors</p>
      <p className="text-3xl font-bold text-gray-900">{entitiesWithErrors}</p>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow">
      <Activity className="h-8 w-8 text-green-600 mb-2" />
      <p className="text-sm font-medium text-gray-500">Total Requests</p>
      <p className="text-3xl font-bold text-gray-900">{totalRequests.toLocaleString()}</p>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow">
      <CheckCircle className="h-8 w-8 text-orange-600 mb-2" />
      <p className="text-sm font-medium text-gray-500">Error Rate</p>
      <p className="text-3xl font-bold text-gray-900">{overallErrorRate.toFixed(2)}%</p>
    </div>
  </div>
);

// API Table Component
const ApiTable: React.FC<{
  apis: ApiData[];
  onApiClick: (api: ApiData) => void;
  searchQuery: string;
  totalApis: number;
  selectedEnv: Environment | null;
}> = ({ apis, onApiClick, searchQuery, totalApis, selectedEnv }) => (
  <div className="bg-white shadow rounded-lg">
    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <h3 className="text-lg font-medium text-gray-900">APIs List</h3>
      {searchQuery && (
        <span className="text-sm text-gray-500">
          Showing {apis.length} of {totalApis} APIs
        </span>
      )}
    </div>
    
    <div className="overflow-x-auto">
      {apis.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request Volume
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deployment Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                View Logs
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apis.map((api) => (
              <tr
                key={api.id}
                className="hover:bg-blue-50 transition-colors border-l-4 border-transparent hover:border-blue-500"
              >
                <td 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  onClick={() => onApiClick(api)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full mr-3"></div>
                    <div className="text-sm font-medium text-gray-900">{api.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    api.status === 'Running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {api.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {api.requestVolume.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  {api.responseTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-medium ${
                    api.errorRate > 10 ? 'text-red-600' :
                    api.errorRate > 5 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {api.errorRate.toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {api.deploymentType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <a
                    href={generateSplunkUrl(api.name, selectedEnv?.name || 'QA')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Logs
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-6 text-center text-gray-500">
          {searchQuery ? (
            <p>No APIs match your search criteria. Try adjusting your search.</p>
          ) : (
            <p>Enter search terms and click Search to load API data.</p>
          )}
        </div>
      )}
    </div>
  </div>
);

// Main Dashboard Component
const ClaimApiDashboard: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState<ApiData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1h');
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);

  // Custom hooks
  const { environments, loading: envLoading, error: envError } = useEnvironments();
  const { apiData, loading: metricsLoading, error: metricsError, fetchMetrics, clearData } = useApiMetrics();

  // Set default environment when environments are loaded
  useEffect(() => {
    if (environments.length > 0 && !selectedEnv) {
      const prodEnv = environments.find(env => env.name === 'PROD') || environments[0];
      setSelectedEnv(prodEnv);
    }
  }, [environments, selectedEnv]);

  // Filter APIs based on search query
  const filteredData = searchQuery.trim()
    ? apiData.filter(api => {
        const searchTerms = searchQuery.toLowerCase().split(',').map(term => term.trim());
        return searchTerms.some(term => api.name.toLowerCase().includes(term));
      })
    : apiData;

  // Calculate metrics
  const totalRequests = filteredData.reduce((sum, api) => sum + api.requestVolume, 0);
  const totalEntities = filteredData.length;
  const entitiesWithErrors = filteredData.filter(api => api.errorRate > 0).length;
  const overallErrorRate = totalEntities > 0
    ? filteredData.reduce((sum, api) => sum + (api.errorRate * api.requestVolume), 0) / totalRequests
    : 0;

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
      if (searchQuery.trim() && selectedEnv) {
        fetchMetrics(searchQuery, selectedTimeFilter, selectedEnv);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, searchQuery, selectedTimeFilter, selectedEnv, fetchMetrics]);

  // Initialize last updated time
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  // Handle environment change
  const handleEnvironmentChange = useCallback((env: Environment) => {
    setSelectedEnv(env);
    clearData(); // Clear current API data
    setSearchQuery(''); // Clear search query
  }, [clearData]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchQuery.trim() && selectedEnv) {
      fetchMetrics(searchQuery, selectedTimeFilter, selectedEnv);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [searchQuery, selectedTimeFilter, selectedEnv, fetchMetrics]);

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    setLastUpdated(new Date().toLocaleTimeString());
    if (searchQuery.trim() && selectedEnv) {
      fetchMetrics(searchQuery, selectedTimeFilter, selectedEnv);
    }
  }, [searchQuery, selectedTimeFilter, selectedEnv, fetchMetrics]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    clearData();
  }, [clearData]);

  // Handle API click
  const handleApiClick = useCallback((api: ApiData) => {
    setSelectedApi(api);
    setViewMode('details');
  }, []);

  // Handle back to dashboard
  const handleBackToDashboard = useCallback(() => {
    setSelectedApi(null);
    setViewMode('dashboard');
  }, []);

  // API Details Page
  if (viewMode === 'details' && selectedApi) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={handleBackToDashboard}
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <Activity className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  API Details - {selectedApi.name}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Environment: {selectedEnv?.name}</span>
                <a
                  href={generateSplunkUrl(selectedApi.name, selectedEnv?.name || 'QA')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Logs in Splunk
                </a>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedApi.name}</h2>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {selectedApi.type}
              </span>
              <span className="text-sm text-gray-500">Version: {selectedApi.version}</span>
              <span className="text-sm text-gray-500">Deployment: {selectedApi.deploymentType}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedApi.status === 'Running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {selectedApi.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <Activity className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-500">Request Volume</p>
              <p className="text-3xl font-bold text-gray-900">{selectedApi.requestVolume.toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <Clock className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-500">Response Time</p>
              <p className="text-3xl font-bold text-gray-900">{selectedApi.responseTime}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <AlertCircle className={`h-8 w-8 mb-2 ${selectedApi.errorRate < 2 ? 'text-green-600' : selectedApi.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`} />
              <p className="text-sm font-medium text-gray-500">Error Rate</p>
              <p className={`text-3xl font-bold ${selectedApi.errorRate < 2 ? 'text-green-600' : selectedApi.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {selectedApi.errorRate.toFixed(2)}%
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <CheckCircle className={`h-8 w-8 mb-2 ${selectedApi.successRate >= 98 ? 'text-green-600' : selectedApi.successRate >= 95 ? 'text-yellow-600' : 'text-red-600'}`} />
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className={`text-3xl font-bold ${selectedApi.successRate >= 98 ? 'text-green-600' : selectedApi.successRate >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                {selectedApi.successRate.toFixed(2)}%
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <Cpu className="h-8 w-8 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-500">CPU Utilization</p>
              <p className="text-3xl font-bold text-gray-900">{selectedApi.cpuUtil}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <MemoryStick className="h-8 w-8 text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-gray-500">Memory Utilization</p>
              <p className="text-3xl font-bold text-gray-900">{selectedApi.memoryUtil}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Throughput</span>
                  <span className="text-sm font-bold text-gray-900">{selectedApi.throughput}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedApi.lastUpdateTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedApi.createTime).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`text-sm font-bold ${
                    selectedApi.status === 'Running' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedApi.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Deployment Type</span>
                  <span className="text-sm text-gray-900">{selectedApi.deploymentType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Version</span>
                  <span className="text-sm text-gray-900">{selectedApi.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Environment</span>
                  <span className="text-sm text-gray-900">{selectedEnv?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">API Monitoring Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto Refresh Toggle */}
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Auto Refresh</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Manual Refresh */}
              <button
                onClick={handleManualRefresh}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                title="Manual Refresh"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Environment Selector */}
              <EnvironmentSelector
                environments={environments}
                selectedEnv={selectedEnv}
                onSelect={handleEnvironmentChange}
                loading={envLoading}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Updated */}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
          {autoRefresh && (
            <span className="text-sm text-blue-600 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Auto-refreshing every 30s
            </span>
          )}
        </div>

        {/* Error Display */}
        {(envError || metricsError) && (
          <div className="mb-6">
            {envError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <h3 className="text-sm font-medium text-red-800">Environment Loading Error</h3>
                </div>
                <p className="mt-2 text-sm text-red-700">{envError}</p>
                {ENABLE_MOCK_MODE && (
                  <p className="mt-1 text-xs text-red-600">Currently using mock data for development.</p>
                )}
              </div>
            )}
            {metricsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <h3 className="text-sm font-medium text-red-800">API Call Failed</h3>
                </div>
                <p className="mt-2 text-sm text-red-700">{metricsError}</p>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      if (searchQuery.trim() && selectedEnv) {
                        fetchMetrics(searchQuery, selectedTimeFilter, selectedEnv);
                      }
                    }}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Development Mode Indicator */}
        {ENABLE_MOCK_MODE && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
              <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
            </div>
            <p className="mt-2 text-sm text-yellow-700">
              Using mock data. Set ENABLE_MOCK_MODE to false to use real API calls.
            </p>
          </div>
        )}
        <div className="mb-6">
          <div className="flex gap-2 mb-2">
            <TimeFilterSelector
              selected={selectedTimeFilter}
              onSelect={setSelectedTimeFilter}
            />
            
            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={metricsLoading}
            />
            
            <button
              onClick={handleSearch}
              disabled={metricsLoading || !searchQuery.trim() || !selectedEnv}
              className="flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>
            
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-3 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Metrics */}
        <MetricsCards
          totalEntities={totalEntities}
          entitiesWithErrors={entitiesWithErrors}
          totalRequests={totalRequests}
          overallErrorRate={overallErrorRate}
        />

        {/* API Table */}
        <ApiTable
          apis={filteredData}
          onApiClick={handleApiClick}
          searchQuery={searchQuery}
          totalApis={apiData.length}
          selectedEnv={selectedEnv}
        />
      </div>
    </div>
  );
};

export default ClaimApiDashboard;
