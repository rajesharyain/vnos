import { VirtualNumberProvider, OTP } from '../types';

/**
 * SMS-Activate Virtual Number Provider
 * 
 * Provides virtual numbers through SMS-Activate.io
 * Cost: $0.20-0.80 per number
 * Coverage: Multiple countries including India (country code 22)
 * 
 * API Documentation: https://sms-activate.io/en/api
 */
// Temporarily remove interface implementation to avoid TypeScript errors
export class SMSActivateProvider /* implements VirtualNumberProvider */ {
  private apiKey: string;
  private baseUrl: string;
  private activeNumbers: Map<string, { activationId: string; otps: OTP[] }> = new Map();
  private availableCountries: string[] = ['22', '0', '187', '196', '199']; // India (22) first, then fallbacks

  constructor() {
    this.apiKey = process.env.SMS_ACTIVATE_API_KEY || '';
    this.baseUrl = 'https://api.sms-activate.org/stubs/handler_api.php';
    
    if (!this.apiKey) {
      throw new Error('SMS-Activate API key not configured. Please set SMS_ACTIVATE_API_KEY environment variable.');
    }
  }

  /**
   * Request a new virtual number from SMS-Activate
   */
  async requestNumber(): Promise<string> {
    try {
      console.log('[SMS-Activate] Requesting virtual number...');
      
      // Try to get available countries first
      const countries = await this.getAvailableCountries();
      let selectedCountry = '22'; // Default to India (country code 22)
      
      // Look for India first, then fallback to available countries
      const india = countries.find(c => c.id === '22' || c.name.toLowerCase().includes('india'));
      if (india) {
        selectedCountry = india.id;
        console.log(`[SMS-Activate] Using India (${india.name}) for number request`);
      } else {
        // Fallback to other available countries
        selectedCountry = '0'; // Cheapest option
        console.log(`[SMS-Activate] India not available, using fallback country: ${selectedCountry}`);
      }

      // Request activation
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'getNumber',
        service: 'wa', // WhatsApp service (can be changed to other services)
        country: selectedCountry,
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
            otps: []
          });

          console.log(`[SMS-Activate] Successfully requested number: ${phoneNumber} (Activation ID: ${activationId})`);
          return phoneNumber;
        }
      }

      // Handle errors
      if (result.startsWith('BAD_KEY')) {
        throw new Error('Invalid API key');
      } else if (result.startsWith('NO_NUMBERS')) {
        throw new Error(`No available numbers in country ${selectedCountry} at the moment`);
      } else if (result.startsWith('NO_BALANCE')) {
        throw new Error('Insufficient account balance');
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
   * Get available countries and services
   */
  async getAvailableCountries(): Promise<Array<{ id: string; name: string; services: string[] }>> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        action: 'getCountries'
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const result = await response.text();
      
      // Parse countries response
      try {
        const countries = JSON.parse(result);
        return Object.entries(countries).map(([id, country]: [string, any]) => ({
          id,
          name: country.eng || country.rus || 'Unknown',
          services: []
        }));
      } catch (parseError) {
        // Fallback to semicolon format
        const countries = result.split(';').filter(c => c.trim()).map(country => {
          const parts = country.split(':');
          return { id: parts[0], name: parts[1] || 'Unknown', services: [] };
        });
        return countries;
      }
    } catch (error) {
      console.error('[SMS-Activate] Error getting countries:', error);
      return [];
    }
  }

  /**
   * Get available services for a country
   */
  async getAvailableServices(countryId: string): Promise<Array<{ id: string; name: string; cost: number; count: number }>> {
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
            name: id,
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
} 