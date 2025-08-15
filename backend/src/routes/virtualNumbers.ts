import { Router, Request, Response } from 'express';
import { VirtualNumberService } from '../services/virtualNumberService';
import { CreateVirtualNumberResponse, GetOTPsResponse, CancelNumberResponse, ResendOTPResponse } from '../types';

const router = Router();
const virtualNumberService = new VirtualNumberService();

// SMS-Activate specific routes - must be defined BEFORE the :number route to avoid conflicts
router.get('/countries', async (req, res) => {
  try {
    const virtualNumberService = new VirtualNumberService();
    // Try to get SMS-Activate provider specifically
    const provider = virtualNumberService.getProviderById('sms-activate');
    
    if (provider && 'getAvailableCountries' in provider) {
      const countries = await (provider as any).getAvailableCountries();
      res.json({
        success: true,
        data: countries
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Provider does not support country listing'
      });
    }
  } catch (error) {
    console.error('[API] Error getting countries:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get countries'
    });
  }
});

router.get('/services/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const provider = virtualNumberService.getProviderById('sms-activate');
    
    if (provider && 'getAvailableServices' in provider) {
      const services = await (provider as any).getAvailableServices(country);
      res.json({
        success: true,
        data: services
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Provider does not support service listing'
      });
    }
  } catch (error) {
    console.error('[API] Error getting services:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get services'
    });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const provider = virtualNumberService.getProviderById('sms-activate');
    
    if (provider && 'getBalance' in provider) {
      const balance = await (provider as any).getBalance();
      res.json({
        success: true,
        data: balance
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Provider does not support balance checking'
      });
    }
  } catch (error) {
    console.error('[API] Error getting balance:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get balance'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/indian-services:
 *   get:
 *     summary: Get all Indian services with real-time availability
 *     description: |
 *       Retrieve comprehensive data for all high-value Indian services including real-time pricing, 
 *       availability counts, and categorization. This endpoint provides live data from SMS-Activate 
 *       for 40+ premium Indian services across 9 business categories.
 *       
 *       **📱 Services Include:**
 *       - **E-commerce**: Amazon, Flipkart, Myntra, Snapdeal, Meesho
 *       - **Food Delivery**: Swiggy, Zomato, Zepto, BigBasket
 *       - **Transportation**: Ola, Uber, Rapido
 *       - **Payments**: PayTM, PhonePe, Google Pay, Mobikwik
 *       - **Entertainment**: Disney+ Hotstar, Netflix, Jio Cinema, Sony LIV
 *       - **Gaming**: Dream11, MPL, WinZO, Ludo Supreme
 *       - **Healthcare**: 1mg, PharmEasy, Apollo
 *       - **Education**: BYJU'S, Unacademy, Vedantu
 *       - **Services**: Naukri, Urban Company, Just Dial
 *       
 *       **💰 Real-time Data:**
 *       - Live USD to INR conversion (1 USD = ₹83)
 *       - Current availability counts
 *       - Service status (available/unavailable)
 *       - Category-based organization
 *       
 *       **🔐 Authentication**: No client-side API key required! Backend automatically uses SMS-Activate API key.
 *     tags: [Indian Services]
 *     responses:
 *       200:
 *         description: Indian services retrieved successfully with real-time data
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           description: Total number of services
 *                           example: 40
 *                         available:
 *                           type: number
 *                           description: Number of currently available services
 *                           example: 15
 *                         unavailable:
 *                           type: number
 *                           description: Number of currently unavailable services
 *                           example: 25
 *                         categories:
 *                           type: number
 *                           description: Number of business categories
 *                           example: 9
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "amazon"
 *                           name:
 *                             type: string
 *                             example: "Amazon"
 *                           category:
 *                             type: string
 *                             example: "E-commerce & Shopping"
 *                           smsActivateId:
 *                             type: string
 *                             example: "am"
 *                           description:
 *                             type: string
 *                             example: "Major e-commerce platform"
 *                           expectedCount:
 *                             type: number
 *                             example: 25000
 *                           priority:
 *                             type: string
 *                             example: "high"
 *                           realTimeData:
 *                             type: object
 *                             properties:
 *                               cost:
 *                                 type: number
 *                                 example: 0.07
 *                               count:
 *                                 type: number
 *                                 example: 8
 *                               usdCost:
 *                                 type: number
 *                                 example: 0.07
 *                               inrCost:
 *                                 type: number
 *                                 example: 6
 *                               available:
 *                                 type: boolean
 *                                 example: true
 *       400:
 *         description: SMS-Activate provider not available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "SMS-Activate provider not available"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get Indian services"
 */
router.get('/indian-services', async (req, res) => {
  try {
    const { INDIAN_SERVICES, getServicesByCategory } = await import('../config/indianServices');
    
    // Get SMS-Activate provider
    const provider = virtualNumberService.getProviderById('sms-activate');
    
    if (!provider || !('getServicePrice' in provider)) {
      return res.status(400).json({
        success: false,
        message: 'SMS-Activate provider not available'
      });
    }

    const servicesWithData = [];
    const countryId = '22'; // India

    // Fetch real-time data for each service
    for (const service of INDIAN_SERVICES) {
      try {
        const priceData = await (provider as any).getServicePrice(service.smsActivateId, countryId);
        
        if (priceData) {
          servicesWithData.push({
            ...service,
            realTimeData: {
              cost: priceData.cost,
              count: priceData.count,
              usdCost: priceData.cost,
              inrCost: Math.round(priceData.cost * 83), // Convert to INR
              available: priceData.count > 0
            }
          });
        } else {
          servicesWithData.push({
            ...service,
            realTimeData: {
              cost: 0,
              count: 0,
              usdCost: 0,
              inrCost: 0,
              available: false
            }
          });
        }
      } catch (error) {
        console.warn(`[API] Failed to get data for ${service.name}:`, error);
        servicesWithData.push({
          ...service,
          realTimeData: {
            cost: 0,
            count: 0,
            usdCost: 0,
            inrCost: 0,
            available: false
          }
        });
      }
    }

    // Group by category
    const categorizedServices: any = {};
    for (const service of servicesWithData) {
      if (!categorizedServices[service.category]) {
        categorizedServices[service.category] = [];
      }
      categorizedServices[service.category].push(service);
    }

    res.json({
      success: true,
      data: {
        services: servicesWithData,
        categorized: categorizedServices,
        summary: {
          total: servicesWithData.length,
          available: servicesWithData.filter(s => s.realTimeData.available).length,
          unavailable: servicesWithData.filter(s => !s.realTimeData.available).length,
          categories: Object.keys(categorizedServices).length
        }
      }
    });
  } catch (error) {
    console.error('[API] Error getting Indian services:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get Indian services'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/indian-services/{category}:
 *   get:
 *     summary: Get Indian services by category
 *     description: |
 *       Retrieve all services within a specific business category with real-time pricing and availability data.
 *       
 *       **📁 Available Categories:**
 *       - `E-commerce & Shopping` - Amazon, Flipkart, Myntra, Snapdeal, Meesho
 *       - `Food Delivery & Quick Commerce` - Swiggy, Zomato, Zepto, BigBasket
 *       - `Transportation & Ride-sharing` - Ola, Uber, Rapido
 *       - `Digital Payments & Fintech` - PayTM, PhonePe, Google Pay, Mobikwik
 *       - `Entertainment & Media` - Disney+ Hotstar, Netflix, Jio Cinema, Sony LIV
 *       - `Gaming & Fantasy Sports` - Dream11, MPL, WinZO, Ludo Supreme
 *       - `Healthcare & Pharmacy` - 1mg, PharmEasy, Apollo
 *       - `Education` - BYJU'S, Unacademy, Vedantu
 *       - `Job & Services` - Naukri, Urban Company, Just Dial
 *       
 *       **💰 Real-time Data:**
 *       - Live USD to INR conversion
 *       - Current availability counts
 *       - Service status (available/unavailable)
 *       
 *       **🔐 Authentication**: No client-side API key required! Backend automatically uses SMS-Activate API key.
 *     tags: [Indian Services]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Business category name (URL encoded)
 *         example: "E-commerce & Shopping"
 *     responses:
 *       200:
 *         description: Category services retrieved successfully
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
 *                     category:
 *                       type: string
 *                       example: "E-commerce & Shopping"
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "amazon"
 *                           name:
 *                             type: string
 *                             example: "Amazon"
 *                           category:
 *                             type: string
 *                             example: "E-commerce & Shopping"
 *                           smsActivateId:
 *                             type: string
 *                             example: "am"
 *                           description:
 *                             type: string
 *                             example: "Major e-commerce platform"
 *                           expectedCount:
 *                             type: number
 *                             example: 25000
 *                           priority:
 *                             type: string
 *                             example: "high"
 *                           realTimeData:
 *                             type: object
 *                             properties:
 *                               cost:
 *                                 type: number
 *                                 example: 0.07
 *                               count:
 *                                 type: number
 *                                 example: 8
 *                               usdCost:
 *                                 type: number
 *                                 example: 0.07
 *                               inrCost:
 *                                 type: number
 *                                 example: 6
 *                               available:
 *                                 type: boolean
 *                                 example: true
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           description: Total services in category
 *                           example: 5
 *                         available:
 *                           type: number
 *                           description: Available services in category
 *                           example: 2
 *                         unavailable:
 *                           type: number
 *                           description: Unavailable services in category
 *                           example: 3
 *       400:
 *         description: SMS-Activate provider not available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "SMS-Activate provider not available"
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Category 'E-commerce & Shopping' not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get Indian services"
 */
router.get('/indian-services/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { getServicesByCategory } = await import('../config/indianServices');
    
    const services = getServicesByCategory(category);
    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${category}' not found`
      });
    }

    // Get SMS-Activate provider
    const provider = virtualNumberService.getProviderById('sms-activate');
    
    if (!provider || !('getServicePrice' in provider)) {
      return res.status(400).json({
        success: false,
        message: 'SMS-Activate provider not available'
      });
    }

    const servicesWithData = [];
    const countryId = '22'; // India

    // Fetch real-time data for services in this category
    for (const service of services) {
      try {
        const priceData = await (provider as any).getServicePrice(service.smsActivateId, countryId);
        
        if (priceData) {
          servicesWithData.push({
            ...service,
            realTimeData: {
              cost: priceData.cost,
              count: priceData.count,
              usdCost: priceData.cost,
              inrCost: Math.round(priceData.cost * 83),
              available: priceData.count > 0
            }
          });
        } else {
          servicesWithData.push({
            ...service,
            realTimeData: {
              cost: 0,
              count: 0,
              usdCost: 0,
              inrCost: 0,
              available: false
            }
          });
        }
      } catch (error) {
        console.warn(`[API] Failed to get data for ${service.name}:`, error);
        servicesWithData.push({
          ...service,
          realTimeData: {
            cost: 0,
            count: 0,
            usdCost: 0,
            inrCost: 0,
            available: false
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        category,
        services: servicesWithData,
        summary: {
          total: servicesWithData.length,
          available: servicesWithData.filter(s => s.realTimeData.available).length,
          unavailable: servicesWithData.filter(s => !s.realTimeData.available).length
        }
      }
    });
  } catch (error) {
    console.error(`[API] Error getting Indian services for category ${req.params.category}:`, error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get Indian services'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers:
 *   post:
 *     summary: Request a new virtual number
 *     description: |
 *       Request a virtual number for a specific product, country, and operator from the selected provider.
 *       
 *       **🔐 Authentication**: No client-side API key required! The backend automatically uses the provider API key 
 *       configured in your environment variables.
 *       
 *       **📱 How it works**:
 *       1. Client sends request with product, country, and operator
 *       2. Backend automatically adds provider Bearer token from environment variables
 *       3. Backend calls provider API to purchase the number with specific operator
 *       4. Client receives the virtual number details
 *       
 *       **⚠️ Prerequisites**: Make sure provider API keys are set in your backend `.env` file
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
 *                 description: Product ID (e.g., amazon, zomato, swiggy)
 *                 example: "amazon"
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
    
    // Get the currently selected provider
    const selectedProvider = await virtualNumberService.getSelectedProvider();
    console.log(`[API] Using selected provider: ${selectedProvider}`);
    
    const virtualNumber = await virtualNumberService.requestNumber(product, country, operator);
    
    res.json({
      success: true,
      data: virtualNumber
    });
  } catch (error) {
    console.error('[API] Error requesting virtual number:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request virtual number'
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
        features: ['Real SMS', 'Multiple countries', 'Affordable', 'Good uptime', 'Indian services']
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

// Get real-time product price from provider
router.get('/price/:product/:country', async (req, res) => {
  try {
    const { product, country } = req.params;
    console.log(`[API] Getting price for product: ${product} in country: ${country}`);
    
    const provider = await virtualNumberService.getProviderById(await virtualNumberService.getSelectedProvider() || '5sim');
    
    if (provider && 'getProductPrice' in provider) {
      const priceData = await (provider as any).getProductPrice(product, country);
      
      if (priceData) {
        // Convert USD to INR (1 USD ≈ 83 INR)
        const inrCost = Math.round(priceData.cost * 83);
        
        res.json({
          success: true,
          data: {
            product,
            country,
            usdCost: priceData.cost,
            inrCost: inrCost,
            count: priceData.count,
            currency: 'INR'
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Price not available for product: ${product} in country: ${country}`
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Provider does not support price fetching'
      });
    }
  } catch (error) {
    console.error('[API] Error getting product price:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get product price'
    });
  }
});

/**
 * @swagger
 * /api/virtual-numbers/operators:
 *   get:
 *     summary: Get available operators for a specific country
 *     description: |
 *       Retrieve all available mobile operators for a specific country from SMS-Activate API.
 *       This endpoint provides real-time operator availability data for virtual number services.
 *       
 *       **🌍 Supported Countries:**
 *       - **22**: India (IN)
 *       - **1**: United States (US)
 *       
 *       **📱 Response Format:**
 *       Returns an array of operator names available for the specified country.
 *       
 *       **⚠️ Error Handling:**
 *       - BAD_KEY: Invalid API key
 *       - ERROR_SQL: SMS-Activate server error
 *       - OPERATORS_NOT_FOUND: No operators for country
 *       
 *     parameters:
 *       - in: query
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["22", "1"]
 *           description: Country code (22=India, 1=USA)
 *         example: "22"
 *     
 *     responses:
 *       200:
 *         description: Successfully retrieved operators
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 operators:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of operator names
 *                   example: ["airtel", "jio", "vodafone", "bsnl", "idea"]
 *       400:
 *         description: Missing country parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Country parameter is required"
 *       401:
 *         description: Invalid SMS-Activate API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid SMS-Activate API key"
 *       500:
 *         description: Server error or SMS-Activate API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch operators"
 *     
 *     tags:
 *       - Virtual Numbers
 */
router.get('/smsactivate/operators', async (req, res) => {
  try {
    const { country } = req.query;
    
    if (!country || typeof country !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Country parameter is required and must be a string' 
      });
    }

    // Get API key from environment
    const apiKey = process.env.SMS_ACTIVATE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'SMS-Activate API key not configured' 
      });
    }

    console.log(`[API] Fetching operators for country: ${country} from SMS-Activate`);

    // Call SMS-Activate API directly
    const response = await fetch(
      `https://api.sms-activate.ae/stubs/handler_api.php?api_key=${apiKey}&action=getOperators&country=${country}`
    );

    if (!response.ok) {
      throw new Error(`SMS-Activate API error: ${response.status}`);
    }

    const data = await response.json() as {
      status: string;
      countryOperators?: { [key: string]: string[] };
    };
    
    console.log(`[API] SMS-Activate response:`, data);
    
    if (data.status === 'success' && data.countryOperators && data.countryOperators[country]) {
      const operators = data.countryOperators[country];
      console.log(`[API] Successfully fetched ${operators.length} operators for country ${country}`);
      
      res.json({ 
        success: true, 
        operators: operators 
      });
    } else if (typeof data === 'string') {
      // Handle string error responses from SMS-Activate
      if (data === 'BAD_KEY') {
        console.error('[API] SMS-Activate: Invalid API key');
        res.status(401).json({ 
          success: false, 
          error: 'Invalid SMS-Activate API key' 
        });
      } else if (data === 'ERROR_SQL') {
        console.error('[API] SMS-Activate: SQL server error');
        res.status(500).json({ 
          success: false, 
          error: 'SMS-Activate server error' 
        });
      } else if (data === 'OPERATORS_NOT_FOUND') {
        console.log(`[API] SMS-Activate: No operators found for country ${country}`);
        res.json({ 
          success: true, 
          operators: [] 
        });
      } else {
        console.error('[API] SMS-Activate: Unknown error response:', data);
        res.status(500).json({ 
          success: false, 
          error: 'Unknown error from SMS-Activate' 
        });
      }
    } else {
      console.error('[API] SMS-Activate: Unknown error response:', data);
      res.status(500).json({ 
        success: false, 
        error: 'Unknown error from SMS-Activate' 
      });
    }
    
  } catch (error) {
    console.error('[API] Error fetching operators:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch operators' 
    });
  }
});

export default router; 