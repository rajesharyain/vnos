import { VirtualNumberProvider } from '../types';
import { MockVirtualNumberProvider } from './mockProvider';
import { TwilioVirtualNumberProvider } from './twilioProvider';
import { FiveSimProvider } from './fiveSimProvider';
import { SMSActivateProvider } from './smsActivateProvider';

/**
 * Provider Factory
 * 
 * Allows users to choose between different virtual number providers
 * based on cost, reliability, and geographic preferences
 */
export class ProviderFactory {
  private static providers: Map<string, VirtualNumberProvider> = new Map();
  private static selectedProvider: string | null = null;

  /**
   * Get available providers
   */
  static getAvailableProviders(): Array<{ id: string; name: string; cost: string; features: string[] }> {
    return [
      {
        id: 'twilio',
        name: 'Twilio',
        cost: '$1/month per number',
        features: ['Real SMS', 'High reliability', 'Global coverage', 'Professional support']
      },
      {
        id: '5sim',
        name: '5SIM',
        cost: '$0.10-0.50 per number',
        features: ['Real SMS', 'Indian numbers', 'Low cost', 'Good coverage', 'Instant activation']
      },
      {
        id: 'sms-activate',
        name: 'SMS-Activate',
        cost: '$0.20-0.80 per number',
        features: ['Real SMS', 'Indian numbers', 'Affordable', 'Multiple countries', 'Good uptime']
      },
      {
        id: 'mock',
        name: 'Mock Provider',
        cost: 'Free',
        features: ['Development only', 'No real SMS', 'Instant numbers']
      }
    ];
  }

  /**
   * Set the selected provider
   */
  static setSelectedProvider(providerId: string): void {
    this.selectedProvider = providerId;
    console.log(`[ProviderFactory] Provider set to: ${providerId}`);
  }

  /**
   * Get the currently selected provider
   */
  static getSelectedProvider(): string | null {
    return this.selectedProvider;
  }

  /**
   * Get provider by ID
   */
  static getProvider(providerId: string): VirtualNumberProvider {
    // Return cached provider if available
    if (this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }

    let provider: VirtualNumberProvider;

    switch (providerId.toLowerCase()) {
      case 'twilio':
        try {
          if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            provider = new TwilioVirtualNumberProvider();
            console.log('[ProviderFactory] Using Twilio provider');
          } else {
            throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
          }
        } catch (error) {
          console.error('[ProviderFactory] Failed to initialize Twilio:', error);
          throw error; // Don't fall back automatically
        }
        break;

      case '5sim':
        try {
          if (process.env.FIVESIM_API_KEY) {
            provider = new FiveSimProvider();
            console.log('[ProviderFactory] Using 5SIM provider');
          } else {
            throw new Error('5SIM API key not configured. Please set FIVESIM_API_KEY environment variable.');
          }
        } catch (error) {
          console.error('[ProviderFactory] Failed to initialize 5SIM:', error);
          throw error; // Don't fall back automatically
        }
        break;

      case 'sms-activate':
        try {
          if (process.env.SMS_ACTIVATE_API_KEY) {
            provider = new SMSActivateProvider();
            console.log('[ProviderFactory] Using SMS-Activate provider');
          } else {
            throw new Error('SMS-Activate API key not configured. Please set SMS_ACTIVATE_API_KEY environment variable.');
          }
        } catch (error) {
          console.error('[ProviderFactory] Failed to initialize SMS-Activate:', error);
          throw error; // Don't fall back automatically
        }
        break;

      case 'mock':
        provider = new MockVirtualNumberProvider();
        console.log('[ProviderFactory] Using mock provider');
        break;

      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }

    // Cache the provider
    this.providers.set(providerId, provider);
    return provider;
  }

  /**
   * Get the best available provider based on configuration
   * This will NOT automatically fall back to mock unless explicitly selected
   */
  static getBestProvider(): VirtualNumberProvider {
    // If a provider is explicitly selected, use it
    if (this.selectedProvider) {
      try {
        return this.getProvider(this.selectedProvider);
      } catch (error) {
        console.error(`[ProviderFactory] Selected provider ${this.selectedProvider} failed:`, error);
        throw error; // Don't fall back automatically
      }
    }

    // Priority order: 5SIM > SMS-Activate > Twilio
    // Note: Mock is NOT included in automatic selection
    const providers = ['5sim', 'sms-activate', 'twilio'];
    
    for (const providerId of providers) {
      try {
        const provider = this.getProvider(providerId);
        console.log(`[ProviderFactory] Auto-selected provider: ${providerId}`);
        return provider;
      } catch (error) {
        console.warn(`[ProviderFactory] Failed to initialize ${providerId}:`, error);
        continue;
      }
    }

    // If no provider works, throw an error instead of falling back to mock
    throw new Error('No working providers available. Please check your configuration or explicitly select a provider.');
  }

  /**
   * Clear provider cache
   */
  static clearCache(): void {
    this.providers.clear();
  }

  /**
   * Get provider status
   */
  static getProviderStatus(providerId: string): { available: boolean; reason?: string } {
    try {
      switch (providerId.toLowerCase()) {
        case 'twilio':
          return {
            available: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
            reason: !process.env.TWILIO_ACCOUNT_SID ? 'Missing Account SID' : 
                   !process.env.TWILIO_AUTH_TOKEN ? 'Missing Auth Token' : 'Available'
          };

        case '5sim':
          return {
            available: !!process.env.FIVESIM_API_KEY,
            reason: !process.env.FIVESIM_API_KEY ? 'Missing API Key' : 'Available'
          };

        case 'sms-activate':
          return {
            available: !!process.env.SMS_ACTIVATE_API_KEY,
            reason: !process.env.SMS_ACTIVATE_API_KEY ? 'Missing API Key' : 'Available'
          };

        case 'mock':
          return {
            available: true,
            reason: 'Always available for development'
          };

        default:
          return {
            available: false,
            reason: 'Unknown provider'
          };
      }
    } catch (error) {
      return {
        available: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 