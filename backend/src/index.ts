import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import virtualNumberRoutes from './routes/virtualNumbers';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

// API Routes
app.use('/api/virtual-numbers', virtualNumberRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Twilio webhook endpoint for incoming SMS
app.post('/webhook/sms', (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body;
    
    console.log(`[Webhook] Received SMS from ${From}: ${Body}`);
    
    // Emit WebSocket event for real-time OTP updates
    io.emit('newSMS', {
      from: From,
      body: Body,
      messageId: MessageSid,
      timestamp: new Date().toISOString()
    });
    
    // Send TwiML response
    res.type('text/xml');
    res.send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>Message received successfully</Message>
      </Response>
    `);
  } catch (error) {
    console.error('[Webhook] Error processing SMS:', error);
    res.status(500).send('Error processing SMS');
  }
});

// Twilio webhook endpoint for delivery status
app.post('/webhook/status', (req, res) => {
  try {
    const { MessageSid, MessageStatus } = req.body;
    console.log(`[Webhook] Message ${MessageSid} status: ${MessageStatus}`);
    
    // Emit WebSocket event for delivery status updates
    io.emit('messageStatus', {
      messageId: MessageSid,
      status: MessageStatus,
      timestamp: new Date().toISOString()
    });
    
    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Error processing status:', error);
    res.status(500).send('Error processing status');
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join a room for a specific virtual number
  socket.on('joinNumber', (number: string) => {
    socket.join(`number-${number}`);
    console.log(`Client ${socket.id} joined room for number: ${number}`);
  });

  // Leave a room for a specific virtual number
  socket.on('leaveNumber', (number: string) => {
    socket.leave(`number-${number}`);
    console.log(`Client ${socket.id} left room for number: ${number}`);
  });
});

// Make io available globally for services
declare global {
  var io: Server;
}
global.io = io;

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
  console.log(`📱 Twilio webhooks available at http://localhost:${PORT}/webhook`);
  
  // Check if Twilio is configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log(`✅ Twilio integration enabled`);
  } else {
    console.log(`⚠️  Twilio not configured - using mock provider`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 