# Virtual Number Provider Guide

This guide explains all available providers for virtual numbers and how to configure them.

## 🏆 **Provider Comparison**

| Provider | Cost | Indian Numbers | Reliability | Setup Difficulty | Best For |
|----------|------|----------------|-------------|------------------|----------|
| **5SIM** | $0.10-0.50 | ✅ Yes | ⭐⭐⭐⭐ | 🟢 Easy | **Production (Recommended)** |
| **SMS-Activate** | $0.20-0.80 | ✅ Yes | ⭐⭐⭐⭐ | 🟢 Easy | **Production (Alternative)** |
| **Twilio** | $1/month | ✅ Yes | ⭐⭐⭐⭐⭐ | 🟡 Medium | Enterprise/High-volume |
| **Mock** | Free | ✅ Yes | ⭐⭐ | 🟢 Very Easy | Development/Testing |

## 🚀 **Quick Start - Choose Your Provider**

### **Option 1: 5SIM (Lowest Cost)**
- **Cost**: $0.10-0.50 per number
- **Setup**: Add `FIVESIM_API_KEY` to `.env`
- **Website**: [5sim.net](https://5sim.net)

### **Option 2: SMS-Activate (Good Balance)**
- **Cost**: $0.20-0.80 per number  
- **Setup**: Add `SMS_ACTIVATE_API_KEY` to `.env`
- **Website**: [sms-activate.io](https://sms-activate.io)

### **Option 3: Twilio (Highest Reliability)**
- **Cost**: $1.00 per month per number
- **Setup**: Add `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` to `.env`
- **Website**: [twilio.com](https://twilio.com)

## 🔧 **Provider Configuration**

### 1. **5SIM Provider** (Lowest Cost)
```env
FIVESIM_API_KEY=your_api_key_here
```
**Cost**: $0.10-0.50 per number  
**Coverage**: India, US, Europe  
**Activation**: Instant  

### 2. **SMS-Activate Provider** (Good Balance)
```env
SMS_ACTIVATE_API_KEY=your_api_key_here
```
**Cost**: $0.20-0.80 per number  
**Coverage**: India, Russia, US, Europe  
**Activation**: Instant  

### 3. **Twilio Provider** (Highest Reliability)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```
**Cost**: $1.00 per month per number  
**Coverage**: Global  
**Activation**: Instant  

### 4. **Mock Provider** (Development)
```env
# No configuration needed
```
**Cost**: Free  
**Coverage**: Simulated  
**Activation**: Instant  

## 📱 **API Endpoints**

### Get Available Providers
```bash
GET /api/virtual-numbers/providers
```

### Check Provider Status
```bash
GET /api/virtual-numbers/providers/:id/status
```

### Select Provider
```bash
POST /api/virtual-numbers/providers/:id/select
```

### Request Number (uses selected provider)
```bash
POST /api/virtual-numbers
```

## 🎯 **Provider Selection Strategy**

### **Automatic Selection** (Recommended)
The system automatically chooses the best available provider:
1. **5SIM** (if API key configured) - Lowest cost
2. **SMS-Activate** (if API key configured) - Good balance
3. **Twilio** (if credentials configured) - Highest reliability
4. **Mock** (fallback)

### **Manual Selection**
You can manually select a provider:
```bash
# Select 5SIM
curl -X POST http://localhost:5000/api/virtual-numbers/providers/5sim/select

# Select SMS-Activate
curl -X POST http://localhost:5000/api/virtual-numbers/providers/sms-activate/select

# Select Twilio
curl -X POST http://localhost:5000/api/virtual-numbers/providers/twilio/select

# Select Mock
curl -X POST http://localhost:5000/api/virtual-numbers/providers/mock/select
```

## 💰 **Cost Analysis**

### **For 100 Numbers per Month:**

| Provider | Cost per Number | Monthly Total | Annual Total |
|----------|----------------|---------------|--------------|
| **5SIM** | $0.30 | $30 | $360 |
| **SMS-Activate** | $0.50 | $50 | $600 |
| **Twilio** | $1.00 | $100 | $1,200 |
| **Mock** | Free | $0 | $0 |

### **Savings Comparison:**
- **5SIM vs Twilio**: Save **$840/year** (70% savings)
- **SMS-Activate vs Twilio**: Save **$600/year** (50% savings)
- **5SIM vs SMS-Activate**: Save **$240/year** (40% savings)

## 🔍 **Provider Status Check**

Check what's available in your setup:

```bash
# Check all providers
curl http://localhost:5000/api/virtual-numbers/providers

# Check specific provider status
curl http://localhost:5000/api/virtual-numbers/providers/5sim/status
curl http://localhost:5000/api/virtual-numbers/providers/sms-activate/status
curl http://localhost:5000/api/virtual-numbers/providers/twilio/status
```

## 🚨 **Troubleshooting**

### **5SIM Issues:**
- **"Missing API Key"**: Set `FIVESIM_API_KEY` in `.env`
- **"API Error"**: Check your 5SIM account balance
- **"No Indian numbers"**: Check 5SIM availability in your region

### **SMS-Activate Issues:**
- **"Missing API Key"**: Set `SMS_ACTIVATE_API_KEY` in `.env`
- **"API Error"**: Check your SMS-Activate account balance
- **"No Indian numbers"**: Check SMS-Activate availability

### **Twilio Issues:**
- **"Missing credentials"**: Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- **"Geographic restrictions"**: Indian numbers might not be available in your region
- **"Account limitations"**: Check if you have a trial account

### **General Issues:**
- **Provider not working**: Check environment variables
- **Fallback to mock**: This is normal when providers fail
- **Cost concerns**: Use 5SIM for lowest cost, SMS-Activate for balance

## 📚 **Provider-Specific Guides**

### **5SIM Setup:**
1. Visit [5sim.net](https://5sim.net)
2. Create account and verify
3. Get API key from dashboard
4. Add to `.env` file
5. Test with `npm run test:5sim`

### **SMS-Activate Setup:**
1. Visit [sms-activate.io](https://sms-activate.io)
2. Create account and verify
3. Get API key from dashboard
4. Add to `.env` file
5. Test with `npm run test:sms-activate`

### **Twilio Setup:**
1. Visit [twilio.com](https://twilio.com)
2. Create account and verify
3. Get Account SID and Auth Token
4. Add to `.env` file
5. Test with `npm run test:twilio`

## 🎉 **Success Metrics**

### **When Everything Works:**
- ✅ Provider status shows "Available"
- ✅ Numbers are generated instantly
- ✅ OTPs are received in real-time
- ✅ Costs are minimized (5SIM or SMS-Activate)
- ✅ Fallback works when needed

### **Cost Optimization:**
- Use **5SIM** for production (lowest cost)
- Use **SMS-Activate** for production (good balance)
- Use **Twilio** for enterprise needs (highest reliability)
- Use **Mock** for development (free)

## 🔮 **Future Providers**

Coming soon:
- **TextNow** integration
- **Google Voice** support
- **Custom provider** framework

## 📞 **Support**

- **5SIM Support**: [support.5sim.net](https://support.5sim.net)
- **SMS-Activate Support**: [sms-activate.io/support](https://sms-activate.io/support)
- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Project Issues**: Create GitHub issue
- **Provider Questions**: Check provider-specific documentation

---

**Recommendation**: Start with **5SIM** for lowest cost, or **SMS-Activate** for good balance! 🚀 