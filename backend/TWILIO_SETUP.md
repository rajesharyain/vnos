# Twilio Integration Setup Guide

This guide will help you set up Twilio integration for dynamically purchasing and managing virtual numbers.

## Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **Account SID and Auth Token**: Available in your Twilio Console
3. **Sufficient Balance**: You need funds to purchase phone numbers (~$1/month per number)
4. **Account Verification**: Your account should be verified and active

## Step 1: Get Twilio Credentials

1. Log into your [Twilio Console](https://console.twilio.com/)
2. Copy your **Account SID** from the dashboard
3. Copy your **Auth Token** (or generate a new one)
4. Ensure your account has sufficient balance for number purchases

## Step 2: Configure Environment Variables

1. Copy the `env.example` file to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file with your Twilio credentials:
   ```env
   
   ```

## Step 3: Test the Integration

1. Test your Twilio configuration:
   ```bash
   npm run test:twilio
   ```

2. You should see:
   ```
   ✅ Found X available Indian numbers
   ✅ Number purchasing test passed
   ```

## Step 4: Start the Application

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. You should see:
   ```
   ✅ Twilio integration enabled
   📱 Twilio webhooks available at http://localhost:5000/webhook
   ```

## How It Works

### Dynamic Number Generation

1. **Number Request**: When a user requests a virtual number
2. **API Search**: System searches Twilio for available Indian numbers
3. **Number Purchase**: Automatically purchases the number through Twilio API
4. **Webhook Setup**: Configures SMS webhooks for the new number
5. **Number Return**: Returns the purchased number to the user

### OTP Reception

1. **SMS Arrival**: When SMS arrives at the Twilio number
2. **Webhook Trigger**: Twilio sends webhook to your backend
3. **OTP Extraction**: System parses SMS content for OTP codes
4. **Real-time Delivery**: OTPs sent to frontend via WebSocket

### Number Management

1. **Automatic Expiry**: Numbers expire after 60 seconds
2. **Number Release**: Expired numbers are automatically released back to Twilio
3. **Cost Control**: Only pay for numbers while they're active

## Production Deployment

For production, you'll need:

1. **Public HTTPS URL**: Twilio requires HTTPS for webhooks
2. **Domain**: Use a real domain instead of localhost
3. **Environment Variables**: Set in your production environment

### Example Production Environment:
```env
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_production_auth_token
WEBHOOK_BASE_URL=https://yourdomain.com
NODE_ENV=production
```

## Cost Considerations

- **Phone Number Purchase**: ~$1/month per number
- **SMS Reception**: Free (incoming SMS)
- **SMS Sending**: ~$0.0075 per SMS (US numbers)
- **International Numbers**: Varies by country
- **Webhook Calls**: Free

## Troubleshooting

### Common Issues:

1. **"No available Indian phone numbers"**: 
   - Check if numbers are available in your region
   - Verify account permissions
   - Check account balance

2. **"Insufficient permissions"**: 
   - Contact Twilio support
   - Verify account verification status

3. **"Account not found"**: 
   - Double-check Account SID and Auth Token
   - Ensure account is active

4. **Webhook errors**: 
   - Ensure webhook URLs are accessible
   - Check HTTPS requirement for production

### Debug Mode:

Enable debug logging:
```env
NODE_ENV=development
DEBUG=twilio:*
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use environment variables** in production
3. **Validate webhook signatures** in production (optional)
4. **Rate limiting** for API endpoints
5. **HTTPS only** for production webhooks

## Alternative Approaches

If dynamic number purchasing doesn't meet your needs:

1. **Pre-purchase Numbers**: Buy numbers in advance and manage them manually
2. **Number Pooling**: Maintain a pool of numbers and assign them as needed
3. **Hybrid Approach**: Use dynamic purchasing for peak demand, pre-purchased for base load

## Support

- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Documentation**: [twilio.com/docs](https://www.twilio.com/docs)
- **Community**: [twilio.com/community](https://www.twilio.com/community)
- **Phone Number Availability**: Check [twilio.com/phone-numbers](https://www.twilio.com/phone-numbers) 