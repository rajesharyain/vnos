import { VirtualNumberProvider, OTP } from '../types';

/**
 * 5SIM Virtual Number Provider
 * 
 * Provides virtual numbers through 5sim.net
 * Cost: $0.10-0.50 per number (much cheaper than Twilio)
 * Coverage: India, US, Europe
 * 
 * API Documentation: https://5sim.net/docs
 */
export class FiveSimProvider implements VirtualNumberProvider {
  private apiKey: string;
  private baseUrl: string;
  private activeNumbers: Map<string, { id: string; otps: OTP[]; activationTime: Date; timeoutId: NodeJS.Timeout | null }> = new Map();

  constructor() {
    this.apiKey = process.env.FIVESIM_API_KEY || '';
    this.baseUrl = 'https://5sim.net/v1';
    
    if (!this.apiKey) {
      throw new Error('5SIM API key not configured. Please set FIVESIM_API_KEY environment variable.');
    }
  }

  /**
   * Get the authorization header for 5SIM API calls
   */
  private getAuthHeaders(): Record<string, string> {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };
    
    console.log(`[5SIM] Using auth headers: Authorization: Bearer ${this.apiKey.substring(0, 10)}...`);
    return headers;
  }

  /**
   * Request a new virtual number from 5SIM
   */
  async requestNumber(): Promise<string> {
    try {
      console.log('[5SIM] Requesting Indian virtual number...');
      
      // 5SIM has India available with country code 'india'
      const countryId = 'india';
      
      // Get available products for India
      const products = await this.getAvailableProducts(countryId);
      if (products.length === 0) {
        throw new Error('No products available for India in 5SIM.');
      }

      // Find the best available product (prefer virtual21, then virtual4, then virtual58)
      const preferredProducts = ['virtual21', 'virtual4', 'virtual58'];
      let selectedProduct = null;
      
      for (const preferred of preferredProducts) {
        const product = products.find(p => p.id === preferred);
        if (product) {
          selectedProduct = product;
          break;
        }
      }

      // If no preferred product, use any available product
      if (!selectedProduct) {
        selectedProduct = products[0];
      }

      console.log(`[5SIM] Selected product: ${selectedProduct.id} for India`);

      // Request activation with specific product
      const response = await fetch(`${this.baseUrl}/buy/activation/${countryId}/${selectedProduct.id}/any`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[5SIM] API Error: ${response.status} ${response.statusText}`);
        console.error(`[5SIM] Response: ${errorText}`);
        console.error(`[5SIM] Request URL: ${response.url}`);
        console.error(`[5SIM] Auth Header: Bearer ${this.apiKey.substring(0, 10)}...`);
        
        if (response.status === 403) {
          throw new Error('5SIM API error: 403 Forbidden. This usually means invalid JWT token or insufficient balance. Please check your FIVESIM_API_KEY.');
        } else if (response.status === 401) {
          throw new Error('5SIM API error: 401 Unauthorized. Please check your FIVESIM_API_KEY JWT token.');
        } else if (response.status === 400) {
          throw new Error('5SIM API error: 400 Bad Request. Service or country not available.');
        } else {
          throw new Error(`5SIM API error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json() as any;
      console.log('[5SIM] API response:', JSON.stringify(result, null, 2));

      if (result.id && result.phone) {
        const phoneNumber = result.phone;
        const activationId = result.id;
        
        // Store the activation for OTP checking
        this.activeNumbers.set(phoneNumber, {
          id: activationId,
          otps: [],
          activationTime: new Date(),
          timeoutId: setTimeout(() => this.autoCancelNumber(phoneNumber), 30000) // 30 seconds
        });

        console.log(`[5SIM] Successfully requested number: ${phoneNumber} (Activation ID: ${activationId})`);
        console.log(`[5SIM] Auto-cancellation set for 30 seconds if no SMS received`);
        return phoneNumber;
      } else {
        throw new Error('Invalid response from 5SIM API: missing phone number or activation ID');
      }
    } catch (error) {
      console.error('[5SIM] Error requesting number:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to request 5SIM number: ${errorMessage}`);
    }
  }

  /**
   * Auto-cancel number after 30 seconds if no SMS received
   */
  private async autoCancelNumber(number: string): Promise<void> {
    try {
      const numberData = this.activeNumbers.get(number);
      if (!numberData) {
        return;
      }

      // Check if we received any OTPs
      if (numberData.otps.length === 0) {
        console.log(`[5SIM] Auto-cancelling number ${number} after 30 seconds (no SMS received)`);
        
        // Cancel the activation
        const response = await fetch(`${this.baseUrl}/user/cancel/${numberData.id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        if (response.ok) {
          console.log(`[5SIM] Successfully auto-cancelled number: ${number}`);
          console.log(`[5SIM] Refund will be processed automatically by 5SIM`);
        } else {
          console.warn(`[5SIM] Failed to auto-cancel number ${number}: ${response.status}`);
        }

        // Remove from active numbers
        this.activeNumbers.delete(number);
      } else {
        console.log(`[5SIM] Number ${number} received SMS, keeping active`);
      }
    } catch (error) {
      console.error(`[5SIM] Error in auto-cancellation for ${number}:`, error);
    }
  }

  /**
   * Check for new OTPs from 5SIM
   */
  async checkForOTP(number: string): Promise<OTP[]> {
    try {
      const numberData = this.activeNumbers.get(number);
      if (!numberData) {
        return [];
      }

      // Check activation status
      const response = await fetch(`${this.baseUrl}/user/check/${numberData.id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        console.warn(`[5SIM] Failed to check OTP status: ${response.status}`);
        return [];
      }

      const result = await response.json() as any;
      console.log(`[5SIM] Status for ${number}:`, JSON.stringify(result, null, 2));

      // Check if SMS was received
      if (result.sms && result.sms.length > 0) {
        const newOtps: OTP[] = [];
        
        for (const sms of result.sms) {
          if (sms.text) {
            const otpCode = this.extractOTPFromMessage(sms.text);
            if (otpCode) {
              // Check if this OTP is new
              const existingOtp = numberData.otps.find(o => o.code === otpCode);
              if (!existingOtp) {
                const otp: OTP = {
                  id: `5sim_${sms.id || Date.now()}`,
                  code: otpCode,
                  receivedAt: new Date(),
                  isUsed: false
                };
                
                numberData.otps.push(otp);
                newOtps.push(otp);
                console.log(`[5SIM] Found new OTP: ${otpCode} for ${number}`);
                
                // Clear the auto-cancellation timeout since we received SMS
                if (numberData.timeoutId) {
                  clearTimeout(numberData.timeoutId);
                  numberData.timeoutId = null;
                }
              }
            }
          }
        }
        
        if (newOtps.length > 0) {
          this.activeNumbers.set(number, numberData);
          return newOtps;
        }
      }

      return [];
    } catch (error) {
      console.error(`[5SIM] Error checking OTPs for ${number}:`, error);
      return [];
    }
  }

  /**
   * Cancel/Release a virtual number
   */
  async cancelNumber(number: string): Promise<boolean> {
    try {
      const numberData = this.activeNumbers.get(number);
      if (!numberData) {
        return false;
      }

      // Clear the auto-cancellation timeout
      if (numberData.timeoutId) {
        clearTimeout(numberData.timeoutId);
      }

      // Cancel the activation
      const response = await fetch(`${this.baseUrl}/user/cancel/${numberData.id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        console.log(`[5SIM] Successfully cancelled number: ${number}`);
        console.log(`[5SIM] Refund will be processed automatically by 5SIM`);
        this.activeNumbers.delete(number);
        return true;
      } else {
        console.warn(`[5SIM] Failed to cancel number ${number}: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`[5SIM] Error cancelling number ${number}:`, error);
      return false;
    }
  }

  /**
   * Resend OTP for a number
   */
  async resendOTP(number: string): Promise<boolean> {
    try {
      const numberData = this.activeNumbers.get(number);
      if (!numberData) {
        return false;
      }

      // Request OTP resend
      const response = await fetch(`${this.baseUrl}/user/repeat/${numberData.id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        console.log(`[5SIM] Successfully requested OTP resend for number: ${number}`);
        return true;
      } else {
        console.warn(`[5SIM] Failed to resend OTP for ${number}: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`[5SIM] Error resending OTP for ${number}:`, error);
      return false;
    }
  }

  /**
   * Extract OTP code from SMS message content
   */
  private extractOTPFromMessage(messageBody: string): string | null {
    // Common OTP patterns
    const otpPatterns = [
      /(\b\d{4,6}\b)/, // 4-6 digit numbers
      /OTP[:\s]*(\d{4,6})/i, // OTP: 123456
      /code[:\s]*(\d{4,6})/i, // code: 123456
      /verification[:\s]*(\d{4,6})/i, // verification: 123456
      /(\d{4,6})[^\d]*$/ // 4-6 digits at the end
    ];

    for (const pattern of otpPatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1]) {
        const otp = match[1];
        // Validate that it's actually an OTP (not just any number)
        if (otp.length >= 4 && otp.length <= 6 && /^\d+$/.test(otp)) {
          return otp;
        }
      }
    }

    return null;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get balance: ${response.status}`);
      }

      const result = await response.json() as any;
      return {
        balance: result.balance || 0,
        currency: 'USD'
      };
    } catch (error) {
      console.error('[5SIM] Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Get available countries and products
   */
  async getAvailableCountries(): Promise<Array<{ id: string; name: string; products: string[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/guest/countries`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get countries: ${response.status}`);
      }

      const result = await response.json() as any;
      
      // 5SIM returns countries as an object with country codes as keys
      const countries = [];
      for (const [countryCode, countryData] of Object.entries(result)) {
        if (countryData && typeof countryData === 'object') {
          const data = countryData as any;
          countries.push({
            id: countryCode,
            name: data.text_en || data.text_ru || countryCode,
            products: Object.keys(data).filter(key => key.startsWith('virtual'))
          });
        }
      }
      
      return countries;
    } catch (error) {
      console.error('[5SIM] Error getting countries:', error);
      return [];
    }
  }

  /**
   * Get available products for a country using the correct API endpoint
   */
  async getAvailableProducts(countryId: string): Promise<Array<{ id: string; name: string; cost: number; count: number }>> {
    try {
      // Use the correct API endpoint: /guest/prices?country=$country
      const response = await fetch(`${this.baseUrl}/guest/prices?country=${countryId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get products: ${response.status}`);
      }

      const result = await response.json() as any;
      
      const products: Array<{ id: string; name: string; cost: number; count: number }> = [];
      
      if (result[countryId]) {
        // Add products from prices endpoint
        Object.entries(result[countryId]).forEach(([id, product]: [string, any]) => {
          products.push({
            id,
            name: id,
            cost: product.cost || 0.10,
            count: product.count || 1
          });
        });
      }
      
      // If no virtual products found in prices, add them manually since they're available for activation
      if (countryId === 'india') {
        const virtualProducts = ['virtual21', 'virtual4', 'virtual58'];
        for (const virtualId of virtualProducts) {
          if (!products.find(p => p.id === virtualId)) {
            products.push({
              id: virtualId,
              name: virtualId,
              cost: 0.10, // Default cost for virtual products
              count: 1 // Assume available
            });
          }
        }
      }
      
      return products;
    } catch (error) {
      console.error(`[5SIM] Error getting products for country ${countryId}:`, error);
      
      // Fallback: return virtual products for India if API fails
      if (countryId === 'india') {
        return [
          { id: 'virtual21', name: 'virtual21', cost: 0.10, count: 1 },
          { id: 'virtual4', name: 'virtual4', cost: 0.10, count: 1 },
          { id: 'virtual58', name: 'virtual58', cost: 0.10, count: 1 }
        ];
      }
      
      return [];
    }
  }

  /**
   * Get detailed country information including available products
   */
  async getCountryDetails(countryId: string): Promise<{ id: string; name: string; products: any; iso: any; prefix: any } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/guest/countries`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get country details: ${response.status}`);
      }

      const result = await response.json() as any;
      
      // Look for the specific country
      if (result[countryId]) {
        return {
          id: countryId,
          name: result[countryId].text_en || result[countryId].text_ru || 'Unknown',
          products: result[countryId],
          iso: result[countryId].iso || {},
          prefix: result[countryId].prefix || {}
        };
      }
      
      return null;
    } catch (error) {
      console.error(`[5SIM] Error getting country details for ${countryId}:`, error);
      return null;
    }
  }
} 