import { io, Socket } from 'socket.io-client';
import { OTP } from '../types';

/**
 * WebSocket Service for Real-time Updates
 * 
 * Handles WebSocket connections for live OTP updates and number status changes
 */
export class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Join a room for a specific virtual number
   */
  joinNumber(number: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinNumber', number);
    }
  }

  /**
   * Leave a room for a specific virtual number
   */
  leaveNumber(number: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveNumber', number);
    }
  }

  /**
   * Listen for OTP updates
   */
  onOTPUpdate(callback: (data: { number: string; otps: OTP[] }) => void): void {
    if (this.socket) {
      this.socket.on('otpUpdate', callback);
    }
  }

  /**
   * Listen for number expiration
   */
  onNumberExpired(callback: (data: { number: string }) => void): void {
    if (this.socket) {
      this.socket.on('numberExpired', callback);
    }
  }

  /**
   * Remove OTP update listener
   */
  offOTPUpdate(): void {
    if (this.socket) {
      this.socket.off('otpUpdate');
    }
  }

  /**
   * Remove number expired listener
   */
  offNumberExpired(): void {
    if (this.socket) {
      this.socket.off('numberExpired');
    }
  }

  /**
   * Check if connected
   */
  getConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const socketService = new SocketService(); 