'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronDown, Activity, AlertCircle, CheckCircle, Clock, Server, ArrowLeft, RotateCcw, Search } from 'lucide-react';

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

interface MetricsResponse {
  response: {
    envId: string;
    orgId: string;
    timeFrom: string;
    timeTo: string;
    entities: ApiEntity[];
  };
}

type ViewMode = 'dashboard' | 'details';
type TimeFilter = '1h' | '2h' | '12h' | '24h';

// API Configuration - Update these values as needed
const API_CONFIG = {
  BASE_URL: 'http://localhost:8081/v1/api',
  HEADERS: {
    'Content-Type': 'application/json',
    'client_id': 'your-client-id',        // Replace with your actual client_id
    'client_secret': 'your-client-secret' // Replace with your actual client_secret
  }
};

const ClaimApiDashboard: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiData | null>(null);
  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTimeFilterDropdownOpen, setIsTimeFilterDropdownOpen] = useState<boolean>(false);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1h');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [apiData, setApiData] = useState<ApiData[]>([]);
  const [isLoadingEnvironments, setIsLoadingEnvironments] = useState<boolean>(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Time filter options
  const timeFilterOptions = [
    { value: '1h' as TimeFilter, label: 'Last 1 hour' },
    { value: '2h' as TimeFilter, label: 'Last 2 hours' },
    { value: '12h' as TimeFilter, label: 'Last 12 hours' },
    { value: '24h' as TimeFilter, label: 'Last 24 hours' }
  ];

  // Calculate time range based on filter
  const getTimeRange = useCallback((timeFilter: TimeFilter) => {
    const now = new Date();
    const timeTo = now.toISOString();
   
    let hoursBack = 1;
    switch (timeFilter) {
      case '2h':
        hoursBack = 2;
        break;
      case '12h':
        hoursBack = 12;
        break;
      case '24h':
        hoursBack = 24;
        break;
      default:
        hoursBack = 1;
    }
   
    const timeFrom = new Date(now.getTime() - hoursBack * 60 * 60 * 1000).toISOString();
    return { timeFrom, timeTo };
  }, []);

  // Fetch environments from API
  const fetchEnvironments = useCallback(async () => {
    try {
      setIsLoadingEnvironments(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/environments`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({
          action: "Clear"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch environments');
      }

      const environments: Environment[] = await response.json();
      setEnvironments(environments);
     
      // Set default environment (PROD if available, otherwise first one)
      const prodEnv = environments.find(env => env.name === 'PROD');
      const defaultEnv = prodEnv || environments[0];
      if (defaultEnv) {
        setSelectedEnv(defaultEnv);
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
      // Fallback to mock data in case of error
      const fallbackEnvs: Environment[] = [
        { envId: "prod-id", name: "PROD", orgId: "org-id" },
        { envId: "qa-id", name: "QA", orgId: "org-id" }
      ];
      setEnvironments(fallbackEnvs);
      setSelectedEnv(fallbackEnvs[0]);
    } finally {
      setIsLoadingEnvironments(false);
    }
  }, []);

  // Convert API entity to internal format
  const convertToApiData = useCallback((entity: ApiEntity, index: number): ApiData => {
    const errorRate = entity.reqVolume > 0 ? (entity.errorVolume / entity.reqVolume) * 100 : 0;
    const successRate = 100 - errorRate;
   
    return {
      id: index + 1,
      name: entity.appName,
      type: 'Application', // Could be determined by some logic
      requestVolume: entity.reqVolume,
      responseTime: `${entity.responseTime.toFixed(2)}ms`,
      errorRate,
      successRate,
      deploymentType: entity.deploymentType,
      version: entity.version
    };
  }, []);

  // API call function for fetching metrics
  const performSearch = useCallback(async (query: string, timeFilter: TimeFilter, environment: Environment) => {
    if (!environment) return;
   
    setIsSearching(true);
   
    try {
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

      const response = await fetch(`${API_CONFIG.BASE_URL}/metrics`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data: MetricsResponse = await response.json();
      const convertedData = data.response.entities.map((entity, index) =>
        convertToApiData(entity, index)
      );
     
      setApiData(convertedData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setApiData([]);
    } finally {
      setIsSearching(false);
    }
  }, [getTimeRange, convertToApiData]);

  // Remove auto-search - only search when button is clicked

  // Filter APIs based on comma-separated search query
  const filterApis = useCallback((apis: ApiData[], query: string): ApiData[] => {
    if (!query.trim()) return apis;
   
    const searchTerms = query.toLowerCase().split(',').map(term => term.trim()).filter(term => term);
   
    if (searchTerms.length === 0) return apis;
   
    return apis.filter(api =>
      searchTerms.some(term => api.name.toLowerCase().includes(term))
    );
  }, []);

  const filteredData: ApiData[] = useMemo(() => filterApis(apiData, searchQuery), [apiData, searchQuery, filterApis]);
 
  // Calculate overall metrics based on filtered data
  const { totalRequests, totalEntities, entitiesWithErrors, overallErrorRate } = useMemo(() => {
    const total = filteredData.reduce((sum: number, api: ApiData) => sum + api.requestVolume, 0);
    const entities = filteredData.length;
    const withErrors = filteredData.filter((api: ApiData) => api.errorRate > 0).length;
    const errorRate = entities > 0
      ? filteredData.reduce((sum: number, api: ApiData) => sum + (api.errorRate * api.requestVolume), 0) / total
      : 0;
   
    return {
      totalRequests: total,
      totalEntities: entities,
      entitiesWithErrors: withErrors,
      overallErrorRate: errorRate
    };
  }, [filteredData]);

  // Fetch environments on component mount
  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  // Initialize time after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
   
    if (autoRefresh) {
      interval = setInterval(() => {
        setLastUpdated(new Date().toLocaleTimeString());
        // Here you would typically fetch fresh data from your API
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleApiClick = useCallback((api: ApiData): void => {
    setSelectedApi(api);
    setViewMode('details');
  }, []);

  const handleBackToDashboard = useCallback((): void => {
    setSelectedApi(null);
    setViewMode('dashboard');
  }, []);

  const handleManualRefresh = useCallback((): void => {
    setLastUpdated(new Date().toLocaleTimeString());
    // Here you would typically fetch fresh data from your API
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchButtonClick = useCallback((): void => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, selectedTimeFilter, selectedEnv);
    }
  }, [searchQuery, selectedTimeFilter, selectedEnv, performSearch]);

  const handleTimeFilterSelect = useCallback((timeFilter: TimeFilter): void => {
    setSelectedTimeFilter(timeFilter);
    setIsTimeFilterDropdownOpen(false);
  }, []);

  const handleClearSearch = useCallback((): void => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        performSearch(searchQuery, selectedTimeFilter, selectedEnv);
      }
    }
  }, [searchQuery, selectedTimeFilter, selectedEnv, performSearch]);

  const getErrorRateColor = (errorRate: number): string => {
    if (errorRate < 2) return 'text-green-600';
    if (errorRate < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateColor = (successRate: number): string => {
    if (successRate >= 98) return 'text-green-600';
    if (successRate >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Memoize the ApiDetailsPage component
  const ApiDetailsPage = useMemo(() => {
    if (!selectedApi) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar for Details Page */}
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
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* API Header */}
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedApi.name}</h2>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedApi.type === 'Application'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedApi.type}
                  </span>
                  <span className="text-sm text-gray-500">ID: {selectedApi.id}</span>
                  <span className="text-sm text-gray-500">Environment: {selectedEnv?.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600 mb-2" />
              </div>
              <p className="text-sm font-medium text-gray-500">Request Volume</p>
              <p className="text-3xl font-bold text-gray-900">{selectedApi.requestVolume.toLocaleString()}</p>
            </div>
           
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600 mb-2" />
              </div>
              <p className="text-sm font-medium text-gray-500">Response Time (p99)</p>
              <p className="text-3xl font-bold text-gray-900">{selectedApi.responseTime}</p>
            </div>
           
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <AlertCircle className={`h-8 w-8 mb-2 ${selectedApi.errorRate < 2 ? 'text-green-600' : selectedApi.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
              <p className="text-sm font-medium text-gray-500">Error Rate</p>
              <p className={`text-3xl font-bold ${getErrorRateColor(selectedApi.errorRate)}`}>
                {selectedApi.errorRate.toFixed(2)}%
              </p>
            </div>
           
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className={`h-8 w-8 mb-2 ${selectedApi.successRate >= 98 ? 'text-green-600' : selectedApi.successRate >= 95 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className={`text-3xl font-bold ${getSuccessRateColor(selectedApi.successRate)}`}>
                {selectedApi.successRate.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Deployment Details</h4>
                <p className="text-lg text-gray-900">{selectedApi.deploymentType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">API Type</h4>
                <p className="text-lg text-gray-900">{selectedApi.type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Version</h4>
                <p className="text-lg text-gray-900">{selectedApi.version}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedApi.errorRate < 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedApi.errorRate < 5 ? 'Healthy' : 'Needs Attention'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h4>
                <p className="text-lg text-gray-900">{isMounted ? lastUpdated : '--:--:--'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [selectedApi, selectedEnv, lastUpdated, isMounted, handleBackToDashboard]);

  // Memoize the DashboardPage component
  const DashboardPage = useMemo(() => (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Monitoring Dashboard</h1>
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
                <span className={`text-xs ${autoRefresh ? 'text-blue-600' : 'text-gray-500'}`}>
                  {autoRefresh ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                title="Manual Refresh"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Environment Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsEnvDropdownOpen(!isEnvDropdownOpen)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingEnvironments}
                >
                  {isLoadingEnvironments ? 'Loading...' : selectedEnv?.name || 'Select Environment'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
               
                {isEnvDropdownOpen && !isLoadingEnvironments && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                      {environments.map((env: Environment) => (
                        <button
                          key={env.envId}
                          onClick={() => {
                            setSelectedEnv(env);
                            setIsEnvDropdownOpen(false);
                            // Clear current data when switching environments
                            setApiData([]);
                            setSearchQuery('');
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
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
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Updated Info */}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Last updated: {isMounted ? lastUpdated : '--:--:--'}
          </span>
          {autoRefresh && (
            <span className="text-sm text-blue-600 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Auto-refreshing every 30s
            </span>
          )}
        </div>

        {/* Search Bar with Time Filter Dropdown and Search Button */}
        <div className="mb-6">
          <div className="flex gap-2">
            {/* Time Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTimeFilterDropdownOpen(!isTimeFilterDropdownOpen)}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeFilterOptions.find(opt => opt.value === selectedTimeFilter)?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
             
              {isTimeFilterDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Time Range
                    </div>
                    {timeFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleTimeFilterSelect(option.value)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          selectedTimeFilter === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 start-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-500" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Search APIs by name (use commas for multiple APIs e.g. claim-processing, claim-validation)"
                className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
           
            {/* Search Button */}
            <button
              onClick={handleSearchButtonClick}
              className="flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isSearching}
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
         
          {/* Search Info */}
          <div className="mt-2 flex justify-between items-center text-sm text-gray-600">
            {searchQuery && (
              <span className="font-medium">Showing {filteredData.length} of {apiData.length} APIs</span>
            )}
            <span className="text-gray-500">
              Selected: {timeFilterOptions.find(opt => opt.value === selectedTimeFilter)?.label}
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Server className="h-8 w-8 text-blue-600 mb-2" />
              </div>
              <p className="text-sm font-medium text-gray-500">Total Entities</p>
              <p className="text-3xl font-bold text-gray-900">{totalEntities}</p>
            </div>
           
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
              </div>
              <p className="text-sm font-medium text-gray-500">Entities with Errors</p>
              <p className="text-3xl font-bold text-gray-900">{entitiesWithErrors}</p>
            </div>
           
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600 mb-2" />
              </div>
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{totalRequests.toLocaleString()}</p>
            </div>
           
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-orange-600 mb-2" />
              </div>
              <p className="text-sm font-medium text-gray-500">Error Rate</p>
              <p className="text-3xl font-bold text-gray-900">{overallErrorRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* APIs List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">APIs List</h3>
            {filteredData.length === 0 && searchQuery && (
              <span className="text-sm text-gray-500">No APIs match your search criteria</span>
            )}
          </div>
         
          <div className="overflow-x-auto">
            {filteredData.length > 0 ? (
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((api: ApiData) => (
                    <tr
                      key={api.id}
                      onClick={() => handleApiClick(api)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full mr-3"></div>
                          <div className="text-sm font-medium text-gray-900">{api.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          api.errorRate > 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {api.errorRate > 10 ? 'Not Running' : 'Running'}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? (
                  <p>No APIs match your search criteria. Try adjusting your search.</p>
                ) : selectedEnv ? (
                  <p>Enter search terms and click Search to load API data.</p>
                ) : (
                  <p>Please select an environment to begin.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ), [
    selectedEnv,
    autoRefresh,
    lastUpdated,
    isMounted,
    searchQuery,
    filteredData,
    apiData,
    handleSearchButtonClick,
    handleClearSearch,
    handleSearchInputChange,
    handleKeyPress,
    searchInputRef,
    entitiesWithErrors,
    handleApiClick,
    handleManualRefresh,
    isEnvDropdownOpen,
    overallErrorRate,
    totalEntities,
    totalRequests,
    isTimeFilterDropdownOpen,
    selectedTimeFilter,
    timeFilterOptions,
    handleTimeFilterSelect,
    isSearching,
    environments,
    isLoadingEnvironments
  ]);

  // Render based on view mode
  return viewMode === 'details' ? ApiDetailsPage : DashboardPage;
};

export default ClaimApiDashboard;
