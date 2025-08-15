import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Virtual Number OTP Service API',
      version: '1.0.0',
      description: `API for managing virtual phone numbers and OTP services via multiple providers (5SIM, Twilio, SMS-Activate)

## 🔐 Authentication
**No client-side authentication required!** All API keys (5SIM, Twilio, SMS-Activate) are configured server-side in environment variables.

- **5SIM API Key**: Set \`FIVESIM_API_KEY\` in your backend \`.env\` file
- **Twilio Credentials**: Set \`TWILIO_ACCOUNT_SID\` and \`TWILIO_AUTH_TOKEN\`
- **SMS-Activate Key**: Set \`SMS_ACTIVATE_API_KEY\`

## 🚀 Quick Start
1. Configure your provider API keys in the backend \`.env\` file
2. Start the server: \`npm run dev\`
3. Test endpoints directly from this Swagger UI
4. No need to pass API keys in requests - backend handles authentication automatically

## 💡 How It Works
- Client sends requests to your backend API
- Backend automatically adds provider API keys from environment variables
- Backend calls external provider APIs (5SIM, Twilio, etc.)
- Client receives clean responses without dealing with provider authentication`,
      contact: {
        name: 'API Support',
        email: 'support@virtualno.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.virtualno.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        VirtualNumber: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the virtual number'
            },
            number: {
              type: 'string',
              description: 'Phone number in international format'
            },
            provider: {
              type: 'string',
              enum: ['5sim', 'twilio', 'sms-activate', 'mock'],
              description: 'Service provider for the virtual number'
            },
            country: {
              type: 'string',
              description: 'Country code for the number'
            },
            product: {
              type: 'string',
              description: 'Product/service identifier'
            },
            otps: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OTP'
              },
              description: 'List of received OTPs'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the number was created'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the number expires'
            },
            status: {
              type: 'string',
              enum: ['active', 'expired', 'cancelled'],
              description: 'Current status of the virtual number'
            }
          },
          required: ['id', 'number', 'provider', 'country', 'product', 'otps', 'createdAt', 'expiresAt', 'status']
        },
        OTP: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the OTP'
            },
            code: {
              type: 'string',
              description: 'The OTP code'
            },
            receivedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the OTP was received'
            },
            isUsed: {
              type: 'boolean',
              description: 'Whether the OTP has been used'
            },
            source: {
              type: 'string',
              description: 'Source provider of the OTP'
            }
          },
          required: ['id', 'code', 'receivedAt']
        },
        Provider: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Provider identifier'
            },
            name: {
              type: 'string',
              description: 'Provider display name'
            },
            cost: {
              type: 'string',
              description: 'Cost per number'
            },
            description: {
              type: 'string',
              description: 'Provider description'
            }
          },
          required: ['id', 'name', 'cost']
        },
        ProviderStatus: {
          type: 'object',
          properties: {
            available: {
              type: 'boolean',
              description: 'Whether the provider is available'
            },
            reason: {
              type: 'string',
              description: 'Reason if provider is unavailable'
            }
          },
          required: ['available']
        },
        Country: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Country identifier'
            },
            name: {
              type: 'string',
              description: 'Country display name'
            }
          },
          required: ['id', 'name']
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product identifier'
            },
            name: {
              type: 'string',
              description: 'Product display name'
            },
            cost: {
              type: 'number',
              description: 'Cost of the product'
            },
            count: {
              type: 'number',
              description: 'Available count'
            }
          },
          required: ['id', 'name', 'cost', 'count']
        },
        IndianService: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Service identifier (e.g., "amazon", "uber")'
            },
            name: {
              type: 'string',
              description: 'Service display name (e.g., "Amazon", "Uber")'
            },
            category: {
              type: 'string',
              description: 'Business category (e.g., "E-commerce & Shopping")'
            },
            smsActivateId: {
              type: 'string',
              description: 'SMS-Activate service ID for API calls'
            },
            description: {
              type: 'string',
              description: 'Brief description of the service'
            },
            expectedCount: {
              type: 'number',
              description: 'Expected available count based on historical data'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Service priority level'
            },
            realTimeData: {
              $ref: '#/components/schemas/ServiceRealTimeData'
            }
          },
          required: ['id', 'name', 'category', 'smsActivateId', 'description', 'expectedCount', 'priority']
        },
        ServiceRealTimeData: {
          type: 'object',
          properties: {
            cost: {
              type: 'number',
              description: 'Cost in USD'
            },
            count: {
              type: 'number',
              description: 'Real-time available count'
            },
            usdCost: {
              type: 'number',
              description: 'Cost in USD'
            },
            inrCost: {
              type: 'number',
              description: 'Cost converted to Indian Rupees (INR)'
            },
            available: {
              type: 'boolean',
              description: 'Whether the service is currently available'
            }
          },
          required: ['cost', 'count', 'usdCost', 'inrCost', 'available']
        },
        IndianService: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Service identifier (e.g., "amazon", "uber")'
            },
            name: {
              type: 'string',
              description: 'Service display name (e.g., "Amazon", "Uber")'
            },
            category: {
              type: 'string',
              description: 'Business category (e.g., "E-commerce & Shopping")'
            },
            smsActivateId: {
              type: 'string',
              description: 'SMS-Activate service ID for API calls'
            },
            description: {
              type: 'string',
              description: 'Brief description of the service'
            },
            expectedCount: {
              type: 'number',
              description: 'Expected available count based on historical data'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Service priority level'
            },
            realTimeData: {
              $ref: '#/components/schemas/ServiceRealTimeData'
            }
          },
          required: ['id', 'name', 'category', 'smsActivateId', 'description', 'expectedCount', 'priority']
        },
        ServiceRealTimeData: {
          type: 'object',
          properties: {
            cost: {
              type: 'number',
              description: 'Cost in USD'
            },
            count: {
              type: 'number',
              description: 'Real-time available count'
            },
            usdCost: {
              type: 'number',
              description: 'Cost in USD'
            },
            inrCost: {
              type: 'number',
              description: 'Cost converted to Indian Rupees (INR)'
            },
            available: {
              type: 'boolean',
              description: 'Whether the service is currently available'
            }
          },
          required: ['cost', 'count', 'usdCost', 'inrCost', 'available']
        },
        IndianServicesResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                services: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/IndianService'
                  },
                  description: 'List of all Indian services with real-time data'
                },
                categorized: {
                  type: 'object',
                  description: 'Services grouped by category',
                  additionalProperties: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/IndianService'
                    }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'number',
                      description: 'Total number of services'
                    },
                    available: {
                      type: 'number',
                      description: 'Number of currently available services'
                    },
                    unavailable: {
                      type: 'number',
                      description: 'Number of currently unavailable services'
                    },
                    categories: {
                      type: 'number',
                      description: 'Number of business categories'
                    }
                  },
                  required: ['total', 'available', 'unavailable', 'categories']
                }
              },
              required: ['services', 'categorized', 'summary']
            }
          },
          required: ['success', 'data']
        },
        CategoryServicesResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Category name'
                },
                services: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/IndianService'
                  },
                  description: 'Services in this category with real-time data'
                },
                summary: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'number',
                      description: 'Total services in category'
                    },
                    available: {
                      type: 'number',
                      description: 'Available services in category'
                    },
                    unavailable: {
                      type: 'number',
                      description: 'Unavailable services in category'
                    }
                  },
                  required: ['total', 'available', 'unavailable']
                }
              },
              required: ['category', 'services', 'summary']
            }
          },
          required: ['success', 'data']
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            }
          },
          required: ['success', 'error']
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message'
            }
          },
          required: ['success']
        }
      },
      securitySchemes: {
        ServerAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Server-side API key (configured in environment variables)'
        }
      }
    },
    tags: [
      {
        name: 'Virtual Numbers',
        description: 'Operations for managing virtual phone numbers'
      },
      {
        name: 'Indian Services',
        description: 'High-value Indian services with real-time availability and pricing'
      },
      {
        name: 'Providers',
        description: 'Operations for managing service providers'
      },
      {
        name: 'OTPs',
        description: 'Operations for managing OTPs'
      }
    ],
    security: [
      {
        ServerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/types/*.ts']
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs }; 