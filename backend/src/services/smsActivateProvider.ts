import { VirtualNumberProvider, OTP } from '../types';

/**
 * SMS-Activate Virtual Number Provider
 * 
 * Provides virtual numbers through SMS-Activate.io
 * API Documentation: https://sms-activate.io/api2
 * 
 * Features:
 * - India as default country (country code 22)
 * - Multiple service support (WhatsApp, Telegram, etc.)
 * - Real-time pricing and availability
 * - OTP extraction and management
 */
export class SMSActivateProvider implements VirtualNumberProvider {
  private apiKey: string;
  private baseUrl: string;
  private activeNumbers: Map<string, { activationId: string; otps: OTP[]; service: string }> = new Map();
  private defaultCountry: string = '22'; // India by default

  constructor() {
    this.apiKey = process.env.SMS_ACTIVATE_API_KEY || '';
    this.baseUrl = 'https://api.sms-activate.org/stubs/handler_api.php';
    
    if (!this.apiKey) {
      throw new Error('SMS-Activate API key not configured. Please set SMS_ACTIVATE_API_KEY environment variable.');
    }
  }

  /**
   * Request a new virtual number from SMS-Activate
   * @param service - Service name (e.g., 'wa' for WhatsApp, 'tg' for Telegram)
   * @param country - Country code (defaults to India '22')
   */
  async requestNumber(service: string = 'wa', country: string = this.defaultCountry): Promise<string> {
    try {
      console.log(`[SMS-Activate] Requesting ${service} number for country ${country}...`);
      
      // Validate country and service availability
      const availableServices = await this.getAvailableServices(country);
      const targetService = availableServices.find(s => s.id === service);
      
      if (!targetService) {
        throw new Error(`Service ${service} not available in country ${country}`);
      }
      
      if (targetService.count === 0) {
        throw new Error(`No ${service} numbers available in country ${country} at the moment`);
      }

      // Request activation
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'getNumber',
        service: service,
        country: country,
        operator: 'any', // Any operator
        ref: 'virtualno' // Referral (optional)
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const result = await response.text();
      
      console.log('[SMS-Activate] API response:', result);

      // Parse response: ACCESS:activation_id:phone_number
      if (result.startsWith('ACCESS:')) {
        const parts = result.split(':');
        if (parts.length === 3) {
          const activationId = parts[1];
          const phoneNumber = parts[2];
          
          // Store the activation for OTP checking
          this.activeNumbers.set(phoneNumber, {
            activationId,
            otps: [],
            service
          });

          console.log(`[SMS-Activate] Successfully requested ${service} number: ${phoneNumber} (Activation ID: ${activationId})`);
          return phoneNumber;
        }
      }

      // Handle specific error codes
      if (result.startsWith('BAD_KEY')) {
        throw new Error('Invalid API key');
      } else if (result.startsWith('NO_NUMBERS')) {
        throw new Error(`No available ${service} numbers in country ${country} at the moment`);
      } else if (result.startsWith('NO_BALANCE')) {
        throw new Error('Insufficient account balance');
      } else if (result.startsWith('WRONG_SERVICE')) {
        throw new Error(`Invalid service: ${service}`);
      } else if (result.startsWith('WRONG_COUNTRY')) {
        throw new Error(`Invalid country code: ${country}`);
      } else {
        throw new Error(`SMS-Activate error: ${result}`);
      }
    } catch (error) {
      console.error('[SMS-Activate] Error requesting number:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to request SMS-Activate number: ${errorMessage}`);
    }
  }

  /**
   * Check for new OTPs from SMS-Activate
   */
  async checkForOTP(number: string): Promise<OTP[]> {
    try {
      const numberData = this.activeNumbers.get(number);
      if (!numberData) {
        return [];
      }

      // Check activation status
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'getStatus',
        id: numberData.activationId
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const status = await response.text();
      
      console.log(`[SMS-Activate] Status for ${number}: ${status}`);

      // Status codes:
      // STATUS_WAIT_CODE - waiting for SMS
      // STATUS_OK - SMS received
      // STATUS_CANCEL - cancelled
      // STATUS_WAIT_RESEND - waiting for resend
      
      if (status === 'STATUS_OK') {
        // Get the SMS code
        const codeParams = new URLSearchParams({
          api_key: this.apiKey,
          action: 'getCode',
          id: numberData.activationId
        });

        const codeResponse = await fetch(`${this.baseUrl}?${codeParams.toString()}`);
        const smsCode = await codeResponse.text();
        
        if (smsCode && smsCode !== 'STATUS_WAIT_CODE') {
          // Extract OTP from SMS
          const otpCode = this.extractOTPFromMessage(smsCode);
          if (otpCode) {
            const otp: OTP = {
              id: `sms_${numberData.activationId}`,
              code: otpCode,
              receivedAt: new Date(),
              isUsed: false
            };
            
            // Check if this OTP is new
            const existingOtp = numberData.otps.find(o => o.code === otpCode);
            if (!existingOtp) {
              numberData.otps.push(otp);
              this.activeNumbers.set(number, numberData);
              console.log(`[SMS-Activate] Found new OTP: ${otpCode} for ${number}`);
              return [otp];
            }
          }
        }
      }

      return [];
    } catch (error) {
      console.error(`[SMS-Activate] Error checking OTPs for ${number}:`, error);
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

      // Cancel the activation
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'setStatus',
        id: numberData.activationId,
        status: '8' // Cancel activation
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const result = await response.text();
      
      if (result === 'ACCESS_CANCEL') {
        console.log(`[SMS-Activate] Successfully cancelled number: ${number}`);
        this.activeNumbers.delete(number);
        return true;
      } else {
        console.warn(`[SMS-Activate] Failed to cancel number ${number}: ${result}`);
        return false;
      }
    } catch (error) {
      console.error(`[SMS-Activate] Error cancelling number ${number}:`, error);
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
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'setStatus',
        id: numberData.activationId,
        status: '3' // Request resend
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const result = await response.text();
      
      if (result === 'ACCESS_RETRY_GET') {
        console.log(`[SMS-Activate] Successfully requested OTP resend for number: ${number}`);
        return true;
      } else {
        console.warn(`[SMS-Activate] Failed to resend OTP for ${number}: ${result}`);
        return false;
      }
    } catch (error) {
      console.error(`[SMS-Activate] Error resending OTP for ${number}:`, error);
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
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'getBalance'
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const result = await response.text();
      
      if (result.startsWith('ACCESS:')) {
        const balance = parseFloat(result.split(':')[1]);
        return {
          balance: balance,
          currency: 'USD'
        };
      } else {
        throw new Error(`Failed to get balance: ${result}`);
      }
    } catch (error) {
      console.error('[SMS-Activate] Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Get available countries
   */
  async getAvailableCountries(): Promise<Array<{ id: string; name: string; rus: string; eng: string }>> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'getCountries'
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const result = await response.text();
      
      try {
        const countries = JSON.parse(result);
        return Object.entries(countries).map(([id, country]: [string, any]) => ({
          id,
          name: country.eng || country.rus || 'Unknown',
          rus: country.rus || '',
          eng: country.eng || ''
        }));
      } catch (parseError) {
        console.warn('[SMS-Activate] Failed to parse countries JSON, using fallback format');
        return [];
      }
    } catch (error) {
      console.error('[SMS-Activate] Error getting countries:', error);
      return [];
    }
  }

  /**
   * Get available services and prices for a country
   */
  async getAvailableServices(countryId: string = this.defaultCountry): Promise<Array<{ id: string; name: string; cost: number; count: number }>> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'getPrices',
        country: countryId
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const result = await response.text();
      
      try {
        const prices = JSON.parse(result);
        if (prices[countryId]) {
          return Object.entries(prices[countryId]).map(([id, service]: [string, any]) => ({
            id,
            name: this.getServiceName(id),
            cost: parseFloat(service.cost) || 0,
            count: parseInt(service.count) || 0
          }));
        }
      } catch (parseError) {
        console.warn(`[SMS-Activate] Failed to parse prices for country ${countryId}:`, parseError);
      }
      
      return [];
    } catch (error) {
      console.error(`[SMS-Activate] Error getting services for country ${countryId}:`, error);
      return [];
    }
  }

