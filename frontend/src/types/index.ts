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

export interface Provider {
  id: string;
  name: string;
  cost: string;
  features: string[];
}

export interface ProviderStatus {
  available: boolean;
  reason?: string;
}

export interface Country {
  id: string;
  name: string;
  products: string[];
  iso?: any;
  prefix?: any;
}

export interface Product {
  id: string;
  name: string;
  cost: number;
  count: number;
}

export interface CountryDetails {
  id: string;
  name: string;
  products: any;
  iso: any;
  prefix: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateVirtualNumberResponse extends ApiResponse<VirtualNumber> {}
export interface GetOTPsResponse extends ApiResponse<OTP[]> {}
export interface CancelNumberResponse extends ApiResponse<void> {}
export interface ResendOTPResponse extends ApiResponse<void> {}

export interface ProvidersResponse extends ApiResponse<Provider[]> {}
export interface ProviderStatusResponse extends ApiResponse<ProviderStatus> {}
export interface SelectProviderResponse extends ApiResponse<{ providerId: string; providerName: string }> {}

export interface CountriesResponse extends ApiResponse<Country[]> {}
export interface ProductsResponse extends ApiResponse<Product[]> {}
export interface CountryDetailsResponse extends ApiResponse<CountryDetails> {} 