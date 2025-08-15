import { VirtualNumberProvider, VirtualNumber, OTP } from '../types';

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
  private readonly baseUrl = 'https://5sim.net/v1';
  private readonly apiKey: string;
  private readonly activeNumbers = new Map<string, {
    id: string;
    phone: string;
    otps: OTP[];
    activationTime: Date;
    timeoutId: NodeJS.Timeout | null;
    product: string;
    country: string;
  }>();

  // Country code mapping: frontend codes -> 5SIM API codes
  private readonly countryCodeMap: { [key: string]: string } = {
    'usa': 'us',      // Frontend 'usa' -> 5SIM API 'us'
    'india': 'india'  // Frontend 'india' -> 5SIM API 'india'
  };

  constructor() {
    const apiKey = process.env.FIVESIM_API_KEY;
    if (!apiKey) {
      throw new Error('FIVESIM_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  /**
   * Get the authorization header for 5SIM API calls
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };
  }

  /**
   * Request a virtual number for a specific product, country, and operator
   */
  async requestNumber(productId: string = 'virtual21', countryId: string = 'india', operatorId?: string): Promise<string> {
    try {
      // Temporarily remove country code mapping to test if that's causing the issue
      // const apiCountryCode = this.countryCodeMap[countryId] || countryId;
      const apiCountryCode = countryId; // Use the original countryId directly
      console.log(`[5SIM] Requesting virtual number for product: ${productId}, country: ${countryId}, operator: ${operatorId || 'any'}`);
      
      // Step 1: Check if the product is available for the country
      const availableProducts = await this.getAvailableProducts(apiCountryCode);
      const targetProduct = availableProducts.find(p => p.id === productId);
      
      if (!targetProduct) {
        throw new Error(`Product ${productId} is not available for country ${countryId}`);
      }

      console.log(`[5SIM] Product ${productId} is available. Cost: $${targetProduct.cost}, Count: ${targetProduct.count}`);

      // Step 2: Build the API URL with operator
      const operator = operatorId || 'any';
      const apiUrl = `${this.baseUrl}/user/buy/activation/${apiCountryCode}/${operator}/${productId}`;
      
      console.log(`[5SIM] Making API request to: ${apiUrl}`);
      console.log(`[5SIM] Request method: GET`);
      console.log(`[5SIM] Headers:`, this.getAuthHeaders());
      console.log(`[5SIM] Full request details:`, {
        url: apiUrl,
        method: 'GET',
        headers: this.getAuthHeaders(),
        country: countryId,
        operator: operatorId,
        productId
      });

      // Step 3: Purchase the number
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log(`[5SIM] Response status: ${response.status} ${response.statusText}`);
      console.log(`[5SIM] Response URL: ${response.url}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[5SIM] API Error: ${response.status} ${response.statusText}`);
        console.error(`[5SIM] Response: ${errorText}`);
        console.error(`[5SIM] Request that failed:`, {
          url: apiUrl,
          method: 'GET',
          headers: this.getAuthHeaders(),
          country: countryId,
          operator: operatorId,
          productId
        });
        
        if (response.status === 403) {
          throw new Error('5SIM API error: 403 Forbidden. Check your API key and balance. '+errorText);
        } else if (response.status === 401) {
          throw new Error('5SIM API error: 401 Unauthorized. Invalid API key.');
        } else if (response.status === 400) {
          throw new Error('5SIM API error: 400 Bad Request. Service, country, or operator not available.');
        }
        throw new Error(`Failed to request number from 5SIM: ${errorText}`);
      }

      // Check if response is text (like "no free phones") or JSON
      const responseText = await response.text();
      console.log(`[5SIM] Raw response:`, responseText);
      
      // Check for common text responses
      if (responseText === 'no free phones') {
        throw new Error('5SIM: No free phones available for this combination. Try a different operator or product.');
      }
      
      if (responseText === 'bad country') {
        throw new Error('5SIM: Invalid country specified.');
      }
      
      if (responseText === 'bad operator') {
        throw new Error('5SIM: Invalid operator specified.');
      }
      
      if (responseText === 'bad product') {
        throw new Error('5SIM: Invalid product specified.');
      }
      
      // Try to parse as JSON
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`5SIM: Invalid response format. Expected JSON but got: ${responseText}`);
      }
      
      console.log(`[5SIM] API response:`, JSON.stringify(result, null, 2));
      
      const phoneNumber = result.phone;
      const activationId = result.id;

      if (!phoneNumber || !activationId) {
        throw new Error('Invalid response from 5SIM API: phone or id missing.');
      }

      console.log(`[5SIM] Successfully purchased number: ${phoneNumber} (Activation ID: ${activationId})`);

      // Step 4: Store the active number and set up auto-cancellation
      this.activeNumbers.set(phoneNumber, {
        id: activationId,
        phone: phoneNumber,
        otps: [],
        activationTime: new Date(),
        timeoutId: setTimeout(() => this.autoCancelNumber(phoneNumber), 180000), // 3 minutes (180 seconds) for testing
        product: productId,
        country: countryId
      });

      console.log(`[5SIM] Auto-cancellation set for 3 minutes if no SMS received`);
      return phoneNumber;

    } catch (error) {
      console.error('[5SIM] Error requesting number:', error);
      throw error;
    }
  }

  /**
   * Check for OTPs for a specific number
   */
  async checkOtps(phoneNumber: string): Promise<OTP[]> {
    try {
      const numberData = this.activeNumbers.get(phoneNumber);
      if (!numberData) {
        throw new Error(`Number ${phoneNumber} is not active`);
      }

      console.log(`[5SIM] Checking OTPs for number: ${phoneNumber}`);

      // Get the activation status and SMS
      const response = await fetch(`${this.baseUrl}/user/check/${numberData.id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to check OTPs: ${response.status}`);
      }

      const result = await response.json() as any;
      
      // Check if activation is completed
      if (result.status === 'RECEIVED') {
        console.log(`[5SIM] Activation completed for ${phoneNumber}`);
        
        // Get the SMS content
        const smsResponse = await fetch(`${this.baseUrl}/user/check/${numberData.id}/sms`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        if (smsResponse.ok) {
          const smsData = await smsResponse.json() as any;
          if (smsData.sms && smsData.sms.length > 0) {
            // Extract OTP from SMS content
            const otps = this.extractOTPs(smsData.sms[0].text);
            if (otps.length > 0) {
              // Clear the timeout since we received OTP
              if (numberData.timeoutId) {
                clearTimeout(numberData.timeoutId);
              }
              
              // Update the number data
              numberData.otps = otps;
              numberData.timeoutId = null;
              this.activeNumbers.set(phoneNumber, numberData);
              
              console.log(`[5SIM] OTPs extracted: ${otps.map(otp => otp.code).join(', ')}`);
              return otps;
            }
          }
        }
      } else if (result.status === 'CANCELED') {
        console.log(`[5SIM] Activation was canceled for ${phoneNumber}`);
        this.activeNumbers.delete(phoneNumber);
        return [];
      } else if (result.status === 'TIMEOUT') {
        console.log(`[5SIM] Activation timed out for ${phoneNumber}`);
        this.activeNumbers.delete(phoneNumber);
        return [];
      }

      return numberData.otps;

    } catch (error) {
      console.error(`[5SIM] Error checking OTPs for ${phoneNumber}:`, error);
      return [];
    }
  }

  /**
   * Extract OTP codes from SMS text
   */
  private extractOTPs(smsText: string): OTP[] {
    const otps: OTP[] = [];
    
    // Common OTP patterns
    const patterns = [
      /(\b\d{4,6}\b)/g,  // 4-6 digit numbers
      /OTP[:\s]*(\d{4,6})/gi,  // OTP: 123456
      /code[:\s]*(\d{4,6})/gi,  // code: 123456
      /verification[:\s]*(\d{4,6})/gi,  // verification: 123456
    ];

    patterns.forEach(pattern => {
      const matches = smsText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const code = match.replace(/[^\d]/g, '');
          if (code.length >= 4 && code.length <= 6) {
            otps.push({
              id: `otp_${Date.now()}_${Math.random()}`,
              code,
              receivedAt: new Date(),
              source: '5SIM'
            });
          }
        });
      }
    });

    // Remove duplicates
    const uniqueOtps = otps.filter((otp, index, self) => 
      index === self.findIndex(o => o.code === otp.code)
    );

    return uniqueOtps;
  }

  /**
   * Cancel a number and get refund
   */
  async cancelNumber(phoneNumber: string): Promise<boolean> {
    try {
      const numberData = this.activeNumbers.get(phoneNumber);
      if (!numberData) {
        throw new Error(`Number ${phoneNumber} is not active`);
      }

      console.log(`[5SIM] Canceling number: ${phoneNumber}`);

      // Clear the timeout
      if (numberData.timeoutId) {
        clearTimeout(numberData.timeoutId);
      }

      // Cancel the activation
      const response = await fetch(`${this.baseUrl}/user/cancel/${numberData.id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        console.log(`[5SIM] Successfully canceled number: ${phoneNumber}`);
        console.log(`[5SIM] Refund will be processed automatically by 5SIM`);
        
        // Remove from active numbers
        this.activeNumbers.delete(phoneNumber);
        return true;
      } else {
        console.warn(`[5SIM] Failed to cancel number ${phoneNumber}: ${response.status}`);
        return false;
      }

    } catch (error) {
      console.error(`[5SIM] Error canceling number ${phoneNumber}:`, error);
      return false;
    }
  }

  /**
   * Auto-cancel number after 3 minutes if no OTP received
   */
  private async autoCancelNumber(phoneNumber: string): Promise<void> {
    try {
      const numberData = this.activeNumbers.get(phoneNumber);
      if (!numberData) {
        return;
      }

      if (numberData.otps.length === 0) {
        console.log(`[5SIM] Auto-canceling number ${phoneNumber} after 3 minutes (no OTP received)`);
        
        await this.cancelNumber(phoneNumber);
      } else {
        console.log(`[5SIM] Number ${phoneNumber} received OTP, keeping active`);
      }
    } catch (error) {
      console.error(`[5SIM] Error in auto-cancellation for ${phoneNumber}:`, error);
    }
  }

  /**
   * Resend OTP for a number
   */
  async resendOtp(phoneNumber: string): Promise<boolean> {
    try {
      const numberData = this.activeNumbers.get(phoneNumber);
      if (!numberData) {
        return false;
      }

      console.log(`[5SIM] Resending OTP for number: ${phoneNumber}`);

      // Request OTP resend
      const response = await fetch(`${this.baseUrl}/user/repeat/${numberData.id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        console.log(`[5SIM] Successfully requested OTP resend for number: ${phoneNumber}`);
        return true;
      } else {
        console.warn(`[5SIM] Failed to resend OTP for ${phoneNumber}: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`[5SIM] Error resending OTP for ${phoneNumber}:`, error);
      return false;
    }
  }

  /**
   * Get available products for a country
   */
  async getAvailableProducts(countryId: string): Promise<Array<{ id: string; name: string; cost: number; count: number }>> {
    try {
      // Temporarily remove country code mapping to test if that's causing the issue
      // const apiCountryCode = this.countryCodeMap[countryId] || countryId;
      const apiCountryCode = countryId; // Use the original countryId directly
      console.log(`[5SIM] Getting available products for country: ${countryId}`);
      console.log(`[5SIM] API URL: ${this.baseUrl}/guest/prices?country=${apiCountryCode}`);
      
      const response = await fetch(`${this.baseUrl}/guest/prices?country=${apiCountryCode}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`[5SIM] Response status: ${response.status}`);
      console.log(`[5SIM] Response ok: ${response.ok}`);

      if (!response.ok) {
        throw new Error(`Failed to get products: ${response.status}`);
      }

      const result = await response.json() as any;
      console.log(`[5SIM] Raw products response for ${apiCountryCode}:`, JSON.stringify(result, null, 2));
      console.log(`[5SIM] Response type: ${typeof result}`);
      console.log(`[5SIM] Response keys:`, Object.keys(result));

      const products: Array<{ id: string; name: string; cost: number; count: number }> = [];

      // The 5SIM API returns products nested under country
      // Structure: { "usa": { "facebook": { "virtual40": { "cost": 10, "count": 33525 } } } }
      Object.entries(result).forEach(([countryId, countryData]: [string, any]) => {
        console.log(`[5SIM] Processing country: ${countryId}`, countryData);
        if (countryData && typeof countryData === 'object') {
          // Each country has multiple products
          Object.entries(countryData).forEach(([productId, productData]: [string, any]) => {
            console.log(`[5SIM] Processing product: ${productId}`, productData);
            if (productData && typeof productData === 'object') {
              // Each product can have multiple virtual number types
              Object.entries(productData).forEach(([virtualType, virtualData]: [string, any]) => {
                console.log(`[5SIM] Processing virtual type: ${virtualType}`, virtualData);
                console.log(`[5SIM] virtualData type: ${typeof virtualData}`);
                console.log(`[5SIM] virtualData.cost: ${virtualData?.cost}`);
                console.log(`[5SIM] virtualData.cost !== undefined: ${virtualData?.cost !== undefined}`);
                
                if (virtualData && typeof virtualData === 'object' && virtualData.cost !== undefined) {
                  const product = {
                    id: productId, // Use the product ID (e.g., "facebook", "google")
                    name: productId, // Use the product name
                    cost: virtualData.cost,
                    count: virtualData.count || 0
                  };
                  console.log(`[5SIM] Adding product:`, product);
                  products.push(product);
                } else {
                  console.log(`[5SIM] Skipping product ${productId} - virtualType ${virtualType} - cost undefined or invalid`);
                }
              });
            }
          });
        }
      });

      console.log(`[5SIM] Found ${products.length} products for ${apiCountryCode}:`, products.map(p => ({ id: p.id, cost: p.cost, count: p.count })));
      return products;

    } catch (error) {
      console.error(`[5SIM] Error getting products for country ${countryId}:`, error);
      console.error(`[5SIM] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      return [];
    }
  }

  /**
   * Get real-time price for a specific product from 5SIM guest prices API
   */
  async getProductPrice(productId: string, countryId: string = 'usa'): Promise<{ cost: number; count: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/guest/prices?country=${countryId}&product=${productId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`[5SIM] Failed to get price for ${productId} in ${countryId}: ${response.status}`);
        return null;
      }

      const result = await response.json() as any;
      console.log(`[5SIM] Price response for ${productId} in ${countryId}:`, result);

      // The API returns: { "country": { "product": { "operator": { "cost": X, "count": Y } } } }
      // We need to find the first operator with available numbers for this product in this country
      if (result[countryId] && result[countryId][productId]) {
        const productData = result[countryId][productId];
        
        // Each product has multiple operators
        for (const [operatorId, operatorData] of Object.entries(productData)) {
          if (operatorData && typeof operatorData === 'object' && (operatorData as any).count > 0) {
            console.log(`[5SIM] Found available ${productId} in ${countryId} with ${operatorId}: $${(operatorData as any).cost} (${(operatorData as any).count} available)`);
            return {
              cost: (operatorData as any).cost,
              count: (operatorData as any).count
            };
          }
        }
      }

      console.log(`[5SIM] No available numbers found for ${productId} in ${countryId}`);
      return null;
    } catch (error) {
      console.error(`[5SIM] Error getting price for ${productId} in ${countryId}:`, error);
      return null;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get balance: ${response.status}`);
      }

      const result = await response.json() as any;
      return result.balance || 0;
    } catch (error) {
      console.error('[5SIM] Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Get available countries
   */
  async getAvailableCountries(): Promise<Array<{ id: string; name: string }>> {
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
      return Object.entries(result).map(([id, country]: [string, any]) => ({
        id,
        name: (country as any).title || id
      }));
    } catch (error) {
      console.error('[5SIM] Error getting countries:', error);
      return [];
    }
  }

  /**
   * Get available services
   */
  async getAvailableServices(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/guest/services`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get services: ${response.status}`);
      }

      const result = await response.json() as any;
      return Object.entries(result).map(([id, service]: [string, any]) => ({
        id,
        name: (service as any).title || id
      }));
    } catch (error) {
      console.error('[5SIM] Error getting services:', error);
      return [];
    }
  }
} 