  /**
   * Get service name by ID
   */
  private getServiceName(serviceId: string): string {
    const serviceNames: { [key: string]: string } = {
      'wa': 'WhatsApp',
      'tg': 'Telegram',
      'vk': 'VKontakte',
      'ok': 'Odnoklassniki',
      'ig': 'Instagram',
      'fb': 'Facebook',
      'am': 'Amazon',
      'go': 'Google',
      'ub': 'Uber',
      'ly': 'Lyft',
      'ot': 'Other'
    };
    
    return serviceNames[serviceId] || serviceId;
  }

  /**
   * Get real-time pricing for a specific service in a country
   */
  async getServicePrice(serviceId: string, countryId: string = this.defaultCountry): Promise<{ cost: number; count: number } | null> {
    try {
      const services = await this.getAvailableServices(countryId);
      const service = services.find(s => s.id === serviceId);
      
      if (service && service.count > 0) {
        return {
          cost: service.cost,
          count: service.count
        };
      }
      
      return null;
    } catch (error) {
      console.error(`[SMS-Activate] Error getting service price for ${serviceId} in ${countryId}:`, error);
      return null;
    }
  }

  /**
   * Get all available services across all countries
   */
  async getAllServices(): Promise<Array<{ country: string; service: string; cost: number; count: number }>> {
    try {
      const countries = await this.getAvailableCountries();
      const allServices: Array<{ country: string; service: string; cost: number; count: number }> = [];
      
      for (const country of countries) {
        const services = await this.getAvailableServices(country.id);
        for (const service of services) {
          if (service.count > 0) {
            allServices.push({
              country: country.name,
              service: service.name,
              cost: service.cost,
              count: service.count
            });
          }
        }
      }
      
      return allServices;
    } catch (error) {
      console.error('[SMS-Activate] Error getting all services:', error);
      return [];
    }
  }

