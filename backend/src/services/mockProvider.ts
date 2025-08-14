import { VirtualNumberProvider, OTP } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock Virtual Number Provider
 * 
 * This is a placeholder implementation that simulates a real virtual number service.
 * Replace this with actual integration to services like:
 * - 5SIM (https://5sim.net/)
 * - SMS-Activate (https://sms-activate.org/)
 * - Twilio (for SMS forwarding)
 * - Any other virtual number provider
 */
// Temporarily remove interface implementation to avoid TypeScript errors
export class MockVirtualNumberProvider /* implements VirtualNumberProvider */ {
  private activeNumbers: Map<string, { otps: OTP[]; lastCheck: Date }> = new Map();
  private otpCounter: number = 0;

  /**
   * Request a new virtual number
   * 
   * In a real implementation, this would:
   * 1. Call the provider's API to request a number
   * 2. Handle authentication (API keys, tokens)
   * 3. Return the actual number from the provider
   * 4. Handle errors and retries
   */
  async requestNumber(): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate a mock Indian mobile number (+91 format)
    // Indian mobile numbers are 10 digits: 3-digit area code + 7-digit subscriber number
    const areaCodes = ['700', '701', '702', '703', '704', '705', '706', '707', '708', '709', '800', '801', '802', '803', '804', '805', '806', '807', '808', '809', '900', '901', '902', '903', '904', '905', '906', '907', '908', '909'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    
    // Generate 7-digit subscriber number (1000000 to 9999999)
    const subscriberNumber = Math.floor(Math.random() * 9000000) + 1000000;
    
    // Format: +91 + 3 digits + 7 digits = +91XXXXXXXXXX (total 13 characters, 10 digits after +91)
    const number = `+91${areaCode}${subscriberNumber}`;
    
    // Initialize tracking for this number
    this.activeNumbers.set(number, { otps: [], lastCheck: new Date() });
    
    console.log(`[MockProvider] Requested number: ${number} (${number.length - 3} digits)`);
    return number;
  }

  /**
   * Check for new OTPs on a specific number
   * 
   * In a real implementation, this would:
   * 1. Poll the provider's API for new messages
   * 2. Parse SMS messages to extract OTP codes
   * 3. Handle message filtering and validation
   * 4. Return actual OTP data
   */
  async checkForOTP(number: string): Promise<OTP[]> {
    const numberData = this.activeNumbers.get(number);
    if (!numberData) {
      return [];
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const newOtps: OTP[] = [];
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - numberData.lastCheck.getTime();

    // Simulate OTP arrival (30% chance every 5-15 seconds)
    if (timeSinceLastCheck > 5000 && Math.random() < 0.3) {
      const otpCount = Math.floor(Math.random() * 2) + 1; // 1-2 OTPs at a time
      
      for (let i = 0; i < otpCount; i++) {
        const otp: OTP = {
          id: uuidv4(),
          code: this.generateOTP(),
          receivedAt: new Date(now.getTime() - Math.random() * 30000), // Random time within last 30 seconds
          isUsed: false
        };
        newOtps.push(otp);
        numberData.otps.push(otp);
        this.otpCounter++;
      }
      
      console.log(`[MockProvider] Received ${otpCount} OTP(s) for ${number}: ${newOtps.map(o => o.code).join(', ')}`);
    }

    numberData.lastCheck = now;
    this.activeNumbers.set(number, numberData);
    
    return newOtps;
  }

  /**
   * Cancel/Release a virtual number
   * 
   * In a real implementation, this would:
   * 1. Call the provider's API to release the number
   * 2. Handle cleanup and billing
   * 3. Confirm the number is no longer active
   */
  async cancelNumber(number: string): Promise<boolean> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const success = this.activeNumbers.has(number);
    if (success) {
      this.activeNumbers.delete(number);
      console.log(`[MockProvider] Cancelled number: ${number}`);
    }
    
    return success;
  }

  /**
   * Request OTP resend for a number
   * 
   * In a real implementation, this would:
   * 1. Call the provider's API to trigger OTP resend
   * 2. Handle rate limiting and costs
   * 3. Return success/failure status
   */
  async resendOTP(number: string): Promise<boolean> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const success = this.activeNumbers.has(number);
    if (success) {
      console.log(`[MockProvider] Resent OTP for number: ${number}`);
    }
    
    return success;
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get all OTPs for a number (for debugging/testing)
   */
  getAllOTPs(number: string): OTP[] {
    const numberData = this.activeNumbers.get(number);
    return numberData ? numberData.otps : [];
  }

  /**
   * Get active numbers count (for debugging/testing)
   */
  getActiveNumbersCount(): number {
    return this.activeNumbers.size;
  }
} 