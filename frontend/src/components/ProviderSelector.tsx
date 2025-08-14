import React, { useState, useEffect } from 'react';
import { Provider, ProviderStatus } from '../types';
import { ApiService } from '../services/api';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ProviderSelectorProps {
  onProviderChange: (providerId: string) => void;
  selectedProvider: string;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ 
  onProviderChange, 
  selectedProvider 
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<Map<string, ProviderStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load providers and their statuses
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const providersData = await ApiService.getProviders();
        setProviders(providersData);
        
        // Load status for each provider
        const statuses = new Map<string, ProviderStatus>();
        for (const provider of providersData) {
          try {
            const status = await ApiService.getProviderStatus(provider.id);
            statuses.set(provider.id, status);
          } catch (error) {
            console.error(`Failed to get status for provider ${provider.id}:`, error);
            statuses.set(provider.id, { available: false, reason: 'Failed to check status' });
          }
        }
        setProviderStatuses(statuses);
      } catch (error) {
        console.error('Failed to load providers:', error);
        setError('Failed to load providers');
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

  const handleProviderSelect = async (providerId: string) => {
    try {
      await onProviderChange(providerId);
    } catch (error) {
      console.error('Failed to select provider:', error);
    }
  };

  const getStatusIcon = (status: ProviderStatus) => {
    if (status.available) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-xs text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-3">
      {providers.map((provider) => {
        const status = providerStatuses.get(provider.id) || { available: false, reason: 'Unknown' };
        const isSelected = selectedProvider === provider.id;
        
        return (
          <div key={provider.id} className="relative">
            {/* Main Provider Card */}
            <div
              className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all min-w-[140px] ${
                isSelected 
                  ? 'border-purple-500 bg-purple-900/20 ring-2 ring-purple-500/50' 
                  : status.available 
                    ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                    : 'border-red-600 bg-red-900/20'
              }`}
              onClick={() => handleProviderSelect(provider.id)}
            >
              {/* Provider Icon and Name */}
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(status)}
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-purple-200' : 'text-white'
                }`}>
                  {provider.name}
                </span>
              </div>
              
              {/* Cost Badge */}
              <span className={`hidden inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                provider.id === 'mock' 
                  ? 'bg-green-900 text-green-300'
                  : provider.id === '5sim'
                  ? 'bg-blue-900 text-blue-300'
                  : provider.id === 'twilio'
                  ? 'bg-purple-900 text-purple-300'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {provider.cost}
              </span>
              
              {/* Selection Indicator */}
              {isSelected && (
                <CheckCircle className="w-4 h-4 text-purple-400" />
              )}
            </div>

            {/* Error Messages for Unavailable Providers */}
            {status && !status.available && (
              <div className="absolute top-full left-0 mt-2 w-64 text-xs text-red-400 px-2 py-1 bg-red-900/20 rounded z-10">
                <strong>{provider.name}:</strong> {status.reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}; 