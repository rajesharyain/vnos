export interface OTP {
  id: string;
  code: string;
  receivedAt: Date;
  isUsed?: boolean;
  source?: string; // Add source property for tracking where OTP came from
}

export interface VirtualNumber {
  id: string;
  number: string;
  provider: string;
  country: string;
  product: string;
  otps: OTP[];
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'cancelled';
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
  requestNumber(productId?: string, countryId?: string, operatorId?: string): Promise<string>;
  checkOtps(phoneNumber: string): Promise<OTP[]>;
  cancelNumber(phoneNumber: string): Promise<boolean>;
  resendOtp(phoneNumber: string): Promise<boolean>;
  getAvailableProducts(countryId: string): Promise<Array<{ id: string; name: string; cost: number; count: number }>>;
} 