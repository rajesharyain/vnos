import { VirtualNumber, OTP, VirtualNumberProvider } from '../types';
import { ProviderFactory } from './providerFactory';
import { v4 as uuidv4 } from 'uuid';

/**
 * Virtual Number Service
 * 
 * Manages the lifecycle of virtual numbers including:
 * - Number creation and expiration
 * - OTP monitoring and updates
 * - Real-time notifications via WebSocket
 * - Provider selection and management
 */
export class VirtualNumberService {
  private virtualNumbers: Map<string, VirtualNumber> = new Map();
  private provider: VirtualNumberProvider | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly NUMBER_LIFETIME_MS = 180000; // 3 minutes (180 seconds) for testing free numbers
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Don't initialize provider here - do it lazily when needed
    this.startOTPChecking();
  }

  /**
   * Get the current provider
   */
  private getProvider(): VirtualNumberProvider {
    // If we have a provider already set, use it
    if (this.provider) {
      return this.provider;
    }

    // Use provider factory to get the selected or best available provider
    try {
      // First try to get the explicitly selected provider
      const selectedProviderId = ProviderFactory.getSelectedProvider();
      if (selectedProviderId) {
        this.provider = ProviderFactory.getProvider(selectedProviderId);
        console.log(`[Service] Using explicitly selected provider: ${selectedProviderId}`);
        return this.provider;
      }
      
      // Fall back to best available provider
      this.provider = ProviderFactory.getBestProvider();
      console.log(`[Service] Using auto-selected provider: ${this.provider.constructor.name}`);
      return this.provider;
    } catch (error) {
      console.error('[Service] Failed to get provider:', error);
      throw error; // Don't fall back automatically
    }
  }

  /**
   * Get provider by specific ID
   */
  getProviderById(providerId: string): VirtualNumberProvider {
    try {
      this.provider = ProviderFactory.getProvider(providerId);
      // Update the factory's selected provider
      ProviderFactory.setSelectedProvider(providerId);
      console.log(`[Service] Provider changed to: ${providerId}`);
      return this.provider;
    } catch (error) {
      console.error(`[Service] Failed to get provider ${providerId}:`, error);
      throw error; // Don't fall back automatically
    }
  }

  /**
   * Select a provider
   */
  async selectProvider(providerId: string): Promise<void> {
    try {
      // Get the provider and set it as selected
      const provider = ProviderFactory.getProvider(providerId);
      this.provider = provider;
      
      // Update the factory's selected provider
      ProviderFactory.setSelectedProvider(providerId);
      
      console.log(`[Service] Provider ${providerId} selected and set as active`);
    } catch (error) {
      console.error(`[Service] Error selecting provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get available countries for a provider
   */
  async getProviderCountries(providerId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      // For now, return hardcoded countries since the interface doesn't support this
      console.log(`[Service] Getting countries for provider ${providerId} (hardcoded)`);
      return [
        { id: 'usa', name: 'United States' },
        { id: 'india', name: 'India' },
        { id: 'england', name: 'England' },
        { id: 'canada', name: 'Canada' }
      ];
    } catch (error) {
      console.error(`[Service] Error getting countries for provider ${providerId}:`, error);
      return [];
    }
  }

  /**
   * Get available products for a provider and country
   */
  async getProviderProducts(providerId: string, countryId: string): Promise<Array<{ id: string; name: string; cost: number; count: number }>> {
    try {
      const provider = this.getProvider();
      return await provider.getAvailableProducts(countryId);
    } catch (error) {
      console.error(`[Service] Error getting products for provider ${providerId}, country ${countryId}:`, error);
      return [];
    }
  }

  /**
   * Get detailed country information for a provider
   */
  async getCountryDetails(providerId: string, countryId: string): Promise<{ id: string; name: string; products: any } | null> {
    try {
      // For now, return hardcoded country details since the interface doesn't support this
      console.log(`[Service] Getting country details for provider ${providerId}, country ${countryId} (hardcoded)`);
      
      const hardcodedCountries = [
        { id: 'usa', name: 'United States' },
        { id: 'india', name: 'India' },
        { id: 'england', name: 'England' },
        { id: 'canada', name: 'Canada' }
      ];
      
      const country = hardcodedCountries.find(c => c.id === countryId);
      
      if (country) {
        const provider = this.getProvider();
        const products = await provider.getAvailableProducts(countryId);
        return {
          id: country.id,
          name: country.name,
          products: products
        };
      }
      
      return null;
    } catch (error) {
      console.error(`[Service] Error getting country details for provider ${providerId}, country ${countryId}:`, error);
      return null;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return ProviderFactory.getAvailableProviders();
  }

  /**
   * Get provider status
   */
  getProviderStatus(providerId: string) {
    return ProviderFactory.getProviderStatus(providerId);
  }

  /**
   * Get currently selected provider
   */
  getSelectedProvider() {
    return ProviderFactory.getSelectedProvider();
  }

  /**
   * Request a new virtual number
   */
  async requestNumber(productId: string, countryId: string = 'india', operatorId?: string): Promise<VirtualNumber> {
    try {
      const provider = this.getProvider();
      const phoneNumber = await provider.requestNumber(productId, countryId, operatorId);
      
      const virtualNumber: VirtualNumber = {
        id: uuidv4(),
        number: phoneNumber,
        provider: '5sim',
        country: countryId,
        product: productId,
        otps: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 1000), // 3 minutes (180 seconds) for testing
        status: 'active'
      };

      this.virtualNumbers.set(phoneNumber, virtualNumber);
      
      // Start polling for OTPs
      this.startOtpPolling(phoneNumber);
      
      return virtualNumber;
    } catch (error) {
      console.error('[VirtualNumberService] Error requesting number:', error);
      throw error;
    }
  }

  /**
   * Start polling for OTPs for a specific number
   */
  private startOtpPolling(phoneNumber: string): void {
    const pollInterval = setInterval(async () => {
      try {
        const virtualNumber = this.virtualNumbers.get(phoneNumber);
        if (!virtualNumber || virtualNumber.status !== 'active') {
          clearInterval(pollInterval);
          return;
        }

        const provider = this.getProvider();
        const otps = await provider.checkOtps(phoneNumber);
        
        if (otps.length > 0) {
          // Update the virtual number with new OTPs
          virtualNumber.otps = otps;
          this.virtualNumbers.set(phoneNumber, virtualNumber);
          
          // Emit OTP update event
          if (global.io) {
            global.io.to(`number-${phoneNumber}`).emit('otpUpdate', {
              number: phoneNumber,
              otps
            });
          }
          
          console.log(`[Service] Received OTPs for ${phoneNumber}: ${otps.map(otp => otp.code).join(', ')}`);
        }
      } catch (error) {
        console.error(`[Service] Error polling OTPs for ${phoneNumber}:`, error);
      }
    }, 5000); // Poll every 5 seconds

    // Store the interval ID for cleanup
    this.pollingIntervals.set(phoneNumber, pollInterval);
  }

  /**
   * Get all active virtual numbers
   */
  getActiveNumbers(): VirtualNumber[] {
    return Array.from(this.virtualNumbers.values()).filter(num => num.status === 'active');
  }

  /**
   * Get a specific virtual number
   */
  getNumber(phoneNumber: string): VirtualNumber | undefined {
    return this.virtualNumbers.get(phoneNumber);
  }

  /**
   * Cancel a virtual number
   */
  async cancelNumber(phoneNumber: string): Promise<boolean> {
    try {
      const virtualNumber = this.virtualNumbers.get(phoneNumber);
      if (!virtualNumber) {
        return false;
      }

      const provider = this.getProvider();
      const success = await provider.cancelNumber(phoneNumber);
      
      if (success) {
        virtualNumber.status = 'cancelled';
        this.virtualNumbers.set(phoneNumber, virtualNumber);
        
        // Clear polling interval
        const intervalId = this.pollingIntervals.get(phoneNumber);
        if (intervalId) {
          clearInterval(intervalId);
          this.pollingIntervals.delete(phoneNumber);
        }
        
        console.log(`[Service] Cancelled virtual number: ${phoneNumber}`);
      }
      
      return success;
    } catch (error) {
      console.error(`[Service] Error cancelling number ${phoneNumber}:`, error);
      return false;
    }
  }

  /**
   * Resend OTP for a number
   */
  async resendOtp(phoneNumber: string): Promise<boolean> {
    try {
      const virtualNumber = this.virtualNumbers.get(phoneNumber);
      if (!virtualNumber || virtualNumber.status !== 'active') {
        return false;
      }

      const provider = this.getProvider();
      return await provider.resendOtp(phoneNumber);
    } catch (error) {
      console.error(`[Service] Error resending OTP for ${phoneNumber}:`, error);
      return false;
    }
  }

  /**
   * Check for OTPs for a specific number
   */
  async checkOtps(phoneNumber: string): Promise<OTP[]> {
    try {
      const virtualNumber = this.virtualNumbers.get(phoneNumber);
      if (!virtualNumber || virtualNumber.status !== 'active') {
        return [];
      }

      const provider = this.getProvider();
      const otps = await provider.checkOtps(phoneNumber);
      
      if (otps.length > 0) {
        virtualNumber.otps = otps;
        this.virtualNumbers.set(phoneNumber, virtualNumber);
      }
      
      return otps;
    } catch (error) {
      console.error(`[Service] Error checking OTPs for ${phoneNumber}:`, error);
      return [];
    }
  }

  /**
   * Remove a virtual number
   */
  removeNumber(phoneNumber: string): boolean {
    const virtualNumber = this.virtualNumbers.get(phoneNumber);
    if (!virtualNumber) {
      return false;
    }

    // Clear polling interval
    const intervalId = this.pollingIntervals.get(phoneNumber);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(phoneNumber);
    }

    this.virtualNumbers.delete(phoneNumber);
    console.log(`[Service] Removed virtual number: ${phoneNumber}`);
    return true;
  }

  /**
   * Check and expire numbers
   */
  private checkExpiredNumbers(): void {
    const now = new Date();
    for (const [phoneNumber, virtualNumber] of this.virtualNumbers.entries()) {
      if (virtualNumber.status === 'active' && virtualNumber.expiresAt < now) {
        virtualNumber.status = 'expired';
        this.virtualNumbers.set(phoneNumber, virtualNumber);
        
        // Clear polling interval
        const intervalId = this.pollingIntervals.get(phoneNumber);
        if (intervalId) {
          clearInterval(intervalId);
          this.pollingIntervals.delete(phoneNumber);
        }
        
        console.log(`[Service] Virtual number expired: ${phoneNumber}`);
      }
    }
  }

  /**
   * Start the OTP checking loop
   */
  private startOTPChecking(): void {
    this.checkInterval = setInterval(async () => {
      await this.checkAllNumbersForOTPs();
      this.checkExpiredNumbers(); // Also check for expired numbers
    }, 3000); // Check every 3 seconds
  }

  /**
   * Check all numbers for new OTPs
   */
  private async checkAllNumbersForOTPs(): Promise<void> {
    try {
      const provider = this.getProvider();
      
      for (const virtualNumber of this.virtualNumbers.values()) {
        if (virtualNumber.status !== 'active') {
          continue;
        }

        try {
          const newOtps = await provider.checkOtps(virtualNumber.number);
          
          if (newOtps.length > 0) {
            virtualNumber.otps.push(...newOtps);
            this.virtualNumbers.set(virtualNumber.number, virtualNumber);
            
            console.log(`[Service] Received ${newOtps.length} new OTP(s) for ${virtualNumber.number}`);
            
            // Emit OTP update event
            if (global.io) {
              global.io.to(`number-${virtualNumber.number}`).emit('otpUpdate', {
                number: virtualNumber.number,
                otps: newOtps
              });
            }
          }
        } catch (error) {
          console.error(`[Service] Error checking OTPs for ${virtualNumber.number}:`, error);
        }
      }
    } catch (error) {
      console.error('[Service] Error checking all numbers for OTPs:', error);
    }
  }

  /**
   * Expire a number (called when lifetime expires)
   */
  private expireNumber(number: string): void {
    const virtualNumber = this.virtualNumbers.get(number);
    if (virtualNumber && virtualNumber.status === 'active') {
      virtualNumber.status = 'expired';
      this.virtualNumbers.set(number, virtualNumber);
      console.log(`[Service] Number expired: ${number}`);
      
      // Emit WebSocket event for expiration
      this.emitNumberExpired(number);
    }
  }

  /**
   * Clean up expired numbers (called periodically)
   */
  private cleanupExpiredNumbers(): void {
    const now = new Date();
    for (const [number, virtualNumber] of this.virtualNumbers.entries()) {
      if (virtualNumber.status === 'active' && virtualNumber.expiresAt < now) {
        this.expireNumber(number);
      }
    }
  }

  /**
   * Emit OTP update event via WebSocket
   */
  private emitOTPUpdate(number: string, otps: OTP[]): void {
    if (global.io) {
      global.io.to(`number-${number}`).emit('otpUpdate', { 
        number, 
        otps,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit number expired event via WebSocket
   */
  private emitNumberExpired(number: string): void {
    if (global.io) {
      global.io.to(`number-${number}`).emit('numberExpired', { 
        number,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Cleanup method to stop the service
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    this.pollingIntervals.clear();
  }
} 