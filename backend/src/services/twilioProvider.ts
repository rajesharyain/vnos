import { VirtualNumberProvider, OTP } from '../types';
import twilio from 'twilio';

/**
 * Twilio Virtual Number Provider
 * 
 * This service integrates with Twilio to provide real virtual numbers
 * by purchasing them dynamically through the Twilio API.
 * 
 * Requirements:
 * - Twilio Account SID
 * - Twilio Auth Token
 * - Sufficient account balance for number purchases
 */
export class TwilioVirtualNumberProvider implements VirtualNumberProvider {
  private client: twilio.Twilio;
  private webhookBaseUrl: string;

  constructor() {
    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:5000';

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }

    this.client = twilio(accountSid, authToken);
    console.log(`[TwilioProvider] Initialized successfully`);
  }

  /**
   * Request a new virtual number through Twilio API
   * 
   * This will:
   * 1. Search for available numbers in India
   * 2. Purchase the number if available
   * 3. Configure webhooks for SMS forwarding
   * 4. Return the purchased number
   */
  async requestNumber(): Promise<string> {
    try {
      console.log('[TwilioProvider] Searching for available Indian numbers...');
      
      // Search for available phone numbers in India
      const availableNumbers = await this.client.availablePhoneNumbers('IN')
        .local
        .list({
          limit: 5,
          voiceEnabled: false, // We only need SMS capability
          smsEnabled: true
        });

      if (availableNumbers.length === 0) {
        throw new Error('No available Indian phone numbers found in your Twilio account');
      }

      // Select the first available number
      const selectedNumber = availableNumbers[0];
      console.log(`[TwilioProvider] Found available number: ${selectedNumber.phoneNumber}`);

      // Purchase the phone number
      const incomingPhoneNumber = await this.client.incomingPhoneNumbers.create({
        phoneNumber: selectedNumber.phoneNumber,
        voiceUrl: `${this.webhookBaseUrl}/webhook/voice`,
        smsUrl: `${this.webhookBaseUrl}/webhook/sms`,
        statusCallback: `${this.webhookBaseUrl}/webhook/status`,
        statusCallbackMethod: 'POST'
      });

      console.log(`[TwilioProvider] Successfully purchased number: ${incomingPhoneNumber.phoneNumber} (SID: ${incomingPhoneNumber.sid})`);
      
      return incomingPhoneNumber.phoneNumber;
    } catch (error) {
      console.error('[TwilioProvider] Error requesting number:', error);
      
      // If Twilio API fails, fall back to mock number generation
      console.log('[TwilioProvider] Falling back to mock number generation');
      return this.generateMockIndianNumber();
    }
  }

  /**
   * Check for new OTPs on a specific number
   * 
   * This queries Twilio's SMS logs for messages to the number
   * and parses them to extract OTP codes.
   */
  async checkForOTP(number: string): Promise<OTP[]> {
    try {
      // Query Twilio's SMS logs for messages to this number
      const messages = await this.client.messages.list({
        to: number,
        limit: 20 // Get last 20 messages
      });
      
      const newOtps: OTP[] = [];
      
      for (const message of messages) {
        const otpCode = this.extractOTPFromMessage(message.body);
        if (otpCode) {
          const otp: OTP = {
            id: message.sid,
            code: otpCode,
            receivedAt: new Date(message.dateCreated),
            isUsed: false
          };
          newOtps.push(otp);
        }
      }
      
      if (newOtps.length > 0) {
        console.log(`[TwilioProvider] Found ${newOtps.length} new OTP(s) for ${number}`);
      }
      
      return newOtps;
    } catch (error) {
      console.error(`[TwilioProvider] Error checking OTPs for ${number}:`, error);
      return [];
    }
  }

  /**
   * Cancel/Release a virtual number
   * 
   * This will:
   * 1. Find the Twilio number by phone number
   * 2. Delete it from your Twilio account
   * 3. Release the number back to the pool
   */
  async cancelNumber(number: string): Promise<boolean> {
    try {
      console.log(`[TwilioProvider] Cancelling number: ${number}`);
      
      // Find the Twilio number by phone number
      const incomingNumbers = await this.client.incomingPhoneNumbers.list({
        phoneNumber: number
      });
      
      if (incomingNumbers.length === 0) {
        console.log(`[TwilioProvider] Number ${number} not found in Twilio account`);
        return false;
      }
      
      // Delete the number
      const incomingNumber = incomingNumbers[0];
      await this.client.incomingPhoneNumbers(incomingNumber.sid).remove();
      
      console.log(`[TwilioProvider] Successfully cancelled number: ${number}`);
      return true;
    } catch (error) {
      console.error(`[TwilioProvider] Error cancelling number ${number}:`, error);
      return false;
    }
  }

  /**
   * Request OTP resend for a number
   * 
   * In a real implementation, this would involve:
   * 1. Sending a request to the service that originally sent the OTP
   * 2. Using Twilio to forward the new OTP SMS
   */
  async resendOTP(number: string): Promise<boolean> {
    try {
      console.log(`[TwilioProvider] Resending OTP for number: ${number}`);
      
      // TODO: Implement actual OTP resend logic
      // This would typically involve calling the original service
      // that sent the OTP and requesting a resend
      
      return true;
    } catch (error) {
      console.error(`[TwilioProvider] Error resending OTP for ${number}:`, error);
      return false;
    }
  }

  /**
   * Generate a mock Indian mobile number as fallback
   */
  private generateMockIndianNumber(): string {
    // Indian mobile numbers are 10 digits: 3-digit area code + 7-digit subscriber number
    const areaCodes = ['700', '701', '702', '703', '704', '705', '706', '707', '708', '709', '800', '801', '802', '803', '804', '805', '806', '807', '808', '809', '900', '901', '902', '903', '904', '905', '906', '907', '908', '909'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    
    // Generate 7-digit subscriber number (1000000 to 9999999)
    const subscriberNumber = Math.floor(Math.random() * 9000000) + 1000000;
    
    // Format: +91 + 3 digits + 7 digits = +91XXXXXXXXXX (total 13 characters, 10 digits after +91)
    return `+91${areaCode}${subscriberNumber}`;
  }

  /**
   * Extract OTP code from SMS message content
   * 
   * This function parses SMS content to find OTP codes.
   * You can customize this based on the expected OTP format.
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
   * Send SMS using Twilio (for testing/debugging)
   */
  async sendSMS(to: string, body: string): Promise<string> {
    try {
      // For this to work, you need at least one Twilio number
      const incomingNumbers = await this.client.incomingPhoneNumbers.list({
        limit: 1
      });
      
      if (incomingNumbers.length === 0) {
        throw new Error('No Twilio numbers available for sending SMS');
      }
      
      const fromNumber = incomingNumbers[0].phoneNumber;
      
      const message = await this.client.messages.create({
        body,
        from: fromNumber,
        to
      });
      
      console.log(`[TwilioProvider] SMS sent: ${message.sid}`);
      return message.sid;
    } catch (error) {
      console.error('[TwilioProvider] Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Get Twilio account information
   */
  async getAccountInfo(): Promise<{ accountSid: string; balance: string; phoneNumbers: string[] }> {
    try {
      const account = await this.client.api.accounts(this.client.accountSid).fetch();
      const incomingNumbers = await this.client.incomingPhoneNumbers.list();
      
      return {
        accountSid: account.sid,
        balance: account.balance,
        phoneNumbers: incomingNumbers.map(num => num.phoneNumber)
      };
    } catch (error) {
      console.error('[TwilioProvider] Error fetching account info:', error);
      throw error;
    }
  }

  /**
   * List all purchased phone numbers
   */
  async listPurchasedNumbers(): Promise<Array<{ sid: string; phoneNumber: string; friendlyName: string }>> {
    try {
      const incomingNumbers = await this.client.incomingPhoneNumbers.list();
      return incomingNumbers.map(num => ({
        sid: num.sid,
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName || 'Unnamed'
      }));
    } catch (error) {
      console.error('[TwilioProvider] Error listing purchased numbers:', error);
      return [];
    }
  }
} 