# 🚀 Swagger API Documentation

## Overview

Your Virtual Number OTP Service now includes **complete Swagger/OpenAPI documentation**! This allows you to:

- **Test all API endpoints** directly from the browser
- **See request/response schemas** with examples
- **Try different parameters** without writing code
- **Understand the API structure** visually
- **Debug API calls** easily

## 🎯 Quick Start

### 1. Start the Server
```bash
cd backend
npm run dev
```

### 2. Open Swagger UI
Navigate to: **http://localhost:5000/api-docs**

### 3. Start Testing!
Use the "Try it out" button on any endpoint to test it live.

## 📚 Available Endpoints

### Virtual Numbers
- **POST** `/api/virtual-numbers` - Request a new virtual number
- **GET** `/api/virtual-numbers` - Get all active virtual numbers
- **GET** `/api/virtual-numbers/{number}` - Get specific virtual number
- **DELETE** `/api/virtual-numbers/{number}` - Cancel a virtual number

### OTPs
- **GET** `/api/virtual-numbers/{number}/otps` - Get OTPs for a number
- **POST** `/api/virtual-numbers/{number}/resend` - Resend OTP

### Providers
- **GET** `/api/virtual-numbers/providers` - Get available providers
- **GET** `/api/virtual-numbers/providers/{id}/status` - Get provider status
- **POST** `/api/virtual-numbers/providers/{id}/select` - Select a provider
- **GET** `/api/virtual-numbers/providers/selected` - Get selected provider

### Countries & Products
- **GET** `/api/virtual-numbers/providers/{id}/countries` - Get provider countries
- **GET** `/api/virtual-numbers/providers/{id}/countries/{countryId}/products` - Get products
- **GET** `/api/virtual-numbers/providers/{id}/countries/{countryId}/details` - Get country details

## 🧪 Testing Examples

### Example 1: Request a Virtual Number
1. Go to **POST** `/api/virtual-numbers`
2. Click **"Try it out"**
3. Enter request body:
```json
{
  "product": "jiomart",
  "country": "india"
}
```
4. Click **"Execute"**
5. See the response with the virtual number details

### Example 2: Check Provider Status
1. Go to **GET** `/api/virtual-numbers/providers/{id}/status`
2. Click **"Try it out"**
3. Enter `id`: `5sim`
4. Click **"Execute"**
5. See if 5SIM is available and any error reasons

### Example 3: Get Available Products
1. Go to **GET** `/api/virtual-numbers/providers/{id}/countries/{countryId}/products`
2. Click **"Try it out"**
3. Enter `id`: `5sim`, `countryId`: `india`
4. Click **"Execute"**
5. See all available products for India

## 🔧 Testing Your 5SIM Integration

### Step 1: Check Provider Status
```bash
# Test if 5SIM is configured correctly
GET /api/virtual-numbers/providers/5sim/status
```

### Step 2: Check Available Products
```bash
# See what products are available for India
GET /api/virtual-numbers/providers/5sim/countries/india/products
```

### Step 3: Request a Number
```bash
# Request a number for Jio Mart
POST /api/virtual-numbers
{
  "product": "jiomart",
  "country": "india"
}
```

### Step 4: Check for OTPs
```bash
# Poll for OTPs (replace with actual number)
GET /api/virtual-numbers/+91XXXXXXXXXX/otps
```

### Step 5: Cancel if No OTP
```bash
# Cancel the number if no OTP received
DELETE /api/virtual-numbers/+91XXXXXXXXXX
```

## 🎨 Swagger UI Features

### Interactive Testing
- **Try it out**: Test any endpoint with real parameters
- **Request Builder**: Easy parameter input
- **Response Viewer**: See actual API responses
- **Error Handling**: View detailed error messages

### Schema Documentation
- **Request Models**: See exactly what to send
- **Response Models**: Understand what you'll receive
- **Examples**: Real-world usage examples
- **Validation**: Automatic parameter validation

### Developer Experience
- **Copy as cURL**: Get cURL commands for testing
- **Copy as JavaScript**: Get fetch/axios code
- **Download Spec**: Export OpenAPI specification
- **Search & Filter**: Find endpoints quickly

## 🚨 Common Testing Scenarios

### 1. Testing 5SIM Configuration
```bash
# Check if 5SIM is working
GET /api/virtual-numbers/providers/5sim/status

# Expected response if working:
{
  "success": true,
  "data": {
    "available": true
  }
}

# Expected response if not working:
{
  "success": true,
  "data": {
    "available": false,
    "reason": "Invalid API key or insufficient balance"
  }
}
```

### 2. Testing Number Request
```bash
# Request a number
POST /api/virtual-numbers
{
  "product": "jiomart",
  "country": "india"
}

# Expected success response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "number": "+91XXXXXXXXXX",
    "provider": "5sim",
    "country": "india",
    "product": "jiomart",
    "status": "active"
  }
}
```

### 3. Testing Error Handling
```bash
# Try with invalid product
POST /api/virtual-numbers
{
  "product": "invalid_product",
  "country": "india"
}

# Expected error response:
{
  "success": false,
  "error": "Product invalid_product is not available for country india"
}
```

## 🔍 Debugging with Swagger

### 1. Check Request Details
- **URL**: Verify the endpoint is correct
- **Parameters**: Check path and query parameters
- **Headers**: Ensure proper Content-Type
- **Body**: Validate JSON format

### 2. Analyze Response
- **Status Code**: 200 = success, 4xx = client error, 5xx = server error
- **Response Body**: Check for error messages
- **Headers**: Look for additional information
- **Timing**: See how long the request took

### 3. Common Issues
- **CORS**: Ensure frontend can access backend
- **Validation**: Check required fields are present
- **Authentication**: Verify API keys are set
- **Network**: Confirm server is running

## 📖 Additional Resources

### API Health Check
- **GET** `/health` - Check if server is running
- **GET** `/` - Get API information and links

### WebSocket Testing
- **Connection**: `ws://localhost:5000`
- **Events**: `otpUpdate`, `numberStatus`, `error`

### Environment Variables
```bash
FIVESIM_API_KEY=your_jwt_token_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
SMS_ACTIVATE_API_KEY=your_sms_activate_key
```

## 🎯 Next Steps

1. **Test all endpoints** using Swagger UI
2. **Verify 5SIM integration** works correctly
3. **Test error scenarios** with invalid inputs
4. **Monitor logs** for debugging information
5. **Use the API** in your frontend application

## 🆘 Need Help?

- **Check server logs** for detailed error messages
- **Verify environment variables** are set correctly
- **Test with Swagger UI** to isolate issues
- **Check 5SIM account** balance and API key validity

Happy testing! 🚀 