# 🚀 VirtNum India - Virtual Number OTP Service

A full-stack web application for requesting temporary Indian virtual mobile numbers and receiving OTPs in real-time. Built with React, Node.js, and integrated with multiple SMS providers.

## ✨ Features

- **Multi-Provider Support**: 5SIM, Twilio, SMS-Activate, and Mock provider
- **Real-time OTP Delivery**: WebSocket-based instant OTP notifications
- **Product Selection**: Browse through 700+ virtual number services
- **Smart Search**: Find products quickly with real-time filtering
- **Modern Dark UI**: Beautiful, responsive dark theme interface
- **Indian Numbers**: Specialized for Indian mobile number services
- **Cost Optimization**: Choose from different pricing tiers

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Real-time**: WebSocket communication for OTP updates
- **Providers**: RESTful API integration with SMS services

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- 5SIM API key (for real virtual numbers)
- Twilio account (optional)
- SMS-Activate API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/virtual-number-otp-service.git
   cd virtual-number-otp-service
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   # Backend
   cd backend
   cp env.example .env
   # Edit .env with your API keys
   ```

4. **Start Development**
   ```bash
   # From root directory
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# 5SIM Configuration
FIVESIM_API_KEY=your_5sim_jwt_token_here

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# SMS-Activate Configuration (Optional)
SMS_ACTIVATE_API_KEY=your_sms_activate_api_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### API Keys Setup

1. **5SIM**: Get JWT token from [5sim.net](https://5sim.net)
2. **Twilio**: Sign up at [twilio.com](https://twilio.com)
3. **SMS-Activate**: Register at [sms-activate.io](https://sms-activate.io)

## 📱 Usage

### 1. Select Provider
Choose from available SMS providers in the top row

### 2. Browse Products
- Scroll through 700+ virtual number services
- Use search to find specific products quickly
- View pricing and availability

### 3. Select Product
Click on any product to see available operators

### 4. Choose Operator
Select telecom operator (Jio, Airtel, MTNL, etc.)

### 5. Get Number
Click "Get Number" to request a virtual number

### 6. Receive OTPs
OTPs appear in real-time as they arrive

## 🛠️ Development

### Project Structure

```
virtualno/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── backend/           # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── package.json       # Root package.json
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Build
npm run build            # Build both frontend and backend
npm run build:frontend   # Build only frontend
npm run build:backend    # Build only backend

# Port Management
npm run kill-5000        # Kill backend port
npm run kill-3000        # Kill frontend port
npm run kill-ports       # Kill both ports
```

### Testing APIs

```bash
# Test 5SIM integration
cd backend
node test-5sim.js

# Test SMS-Activate integration
node test-sms-activate.js

# Test Twilio availability
node test-twilio-availability.js
```

## 🌟 Features in Detail

### Provider Management
- **5SIM**: Primary provider for Indian numbers ($0.10-0.50)
- **Twilio**: Enterprise-grade SMS service ($1/month per number)
- **SMS-Activate**: Alternative provider ($0.20-0.80)
- **Mock Provider**: Development and testing (free)

### Product Categories
- **Gaming**: Gaming platform OTPs
- **Banking**: Financial services verification
- **E-commerce**: Shopping platform OTPs
- **Social Media**: Social platform verification
- **Travel**: Booking service OTPs
- **Healthcare**: Medical service verification

### Real-time Features
- **WebSocket Connection**: Live OTP delivery
- **Connection Status**: Real-time connection monitoring
- **Auto-refresh**: Automatic data updates
- **Error Handling**: Comprehensive error management

## 🔒 Security Features

- **Environment Variables**: Secure API key storage
- **Input Validation**: Server-side request validation
- **Error Sanitization**: Safe error message display
- **Rate Limiting**: Built-in request throttling

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd backend
npm run build
# Deploy dist/ folder
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/virtual-number-otp-service/issues)
- **Documentation**: Check the [PROVIDER_GUIDE.md](backend/PROVIDER_GUIDE.md)
- **Twilio Setup**: See [TWILIO_SETUP.md](backend/TWILIO_SETUP.md)

## 🙏 Acknowledgments

- **5SIM**: For affordable virtual number services
- **Twilio**: For enterprise SMS capabilities
- **SMS-Activate**: For alternative provider options
- **React Team**: For the amazing frontend framework
- **Node.js Community**: For the robust backend runtime

---

**Made with ❤️ for the Indian developer community** 