import { Router, Request, Response } from 'express';
import { VirtualNumberService } from '../services/virtualNumberService';
import { CreateVirtualNumberResponse, GetOTPsResponse, CancelNumberResponse, ResendOTPResponse } from '../types';

const router = Router();
const virtualNumberService = new VirtualNumberService();

/**
 * GET /api/virtual-numbers/providers
 * Get all available providers with their costs and features
 */
router.get('/providers', (req: Request, res: Response) => {
  try {
    const providers = virtualNumberService.getAvailableProviders();
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch providers'
    });
  }
});

/**
 * GET /api/virtual-numbers/providers/selected
 * Get the currently selected provider
 */
router.get('/providers/selected', (req: Request, res: Response) => {
  try {
    const selectedProvider = virtualNumberService.getSelectedProvider();
    
    if (!selectedProvider) {
      return res.json({
        success: true,
        data: null,
        message: 'No provider currently selected'
      });
    }

    const status = virtualNumberService.getProviderStatus(selectedProvider);
    
    res.json({
      success: true,
      data: {
        providerId: selectedProvider,
        status: status,
        selectedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to get selected provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get selected provider'
    });
  }
});

/**
 * GET /api/virtual-numbers/providers/:id/status
 * Get status of a specific provider
 */
router.get('/providers/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = virtualNumberService.getProviderStatus(id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider status'
    });
  }
});

/**
 * POST /api/virtual-numbers/providers/:id/select
 * Select a specific provider for future requests
 */
router.post('/providers/:id/select', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate provider ID
    const validProviders = ['twilio', '5sim', 'sms-activate', 'mock'];
    if (!validProviders.includes(id.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider ID. Must be one of: ${validProviders.join(', ')}`
      });
    }

    const provider = virtualNumberService.getProviderById(id);
    
    res.json({
      success: true,
      message: `Provider ${id} selected successfully`,
      data: {
        providerId: id,
        providerName: provider.constructor.name,
        selectedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Failed to select provider ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to select provider: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * GET /api/virtual-numbers/providers/:id/countries
 * Get available countries for a specific provider
 */
router.get('/providers/:id/countries', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = virtualNumberService.getProviderById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Check if provider has getAvailableCountries method
    if (typeof (provider as any).getAvailableCountries === 'function') {
      const countries = await (provider as any).getAvailableCountries();
      res.json({
        success: true,
        data: countries
      });
    } else {
      res.json({
        success: true,
        data: [],
        message: 'Provider does not support country selection'
      });
    }
  } catch (error) {
    console.error(`Failed to get countries for provider ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch countries: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * GET /api/virtual-numbers/providers/:id/countries/:countryId/products
 * Get available products for a specific country and provider
 */
router.get('/providers/:id/countries/:countryId/products', async (req: Request, res: Response) => {
  try {
    const { id, countryId } = req.params;
    const provider = virtualNumberService.getProviderById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Check if provider has getAvailableProducts method
    if (typeof (provider as any).getAvailableProducts === 'function') {
      const products = await (provider as any).getAvailableProducts(countryId);
      res.json({
        success: true,
        data: products
      });
    } else {
      res.json({
        success: true,
        data: [],
        message: 'Provider does not support product selection'
      });
    }
  } catch (error) {
    console.error(`Failed to get products for provider ${req.params.id} and country ${req.params.countryId}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * GET /api/virtual-numbers/providers/:id/countries/:countryId/details
 * Get detailed information about a specific country for a provider
 */
router.get('/providers/:id/countries/:countryId/details', async (req: Request, res: Response) => {
  try {
    const { id, countryId } = req.params;
    const provider = virtualNumberService.getProviderById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Check if provider has getCountryDetails method
    if (typeof (provider as any).getCountryDetails === 'function') {
      const details = await (provider as any).getCountryDetails(countryId);
      if (details) {
        res.json({
          success: true,
          data: details
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }
    } else {
      res.json({
        success: true,
        data: null,
        message: 'Provider does not support country details'
      });
    }
  } catch (error) {
    console.error(`Failed to get country details for provider ${req.params.id} and country ${req.params.countryId}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch country details: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * GET /api/virtual-numbers
 * Get all active virtual numbers
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const activeNumbers = virtualNumberService.getActiveNumbers();
    res.json({
      success: true,
      data: activeNumbers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch virtual numbers'
    });
  }
});

/**
 * POST /api/virtual-numbers
 * Request a new virtual number
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { country, product } = req.query;
    
    // If country and product are specified, use them for the request
    if (country && product) {
      console.log(`[API] Requesting virtual number with country: ${country}, product: ${product}`);
    }
    
    const virtualNumber = await virtualNumberService.requestNumber();
    const response: CreateVirtualNumberResponse = {
      success: true,
      data: virtualNumber
    };
    res.status(201).json(response);
  } catch (error) {
    const response: CreateVirtualNumberResponse = {
      success: false,
      error: 'Failed to request virtual number'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/virtual-numbers/:number/otps
 * Get OTPs for a specific number
 */
router.get('/:number/otps', (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const otps = virtualNumberService.getOTPs(number);
    const response: GetOTPsResponse = {
      success: true,
      data: otps
    };
    res.json(response);
  } catch (error) {
    const response: GetOTPsResponse = {
      success: false,
      error: 'Failed to fetch OTPs'
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /api/virtual-numbers/:number
 * Cancel/Release a virtual number
 */
router.delete('/:number', async (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const success = await virtualNumberService.cancelNumber(number);
    
    if (success) {
      const response: CancelNumberResponse = {
        success: true
      };
      res.json(response);
    } else {
      const response: CancelNumberResponse = {
        success: false,
        error: 'Number not found or already inactive'
      };
      res.status(404).json(response);
    }
  } catch (error) {
    const response: CancelNumberResponse = {
      success: false,
      error: 'Failed to cancel number'
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/virtual-numbers/:number/resend
 * Resend OTP for a number
 */
router.post('/:number/resend', async (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const success = await virtualNumberService.resendOTP(number);
    
    if (success) {
      const response: ResendOTPResponse = {
        success: true
      };
      res.json(response);
    } else {
      const response: ResendOTPResponse = {
        success: false,
        error: 'Number not found or already inactive'
      };
      res.status(404).json(response);
    }
  } catch (error) {
    const response: ResendOTPResponse = {
      success: false,
      error: 'Failed to resend OTP'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/virtual-numbers/:number
 * Get a specific virtual number
 */
router.get('/:number', (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const virtualNumber = virtualNumberService.getNumber(number);
    
    if (virtualNumber) {
      res.json({
        success: true,
        data: virtualNumber
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Virtual number not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch virtual number'
    });
  }
});

export default router; 