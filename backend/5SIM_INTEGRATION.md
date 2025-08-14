# 5SIM Integration Guide

## Overview

This document describes the complete integration of 5SIM.net virtual number service for Indian mobile numbers. The integration supports:

- **Product-based number requests** (Jio Mart, Zomato, Swiggy, etc.)
- **Automatic OTP polling** every 5 seconds
- **3-minute auto-cancellation** if no OTP received
- **Automatic refund** processing by 5SIM
- **Real-time OTP updates** via WebSocket

## API Endpoints

### 1. Request Virtual Number
```
POST /api/virtual-numbers
Content-Type: application/json

{
  "product": "jiomart",
  "country": "india"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "number": "+91XXXXXXXXXX",
    "provider": "5sim",
    "country": "india",
    "product": "jiomart",
    "otps": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-01T00:01:00.000Z",
    "status": "active"
  }
}
```

### 2. Check OTPs
```
GET /api/virtual-numbers/:number/otps
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "otp_uuid",
      "code": "123456",
      "receivedAt": "2024-01-01T00:00:30.000Z",
      "source": "5SIM"
    }
  ]
}
```

### 3. Cancel Number
```
DELETE /api/virtual-numbers/:number
```

**Response:**
```json
{
  "success": true,
  "message": "Number cancelled successfully"
}
```

### 4. Resend OTP
```
POST /api/virtual-numbers/:number/resend
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

## 5SIM API Integration

### Authentication
All authenticated requests use JWT token in Authorization header:
```
Authorization: Bearer YOUR_5SIM_API_KEY
```

### Key API Endpoints

1. **Get Countries**: `GET /guest/countries`
2. **Get Products**: `GET /guest/prices?country=india`
3. **Buy Number**: `GET /buy/activation/india/{product}/any`
4. **Check Status**: `GET /user/check/{activation_id}`
5. **Get SMS**: `GET /user/check/{activation_id}/sms`
6. **Cancel**: `GET /user/cancel/{activation_id}`
7. **Resend**: `GET /user/repeat/{activation_id}`

## Product Mapping

The system maps frontend product IDs to 5SIM service IDs:

| Frontend ID | 5SIM Service | Description |
|-------------|---------------|-------------|
| `jiomart` | `virtual21` | Jio Mart OTP |
| `zomato` | `virtual4` | Zomato OTP |
| `swiggy` | `virtual58` | Swiggy OTP |
| `paytm` | `virtual21` | Paytm OTP |
| `phonepe` | `virtual4` | PhonePe OTP |
| `amazon` | `virtual58` | Amazon OTP |

## OTP Polling Flow

1. **Number Request**: User selects product and operator
2. **5SIM Purchase**: System buys number from 5SIM
3. **Start Polling**: Begin 5-second interval polling
4. **OTP Check**: Check for SMS/OTP every 5 seconds
5. **Auto-Cancel**: If no OTP in 3 minutes, auto-cancel
6. **Refund**: 5SIM automatically processes refund

## Error Handling

### Common Error Codes

- **403 Forbidden**: Invalid API key or insufficient balance
- **401 Unauthorized**: Invalid JWT token
- **400 Bad Request**: Service/country not available
- **404 Not Found**: Number not found

### Error Response Format
```json
{
  "success": false,
  "error": "5SIM API error: 403 Forbidden. Check your API key and balance."
}
```

## Testing

### Run Integration Test
```bash
cd backend
node test-5sim-integration.js
```

### Test Flow
1. ✅ Check account balance
2. ✅ Verify India availability
3. ✅ List available products
4. ✅ Request virtual number
5. ✅ Poll for OTPs (3-minute timeout)
6. ✅ Auto-cancel if no OTP
7. ✅ Verify refund processing

## Configuration

### Environment Variables
```bash
FIVESIM_API_KEY=your_jwt_token_here
```

### 5SIM Account Setup
1. Register at [5sim.net](https://5sim.net)
2. Add funds to account (minimum $0.10)
3. Generate API key (JWT token)
4. Set `FIVESIM_API_KEY` in `.env`

## Security Features

- **JWT Authentication**: Secure API key handling
- **Auto-cancellation**: Prevents unnecessary charges
- **Refund Protection**: Automatic refund if no OTP
- **Rate Limiting**: 5-second polling intervals
- **Error Logging**: Comprehensive error tracking

## Monitoring

### Log Messages
- `[5SIM] Requesting virtual number for product: jiomart, country: india`
- `[5SIM] Successfully purchased number: +91XXXXXXXXXX`
- `[5SIM] Auto-cancellation set for 3 minutes if no SMS received`
- `[5SIM] OTPs extracted: 123456`
- `[5SIM] Auto-canceling number +91XXXXXXXXXX after 3 minutes`

### WebSocket Events
- `otpUpdate`: Real-time OTP delivery
- `numberStatus`: Number status changes
- `error`: Error notifications

## Troubleshooting

### Common Issues

1. **403 Forbidden**
   - Check API key validity
   - Verify account balance
   - Ensure JWT token format

2. **No Products Available**
   - Check country availability
   - Verify service status
   - Contact 5SIM support

3. **OTP Not Received**
   - Wait for 3-minute timeout
   - Check SMS delivery status
   - Verify product compatibility

### Debug Commands
```bash
# Check 5SIM balance
curl -H "Authorization: Bearer YOUR_KEY" https://5sim.net/v1/user/profile

# List available countries
curl https://5sim.net/v1/guest/countries

# Check product prices
curl "https://5sim.net/v1/guest/prices?country=india"
```

## Support

For 5SIM-specific issues:
- [5SIM Documentation](https://5sim.net/docs)
- [5SIM Support](https://5sim.net/support)
- [API Status](https://5sim.net/status)

For integration issues:
- Check backend logs
- Run integration test script
- Verify environment configuration 