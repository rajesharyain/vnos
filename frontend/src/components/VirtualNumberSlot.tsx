import React, { useState, useEffect } from 'react';
import { VirtualNumber, OTP } from '../types';
import { ApiService } from '../services/api';
import { socketService } from '../services/socket';
import { Phone, Clock, X, RefreshCw, Copy, Check } from 'lucide-react';

interface VirtualNumberSlotProps {
  virtualNumber: VirtualNumber;
  onUpdate: (updatedNumber: VirtualNumber) => void;
  onRemove: (number: string) => void;
}

export const VirtualNumberSlot: React.FC<VirtualNumberSlotProps> = ({
  virtualNumber,
  onUpdate,
  onRemove,
}) => {
  const [otps, setOtps] = useState<OTP[]>(virtualNumber.otps);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedOTP, setCopiedOTP] = useState<string | null>(null);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(virtualNumber.expiresAt).getTime();
      const remaining = Math.max(0, expiresAt - now);
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [virtualNumber.expiresAt]);

  // Handle expiration
  useEffect(() => {
    if (timeLeft === 0 && virtualNumber.isActive) {
      onRemove(virtualNumber.number);
    }
  }, [timeLeft, virtualNumber.isActive, virtualNumber.number, onRemove]);

  // WebSocket listeners
  useEffect(() => {
    socketService.joinNumber(virtualNumber.number);

    const handleOTPUpdate = (data: { number: string; otps: OTP[] }) => {
      if (data.number === virtualNumber.number) {
        setOtps(prev => [...prev, ...data.otps]);
        onUpdate({
          ...virtualNumber,
          otps: [...otps, ...data.otps]
        });
      }
    };

    const handleNumberExpired = (data: { number: string }) => {
      if (data.number === virtualNumber.number) {
        onRemove(virtualNumber.number);
      }
    };

    socketService.onOTPUpdate(handleOTPUpdate);
    socketService.onNumberExpired(handleNumberExpired);

    return () => {
      socketService.leaveNumber(virtualNumber.number);
      socketService.offOTPUpdate();
      socketService.offNumberExpired();
    };
  }, [virtualNumber.number, virtualNumber, otps, onUpdate, onRemove]);

  // Format time display
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle cancel number
  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await ApiService.cancelNumber(virtualNumber.number);
      onRemove(virtualNumber.number);
    } catch (error) {
      console.error('Failed to cancel number:', error);
      alert('Failed to cancel number');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await ApiService.resendOTP(virtualNumber.number);
      alert('OTP resent successfully');
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      alert('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copy OTP
  const handleCopyOTP = async (otp: string) => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopiedOTP(otp);
      setTimeout(() => setCopiedOTP(null), 2000);
    } catch (error) {
      console.error('Failed to copy OTP:', error);
    }
  };

  // Get status color based on time remaining
  const getStatusColor = () => {
    if (timeLeft === 0) return 'text-red-600';
    if (timeLeft < 10000) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Phone className="w-5 h-5 text-primary-600" />
          <span className="font-mono text-lg font-semibold">{virtualNumber.number}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className={`w-4 h-4 ${getStatusColor()}`} />
          <span className={`font-mono text-sm ${getStatusColor()}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* OTP Display */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Received OTPs:</h4>
        {otps.length === 0 ? (
          <div className="text-gray-500 text-sm italic">
            No OTPs received yet...
          </div>
        ) : (
          <div className="space-y-2">
            {otps.map((otp) => (
              <div key={otp.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-lg font-bold text-primary-600">
                    {otp.code}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(otp.receivedAt).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyOTP(otp.code)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy OTP"
                >
                  {copiedOTP === otp.code ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleResendOTP}
          disabled={isLoading || !virtualNumber.isActive}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Resend OTP</span>
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading || !virtualNumber.isActive}
          className="btn-danger flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}; 