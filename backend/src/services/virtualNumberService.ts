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
  private activeNumbers: Map<string, VirtualNumber> = new Map();
  private provider: VirtualNumberProvider | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly NUMBER_LIFETIME_MS = 60000; // 60 seconds

  constructor() {
    // Don't initialize provider here - do it lazily when needed
    this.startOTPChecking();
  }

  /**
   * Get or create the appropriate provider
   */
  private getProvider(): VirtualNumberProvider {
    if (this.provider) {
      return this.provider;
    }

    // Use provider factory to get the selected or best available provider
    try {
      this.provider = ProviderFactory.getBestProvider();
      console.log(`[Service] Using provider: ${this.provider.constructor.name}`);
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
  async requestNumber(): Promise<VirtualNumber> {
    try {
      const provider = this.getProvider();
      const number = await provider.requestNumber();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.NUMBER_LIFETIME_MS);

      const virtualNumber: VirtualNumber = {
        id: uuidv4(),
        number,
        createdAt: now,
        expiresAt,
        isActive: true,
        otps: []
      };

      this.activeNumbers.set(number, virtualNumber);
      
      // Schedule expiration
      setTimeout(() => {
        this.expireNumber(number);
      }, this.NUMBER_LIFETIME_MS);

      console.log(`[Service] Created virtual number: ${number} (expires at ${expiresAt.toISOString()})`);
      return virtualNumber;
    } catch (error) {
      console.error('[Service] Error requesting number:', error);
      throw new Error(`Failed to request virtual number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all active virtual numbers
   */
  getActiveNumbers(): VirtualNumber[] {
    return Array.from(this.activeNumbers.values()).filter(num => num.isActive);
  }

  /**
   * Get a specific virtual number
   */
  getNumber(number: string): VirtualNumber | undefined {
    return this.activeNumbers.get(number);
  }

  /**
   * Cancel/Release a virtual number
   */
  async cancelNumber(number: string): Promise<boolean> {
    const virtualNumber = this.activeNumbers.get(number);
    if (!virtualNumber || !virtualNumber.isActive) {
      return false;
    }

    try {
      const provider = this.getProvider();
      const success = await provider.cancelNumber(number);
      if (success) {
        virtualNumber.isActive = false;
        this.activeNumbers.set(number, virtualNumber);
        console.log(`[Service] Cancelled number: ${number}`);
      }
      return success;
    } catch (error) {
      console.error('[Service] Error cancelling number:', error);
      return false;
    }
  }

  /**
   * Resend OTP for a number
   */
  async resendOTP(number: string): Promise<boolean> {
    const virtualNumber = this.activeNumbers.get(number);
    if (!virtualNumber || !virtualNumber.isActive) {
      return false;
    }

    try {
      const provider = this.getProvider();
      const success = await provider.resendOTP(number);
      if (success) {
        console.log(`[Service] Resent OTP for number: ${number}`);
      }
      return success;
    } catch (error) {
      console.error('[Service] Error resending OTP:', error);
      return false;
    }
  }

  /**
   * Get OTPs for a specific number
   */
  getOTPs(number: string): OTP[] {
    const virtualNumber = this.activeNumbers.get(number);
    return virtualNumber ? virtualNumber.otps : [];
  }

  /**
   * Start the OTP checking loop
   */
  private startOTPChecking(): void {
    this.checkInterval = setInterval(async () => {
      await this.checkAllNumbersForOTPs();
    }, 3000); // Check every 3 seconds
  }

  /**
   * Check all active numbers for new OTPs
   */
  private async checkAllNumbersForOTPs(): Promise<void> {
    const activeNumbers = this.getActiveNumbers();
    
    for (const virtualNumber of activeNumbers) {
      try {
        const provider = this.getProvider();
        const newOtps = await provider.checkForOTP(virtualNumber.number);
        
        if (newOtps.length > 0) {
          virtualNumber.otps.push(...newOtps);
          this.activeNumbers.set(virtualNumber.number, virtualNumber);
          
          console.log(`[Service] Received ${newOtps.length} new OTP(s) for ${virtualNumber.number}`);
          
          // Emit WebSocket event for real-time updates
          this.emitOTPUpdate(virtualNumber.number, newOtps);
        }
      } catch (error) {
        console.error(`[Service] Error checking OTPs for ${virtualNumber.number}:`, error);
      }
    }
  }

  /**
   * Expire a number (called when lifetime expires)
   */
  private expireNumber(number: string): void {
    const virtualNumber = this.activeNumbers.get(number);
    if (virtualNumber && virtualNumber.isActive) {
      virtualNumber.isActive = false;
      this.activeNumbers.set(number, virtualNumber);
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
    for (const [number, virtualNumber] of this.activeNumbers.entries()) {
      if (virtualNumber.expiresAt < now && virtualNumber.isActive) {
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
  }
} 