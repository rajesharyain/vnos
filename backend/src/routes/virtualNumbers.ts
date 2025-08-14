import { Router, Request, Response } from 'express';
import { VirtualNumberService } from '../services/virtualNumberService';
import { CreateVirtualNumberResponse, GetOTPsResponse, CancelNumberResponse, ResendOTPResponse } from '../types';

const router = Router();
const virtualNumberService = new VirtualNumberService();

/**
 * @swagger
 * /api/virtual-numbers:
 *   post:
 *     summary: Request a new virtual number
 *     description: |
 *       Request a virtual number for a specific product, country, and operator from the selected provider.
 *       
 *       **🔐 Authentication**: No client-side API key required! The backend automatically uses the 5SIM API key 
 *       configured in your environment variables (`FIVESIM_API_KEY`).
 *       
 *       **📱 How it works**:
 *       1. Client sends request with product, country, and operator
 *       2. Backend automatically adds 5SIM Bearer token from `FIVESIM_API_KEY`
 *       3. Backend calls 5SIM API to purchase the number with specific operator
 *       4. Client receives the virtual number details
 *       
 *       **⚠️ Prerequisites**: Make sure `FIVESIM_API_KEY` is set in your backend `.env` file
 *       
 *       **🔗 5SIM API Endpoint**: `GET /user/buy/activation/{country}/{operator}/{product}`
 *     tags: [Virtual Numbers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID (e.g., jiomart, zomato, swiggy)
 *                 example: "jiomart"
 *               country:
 *                 type: string
 *                 description: Country code (defaults to india)
 *                 example: "india"
 *               operator:
 *                 type: string
 *                 description: Telecom operator (e.g., airtel, jio, vodafone)
 *                 example: "airtel"
 *     responses:
 *       200:
 *         description: Virtual number requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VirtualNumber'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { product, country = 'india', operator } = req.body;
    
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    console.log(`[API] Requesting virtual number with product: ${product}, country: ${country}, operator: ${operator || 'any'}`);
    
    // Explicitly select 5SIM provider before requesting number
    await virtualNumberService.selectProvider('5sim');
    console.log(`[API] Selected 5SIM provider for virtual number request`);
    
    const virtualNumber = await virtualNumberService.requestNumber(product, country, operator);
    
    res.json({
      success: true,
      data: virtualNumber
    });
  } catch (error) {
    console.error('[API] Error requesting virtual number:', error);
    
    res.status(500).json({
      success: error instanceof Error ? error.message : 'Failed to request virtual number'
    });
  }
});

// Provider routes - must be defined BEFORE the :number route to avoid conflicts
router.get('/providers', async (req: Request, res: Response) => {
  try {
    // Temporary fix: Return hardcoded providers instead of calling the service
    const providers = [
      {
        id: '5sim',
        name: '5SIM',
        cost: '$0.10-0.50 per number',
        features: ['Real SMS', 'USA numbers', 'Low cost', 'Good coverage', 'Instant activation']
      },
      {
        id: 'twilio',
        name: 'Twilio',
        cost: '$1/month per number',
        features: ['Real SMS', 'High reliability', 'Global coverage', 'Professional support']
      },
      {
        id: 'sms-activate',
        name: 'SMS-Activate',
        cost: '$0.20-0.80 per number',
        features: ['Real SMS', 'Multiple countries', 'Affordable', 'Good uptime']
      },
      {
        id: 'mock',
        name: 'Mock Provider',
        cost: 'Free',
        features: ['Development only', 'No real SMS', 'Instant numbers']
      }
    ];
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('[API] Error getting providers:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get providers'
    });
  }
});

router.get('/providers/selected', async (req: Request, res: Response) => {
  try {
    // Temporary fix: Return default selected provider
    const selectedProvider = {
      providerId: '5sim',
      providerName: '5SIM',
      selectedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: selectedProvider
    });
  } catch (error) {
    console.error('[API] Error getting selected provider:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get selected provider'
    });
  }
});

router.get('/providers/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Temporary fix: Return default provider status
    const providerStatus = {
      providerId: id,
      available: true,
      status: 'active',
      lastChecked: new Date().toISOString(),
      reason: 'Available for testing'
    };
    
    res.json({
      success: true,
      data: providerStatus
    });
  } catch (error) {
    console.error('[API] Error getting provider status:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get provider status'
    });
  }
});

router.post('/providers/:id/select', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Temporary fix: Return success response
    const result = {
      providerId: id,
      providerName: id === '5sim' ? '5SIM' : id === 'twilio' ? 'Twilio' : id === 'sms-activate' ? 'SMS-Activate' : 'Mock'
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[API] Error selecting provider:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to select provider'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/providers/{id}/countries:
 *   get:
 *     summary: Get available countries for a provider
 *     description: Retrieve a list of countries available for a specific provider
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID to get countries for
 *         example: "5sim"
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Country'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/providers/:id/countries', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const countries = await virtualNumberService.getProviderCountries(id);
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('[API] Error getting provider countries:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get provider countries'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/providers/{id}/countries/{countryId}/products:
 *   get:
 *     summary: Get available products for a provider and country
 *     description: Retrieve a list of products available for a specific provider and country
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *         example: "5sim"
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *         example: "india"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/providers/:id/countries/:countryId/products', async (req: Request, res: Response) => {
  try {
    const { id, countryId } = req.params;
    const products = await virtualNumberService.getProviderProducts(id, countryId);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('[API] Error getting provider products:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get provider products'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/providers/{id}/countries/{countryId}/details:
 *   get:
 *     summary: Get detailed country information for a provider
 *     description: Retrieve detailed information about a specific country for a provider
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *         example: "5sim"
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *         example: "india"
 *     responses:
 *       200:
 *         description: Country details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "india"
 *                     name:
 *                       type: string
 *                       example: "India"
 *                     products:
 *                       type: object
 *                       description: Available products and their details
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/providers/:id/countries/:countryId/details', async (req: Request, res: Response) => {
  try {
    const { id, countryId } = req.params;
    const countryDetails = await virtualNumberService.getCountryDetails(id, countryId);
    
    if (!countryDetails) {
      return res.status(404).json({
        success: false,
        error: 'Country not found'
      });
    }
    
    res.json({
      success: true,
      data: countryDetails
    });
  } catch (error) {
    console.error('[API] Error getting country details:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get country details'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers:
 *   get:
 *     summary: Get all active virtual numbers
 *     description: Retrieve a list of all currently active virtual numbers
 *     tags: [Virtual Numbers]
 *     responses:
 *       200:
 *         description: List of active virtual numbers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VirtualNumber'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const activeNumbers = virtualNumberService.getActiveNumbers();
    
    res.json({
      success: true,
      data: activeNumbers
    });
  } catch (error) {
    console.error('[API] Error getting active numbers:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get active numbers'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/{number}:
 *   get:
 *     summary: Get a specific virtual number
 *     description: Retrieve details of a specific virtual number by phone number
 *     tags: [Virtual Numbers]
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone number to retrieve
 *         example: "+91XXXXXXXXXX"
 *     responses:
 *       200:
 *         description: Virtual number retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VirtualNumber'
 *       404:
 *         description: Virtual number not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:number', (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const virtualNumber = virtualNumberService.getNumber(number);
    
    if (!virtualNumber) {
      return res.status(404).json({
        success: false,
        error: 'Virtual number not found'
      });
    }
    
    res.json({
      success: true,
      data: virtualNumber
    });
  } catch (error) {
    console.error('[API] Error getting virtual number:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get virtual number'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/{number}/otps:
 *   get:
 *     summary: Get OTPs for a specific virtual number
 *     description: Retrieve all OTPs received for a specific virtual number
 *     tags: [OTPs]
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone number to check OTPs for
 *         example: "+91XXXXXXXXXX"
 *     responses:
 *       200:
 *         description: OTPs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OTP'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:number/otps', async (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    
    const otps = await virtualNumberService.checkOtps(number);
    
    res.json({
      success: true,
      data: otps
    });
  } catch (error) {
    console.error('[API] Error checking OTPs:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check OTPs'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/{number}/resend:
 *   post:
 *     summary: Resend OTP for a specific virtual number
 *     description: Request a new OTP to be sent to the virtual number
 *     tags: [OTPs]
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone number to resend OTP for
 *         example: "+91XXXXXXXXXX"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP resent successfully"
 *       400:
 *         description: Bad request - failed to resend OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:number/resend', async (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    
    const success = await virtualNumberService.resendOtp(number);
    
    if (success) {
      res.json({
        success: true,
        message: 'OTP resent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to resend OTP'
      });
    }
  } catch (error) {
    console.error('[API] Error resending OTP:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend OTP'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/{number}:
 *   delete:
 *     summary: Cancel a virtual number
 *     description: Cancel and release a virtual number, getting a refund if applicable
 *     tags: [Virtual Numbers]
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone number to cancel
 *         example: "+91XXXXXXXXXX"
 *     responses:
 *       200:
 *         description: Virtual number cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Number cancelled successfully"
 *       404:
 *         description: Virtual number not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:number', async (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    
    const success = await virtualNumberService.cancelNumber(number);
    
    if (success) {
      res.json({
        success: true,
        message: 'Number cancelled successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Virtual number not found'
      });
    }
  } catch (error) {
    console.error('[API] Error cancelling number:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to cancel virtual number'
    });
  }
});

export default router; 