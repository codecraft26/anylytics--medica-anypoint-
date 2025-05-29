'use client'

import React, { useState, useEffect } from 'react';
import { ChevronDown, Activity, AlertCircle, CheckCircle, Clock, Server, ArrowLeft, RotateCcw } from 'lucide-react';

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
}

interface ApiDataByEnv {
  PROD: ApiData[];
  QA: ApiData[];
}

type Environment = 'PROD' | 'QA';
type ViewMode = 'dashboard' | 'details';

const ClaimApiDashboard: React.FC = () => {
  const [selectedEnv, setSelectedEnv] = useState<Environment>('PROD');
  const [selectedApi, setSelectedApi] = useState<ApiData | null>(null);
  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Sample API data based on the image
  const apiData: ApiDataByEnv = {
    PROD: [
      {
        id: 1,
        name: 'claim-processing-api',
        type: 'Application',
        requestVolume: 45821,
        responseTime: '189.30ms',
        errorRate: 2.15,
        successRate: 97.85,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 2,
        name: 'claim-validation-api',
        type: 'API',
        requestVolume: 32456,
        responseTime: '245.60ms',
        errorRate: 5.20,
        successRate: 94.80,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 3,
        name: 'claim-eligibility-api',
        type: 'Application',
        requestVolume: 28140,
        responseTime: '156.40ms',
        errorRate: 1.85,
        successRate: 98.15,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 4,
        name: 'claim-notification-api',
        type: 'Application',
        requestVolume: 19876,
        responseTime: '312.80ms',
        errorRate: 8.70,
        successRate: 91.30,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 5,
        name: 'claim-documents-api',
        type: 'API',
        requestVolume: 15432,
        responseTime: '198.20ms',
        errorRate: 3.45,
        successRate: 96.55,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 6,
        name: 'claim-payment-api',
        type: 'Application',
        requestVolume: 12675,
        responseTime: '425.10ms',
        errorRate: 12.30,
        successRate: 87.70,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 7,
        name: 'claim-history-api',
        type: 'API',
        requestVolume: 9854,
        responseTime: '167.90ms',
        errorRate: 0.95,
        successRate: 99.05,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 8,
        name: 'claim-status-api',
        type: 'Application',
        requestVolume: 8765,
        responseTime: '134.50ms',
        errorRate: 2.80,
        successRate: 97.20,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 9,
        name: 'claim-audit-api',
        type: 'API',
        requestVolume: 6543,
        responseTime: '145.20ms',
        errorRate: 1.25,
        successRate: 98.75,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 10,
        name: 'claim-reporting-api',
        type: 'Application',
        requestVolume: 5432,
        responseTime: '178.90ms',
        errorRate: 2.45,
        successRate: 97.55,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 11,
        name: 'claim-analytics-api',
        type: 'API',
        requestVolume: 4321,
        responseTime: '234.50ms',
        errorRate: 3.75,
        successRate: 96.25,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 12,
        name: 'claim-workflow-api',
        type: 'Application',
        requestVolume: 3456,
        responseTime: '167.80ms',
        errorRate: 1.95,
        successRate: 98.05,
        deploymentType: 'CloudHub 2.0'
      }
      
      
    ],
    QA: [
      {
        id: 1,
        name: 'claim-processing-api',
        type: 'Application',
        requestVolume: 1250,
        responseTime: '195.40ms',
        errorRate: 4.20,
        successRate: 95.80,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 2,
        name: 'claim-validation-api',
        type: 'API',
        requestVolume: 890,
        responseTime: '278.90ms',
        errorRate: 7.80,
        successRate: 92.20,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 3,
        name: 'claim-eligibility-api',
        type: 'Application',
        requestVolume: 756,
        responseTime: '189.60ms',
        errorRate: 3.15,
        successRate: 96.85,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 4,
        name: 'claim-notification-api',
        type: 'Application',
        requestVolume: 432,
        responseTime: '298.40ms',
        errorRate: 6.25,
        successRate: 93.75,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 5,
        name: 'claim-documents-api',
        type: 'API',
        requestVolume: 321,
        responseTime: '187.30ms',
        errorRate: 4.85,
        successRate: 95.15,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 6,
        name: 'claim-payment-api',
        type: 'Application',
        requestVolume: 287,
        responseTime: '412.60ms',
        errorRate: 8.95,
        successRate: 91.05,
        deploymentType: 'CloudHub 2.0'
      },
      {
        id: 7,
        name: 'claim-audit-api',
        type: 'API',
        requestVolume: 198,
        responseTime: '156.70ms',
        errorRate: 3.45,
        successRate: 96.55,
        deploymentType: 'CloudHub 2.0'
      }
    ]
  };

  const currentData: ApiData[] = apiData[selectedEnv];
  
  // Calculate overall metrics
  const totalRequests: number = currentData.reduce((sum: number, api: ApiData) => sum + api.requestVolume, 0);
  const totalEntities: number = currentData.length;
  const entitiesWithErrors: number = currentData.filter((api: ApiData) => api.errorRate > 0).length;
  const overallErrorRate: number = currentData.reduce((sum: number, api: ApiData) => sum + (api.errorRate * api.requestVolume), 0) / totalRequests;

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

  const handleApiClick = (api: ApiData): void => {
    setSelectedApi(api);
    setViewMode('details');
  };

  const handleBackToDashboard = (): void => {
    setSelectedApi(null);
    setViewMode('dashboard');
  };

  const handleManualRefresh = (): void => {
    setLastUpdated(new Date().toLocaleTimeString());
    // Here you would typically fetch fresh data from your API
  };

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

  // API Details Page Component
  const ApiDetailsPage = () => {
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
                <span className="text-sm text-gray-500">Environment: {selectedEnv}</span>
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
                  <span className="text-sm text-gray-500">Environment: {selectedEnv}</span>
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
  };

  // Dashboard Page Component
  const DashboardPage = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">ClaimApi Dashboard</h1>
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
                >
                  Environment: {selectedEnv}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
                
                {isEnvDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                      {(['QA', 'PROD'] as Environment[]).map((env: Environment) => (
                        <button
                          key={env}
                          onClick={() => {
                            setSelectedEnv(env);
                            setIsEnvDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            selectedEnv === env ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {env}
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">APIs List</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
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
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deployment Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((api: ApiData) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        api.type === 'Application' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {api.type}
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
                      <span className={`font-medium ${getErrorRateColor(api.errorRate)}`}>
                        {api.errorRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getSuccessRateColor(api.successRate)}`}>
                        {api.successRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {api.deploymentType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Render based on view mode
  return viewMode === 'details' ? <ApiDetailsPage /> : <DashboardPage />;
};

export default ClaimApiDashboard;