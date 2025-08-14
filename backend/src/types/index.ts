export interface VirtualNumber {
  id: string;
  number: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  otps: OTP[];
}

export interface OTP {
  id: string;
  code: string;
  receivedAt: Date;
  isUsed: boolean;
}

export interface CreateVirtualNumberResponse {
  success: boolean;
  data?: VirtualNumber;
  error?: string;
}

export interface GetOTPsResponse {
  success: boolean;
  data?: OTP[];
  error?: string;
}

export interface CancelNumberResponse {
  success: boolean;
  error?: string;
}

export interface ResendOTPResponse {
  success: boolean;
  error?: string;
}

// Mock API provider interface - replace with real provider later
export interface VirtualNumberProvider {
  requestNumber(): Promise<string>;
  checkForOTP(number: string): Promise<OTP[]>;
  cancelNumber(number: string): Promise<boolean>;
  resendOTP(number: string): Promise<boolean>;
} 