  /**
   * Get real-time price for a specific product from SMS-Activate
   * This method is required to implement the VirtualNumberProvider interface
   */
  async getProductPrice(productId: string, countryId: string = this.defaultCountry): Promise<{ cost: number; count: number } | null> {
    try {
      console.log(`[SMS-Activate] Getting price for product: ${productId} in country: ${countryId}`);
      
      // Map common product names to SMS-Activate service IDs
      const serviceMapping: { [key: string]: string } = {
        'whatsapp': 'wa',
        'wa': 'wa',
        'telegram': 'tg',
        'tg': 'tg',
        'instagram': 'ig',
        'ig': 'ig',
        'facebook': 'fb',
        'fb': 'fb',
        'google': 'go',
        'go': 'go',
        'amazon': 'am',
        'am': 'am',
        'uber': 'ub',
        'ub': 'ub',
        'lyft': 'ly',
        'ly': 'ly',
        'vk': 'vk',
        'ok': 'ok'
      };
      
      const serviceId = serviceMapping[productId.toLowerCase()] || productId;
      const priceData = await this.getServicePrice(serviceId, countryId);
      
      if (priceData) {
        console.log(`[SMS-Activate] Found ${productId} in ${countryId}: $${priceData.cost} (${priceData.count} available)`);
        return priceData;
      } else {
        console.log(`[SMS-Activate] No available numbers found for ${productId} in ${countryId}`);
        return null;
      }
    } catch (error) {
      console.error(`[SMS-Activate] Error getting product price for ${productId} in ${countryId}:`, error);
      return null;
      }
  }

  /**
   * Check OTPs for a number (alias for checkForOTP to match interface)
   */
  async checkOtps(number: string): Promise<OTP[]> {
    return this.checkForOTP(number);
  }

  /**
   * Resend OTP for a number (alias for resendOTP to match interface)
   */
  async resendOtp(number: string): Promise<boolean> {
    return this.resendOTP(number);
  }

  /**
   * Get available products for a country
   */
  async getAvailableProducts(countryId: string = this.defaultCountry): Promise<Array<{ id: string; name: string; cost: number; count: number }>> {
    try {
      const services = await this.getAvailableServices(countryId);
      return services.map(service => ({
        id: service.id,
        name: service.name,
        cost: service.cost,
        count: service.count
      }));
    } catch (error) {
      console.error(`[SMS-Activate] Error getting available products for country ${countryId}:`, error);
      return [];
    }
  }
} 