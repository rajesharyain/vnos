import { 
  VirtualNumber, 
  OTP, 
  CreateVirtualNumberResponse, 
  GetOTPsResponse, 
  CancelNumberResponse, 
  ResendOTPResponse,
  Provider,
  ProviderStatus,
  ProvidersResponse,
  ProviderStatusResponse,
  SelectProviderResponse,
  Country,
  Product,
  CountryDetails
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * API Service for Virtual Number Operations
 * 
 * Handles all HTTP requests to the backend API
 */
export class ApiService {
  /**
   * Get the currently selected provider
   */
  static async getSelectedProvider(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers/selected`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data.providerId;
      }
      return null;
    } catch (error) {
      console.error('Failed to get selected provider:', error);
      return null;
    }
  }

  static async getSelectedProviderDetails(): Promise<{ providerId: string; status: any; selectedAt: string } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers/selected`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get selected provider details:', error);
      return null;
    }
  }

  /**
   * Get all available providers
   */
  static async getProviders(): Promise<Provider[]> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers`);
    const data: ProvidersResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch providers');
    }

    return data.data || [];
  }

  /**
   * Get status of a specific provider
   */
  static async getProviderStatus(providerId: string): Promise<ProviderStatus> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers/${encodeURIComponent(providerId)}/status`);
    const data: ProviderStatusResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch provider status');
    }

    return data.data!;
  }

  /**
   * Select a specific provider
   */
  static async selectProvider(providerId: string): Promise<{ providerId: string; providerName: string }> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers/${encodeURIComponent(providerId)}/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: SelectProviderResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to select provider');
    }

    return data.data;
  }

  /**
   * Request a new virtual number
   */
  static async requestNumber(): Promise<VirtualNumber> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: CreateVirtualNumberResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to request virtual number');
    }

    return data.data;
  }

  /**
   * Get all active virtual numbers
   */
  static async getActiveNumbers(): Promise<VirtualNumber[]> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch virtual numbers');
    }

    return data.data || [];
  }

  /**
   * Get OTPs for a specific number
   */
  static async getOTPs(number: string): Promise<OTP[]> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers/${encodeURIComponent(number)}/otps`);
    const data: GetOTPsResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch OTPs');
    }

    return data.data || [];
  }

  /**
   * Cancel/Release a virtual number
   */
  static async cancelNumber(number: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers/${encodeURIComponent(number)}`, {
      method: 'DELETE',
    });

    const data: CancelNumberResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to cancel number');
    }

    return true;
  }

  /**
   * Resend OTP for a number
   */
  static async resendOTP(number: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers/${encodeURIComponent(number)}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: ResendOTPResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to resend OTP');
    }

    return true;
  }

  /**
   * Get a specific virtual number
   */
  static async getNumber(number: string): Promise<VirtualNumber> {
    const response = await fetch(`${API_BASE_URL}/virtual-numbers/${encodeURIComponent(number)}`);
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Virtual number not found');
    }

    return data.data;
  }

  static async getProviderCountries(providerId: string): Promise<Country[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers/${providerId}/countries`);
      const result = await response.json();
      
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error(`Failed to get countries for provider ${providerId}:`, error);
      return [];
    }
  }

  static async getProviderProducts(providerId: string, countryId: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers/${providerId}/countries/${countryId}/products`);
      const result = await response.json();
      
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error(`Failed to get products for provider ${providerId} and country ${countryId}:`, error);
      return [];
    }
  }

  static async getCountryDetails(providerId: string, countryId: string): Promise<CountryDetails | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/virtual-numbers/providers/${providerId}/countries/${countryId}/details`);
      const result = await response.json();
      
      if (result.success) {
        return result.data || null;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get country details for provider ${providerId} and country ${countryId}:`, error);
      return null;
    }
  }

  static async requestVirtualNumber(productId: string, countryId: string = 'india', operatorId?: string): Promise<VirtualNumber> {
    try {
      const response = await fetch(`${API_BASE_URL}/virtual-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: productId,
          country: countryId,
          operator: operatorId
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to request virtual number');
      }
      
      return data.data;
    } catch (error) {
      console.error('Failed to request virtual number:', error);
      throw error;
    }
  }

  static async checkOtps(phoneNumber: string): Promise<OTP[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/virtual-numbers/${phoneNumber}/otps`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check OTPs');
      }
      
      return data.data;
    } catch (error) {
      console.error('Failed to check OTPs:', error);
      throw error;
    }
  }

  /**
   * Get real-time product price from 5SIM
   */
  static async getProductPrice(productId: string, countryId: string = 'usa'): Promise<{ usdCost: number; inrCost: number; count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/price/${productId}/${countryId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get price: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return {
          usdCost: result.data.usdCost,
          inrCost: result.data.inrCost,
          count: result.data.count
        };
      } else {
        throw new Error(result.message || 'Failed to get product price');
      }
    } catch (error) {
      console.error('Error getting product price:', error);
      throw error;
    }
  }
} 