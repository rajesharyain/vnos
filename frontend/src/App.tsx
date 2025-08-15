import React, { useState, useEffect } from 'react';
import { VirtualNumber } from './types';
import { ApiService } from './services/api';
import { socketService } from './services/socket';
import { VirtualNumberSlot } from './components/VirtualNumberSlot';
import { ProviderSelector } from './components/ProviderSelector';
import { Phone, Plus, Wifi, WifiOff, AlertCircle, CheckCircle, Copy, Clock, MessageCircle } from 'lucide-react';
import productsData from './data/products.json';

function App() {
  const [virtualNumbers, setVirtualNumbers] = useState<VirtualNumber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('5sim'); // Default to 5SIM for testing
  const [providerError, setProviderError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>('uber'); // Changed from facebook to uber since it's available for USA
  const [selectedCountry, setSelectedCountry] = useState<string>('usa'); // Reverted back to 'usa' as per user feedback
  const [apiProducts, setApiProducts] = useState<Array<{ id: string; name: string; cost: number; count: number }>>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false); // Changed to false since we use hardcoded products
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string | null>('any'); // Default to 'any' operator
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [productPrices, setProductPrices] = useState<Map<string, { usdCost: number; inrCost: number; count: number }>>(new Map());

  // Get operators for a specific product (simplified for testing)
  const getProductOperators = (productId: string) => {
    // For USA testing, return common operators
    if (productId === 'facebook' || productId === 'google') {
      return [
        { id: 'any', name: 'Any Operator', description: 'Any available operator', price: '$1.50', selected: false },
        { id: 'verizon', name: 'Verizon', description: 'Verizon Wireless', price: '$2.00', selected: false },
        { id: 'att', name: 'AT&T', description: 'AT&T Mobility', price: '$1.80', selected: false },
        { id: 'tmobile', name: 'T-Mobile', description: 'T-Mobile US', price: '$1.60', selected: false },
        { id: 'sprint', name: 'Sprint', description: 'Sprint Corporation', price: '$1.40', selected: false }
      ];
    }
    
    // For Indian products, return Indian operators
    return [
      { id: 'any', name: 'Any Operator', description: 'Any available operator', price: '₹2', selected: false },
      { id: 'airtel', name: 'Airtel', description: 'Bharti Airtel', price: '₹3', selected: false },
      { id: 'jio', name: 'Jio', description: 'Reliance Jio', price: '₹2', selected: false },
      { id: 'vodafone', name: 'Vodafone', description: 'Vodafone Idea', price: '₹2', selected: false },
      { id: 'bsnl', name: 'BSNL', description: 'Bharat Sanchar Nigam', price: '₹1', selected: false }
    ];
  };

  // Handle country change
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedOperator('any'); // Reset operator to 'any' when country changes
    
    // Update operators based on new country
    if (selectedProduct) {
      const newOperators = getProductOperators(selectedProduct);
      setOperators(newOperators);
    }
    
    console.log(`Country changed to: ${country}`);
  };

  // Convert USD to INR (approximate rate: 1 USD = 83 INR)
  const convertToINR = (usdPrice: string): string => {
    // Extract the numeric value from price strings like "$0.70" or "₹6"
    const numericValue = parseFloat(usdPrice.replace(/[^\d.]/g, ''));
    
    if (usdPrice.includes('$')) {
      // Convert USD to INR (1 USD ≈ 83 INR)
      const inrValue = Math.round(numericValue * 83);
      return `₹${inrValue}`;
    } else if (usdPrice.includes('₹')) {
      // Already in INR, return as is
      return usdPrice;
    } else {
      // Default case, assume USD
      const inrValue = Math.round(numericValue * 83);
      return `₹${inrValue}`;
    }
  };

  // Get products based on selected country with real-time pricing
  const getProductsForCountry = (country: string) => {
    if (country === 'usa') {
      return [
        { id: 'uber', name: 'Uber', description: 'Ride-hailing OTP', icon: '🚗' },
        { id: 'facebook', name: 'Facebook', description: 'Social media platform OTP', icon: '📘' },
        { id: 'google', name: 'Google', description: 'Google services OTP', icon: '🔍' },
        { id: 'twitter', name: 'Twitter', description: 'Social media OTP', icon: '🐦' },
        { id: 'whatsapp', name: 'WhatsApp', description: 'Messaging OTP', icon: '💬' }
      ];
    } else {
      // India products - based on actual 5SIM availability
      return [
        { id: 'zomato', name: 'Zomato', description: 'Food delivery OTP', icon: '🍕' },
        { id: 'uber', name: 'Uber', description: 'Ride-hailing OTP', icon: '🚗' },
        { id: 'ola', name: 'Ola', description: 'Ride-hailing OTP', icon: '🚙' },
        { id: 'paytm', name: 'Paytm', description: 'Digital payments OTP', icon: '💳' },
        { id: 'phonepe', name: 'PhonePe', description: 'Digital payments OTP', icon: '📱' },
        { id: 'amazon', name: 'Amazon', description: 'E-commerce OTP', icon: '📦' },
        { id: 'flipkart', name: 'Flipkart', description: 'E-commerce OTP', icon: '🛒' },
        { id: 'swiggy', name: 'Swiggy', description: 'Food delivery OTP', icon: '🛵' }
      ];
    }
  };

  // Get current products for selected country
  const productsData = getProductsForCountry(selectedCountry);

  // Filter products based on search query
  const filteredProducts = productsData.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [operators, setOperators] = useState(() => getProductOperators('uber')); // Default to uber operators since it's available

  // Fetch real-time prices for products
  const fetchProductPrices = async (products: Array<{ id: string; name: string; description: string; icon: string }>) => {
    const newPrices = new Map<string, { usdCost: number; inrCost: number; count: number }>();
    
    for (const product of products) {
      try {
        const priceData = await ApiService.getProductPrice(product.id, selectedCountry);
        newPrices.set(product.id, priceData);
      } catch (error) {
        console.log(`Failed to get price for ${product.id}:`, error);
        // Set default price if API fails
        newPrices.set(product.id, { usdCost: 5, inrCost: 415, count: 1 });
      }
    }
    
    setProductPrices(newPrices);
  };

  // Update products and operators when country changes
  useEffect(() => {
    const newProducts = getProductsForCountry(selectedCountry);
    setApiProducts(newProducts.map(product => ({
      id: product.id,
      name: product.name,
      cost: 5, // Default cost, will be updated with real prices
      count: 1
    })));
    
    // Fetch real-time prices for new products
    fetchProductPrices(newProducts);
    
    // Update operators based on first product
    if (newProducts.length > 0) {
      const newOperators = getProductOperators(newProducts[0].id);
      setOperators(newOperators);
      setSelectedProduct(newProducts[0].id);
    }
    
    // Set loading to false since products are now loaded
    setIsLoadingProducts(false);
  }, [selectedCountry]);

  const handleOperatorSelect = (operatorId: string) => {
    setSelectedOperator(operatorId);
    setOperators(prev => prev.map(op => ({ ...op, selected: op.id === operatorId })));
  };

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('State updated:', {
      selectedProduct,
      operators: operators.map(op => ({ id: op.id, price: op.price })),
      selectedOperator
    });
  }, [selectedProduct, operators, selectedOperator]);

  // Initialize WebSocket connection
  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.getConnected());

    const checkConnection = setInterval(() => {
      setIsConnected(socketService.getConnected());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      socketService.disconnect();
    };
  }, []);

  // Load existing virtual numbers on mount
  useEffect(() => {
    loadVirtualNumbers();
  }, []);

  // Load selected provider on mount
  useEffect(() => {
    loadSelectedProvider();
  }, []);

  const loadSelectedProvider = async () => {
    try {
      const selectedProviderData = await ApiService.getSelectedProvider();
      if (selectedProviderData) {
        setSelectedProvider(selectedProviderData);
        console.log(`Loaded selected provider: ${selectedProviderData}`);
      } else {
        // If no provider is selected, default to 5SIM for India
        console.log('No provider selected, defaulting to 5SIM');
        setSelectedProvider('5sim');
      }
    } catch (error) {
      console.error('Failed to load selected provider:', error);
      // Default to 5SIM for India on error
      setSelectedProvider('5sim');
    }
  };

  const loadVirtualNumbers = async () => {
    try {
      const numbers = await ApiService.getActiveNumbers();
      setVirtualNumbers(numbers);
    } catch (error) {
      console.error('Failed to load virtual numbers:', error);
    }
  };

  const handleProviderChange = async (providerId: string) => {
    try {
      setProviderError(null);
      console.log(`Switching to provider: ${providerId}`);
      
      // Select the provider on the backend
      await ApiService.selectProvider(providerId);
      setSelectedProvider(providerId);
      
      console.log(`Successfully switched to provider: ${providerId}`);
    } catch (error) {
      console.error(`Failed to switch to provider ${providerId}:`, error);
      setProviderError(`Failed to switch to ${providerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Don't change the provider if selection fails
      return;
    }
  };

  const handleRequestNumber = async () => {
    if (!selectedProvider || !selectedProduct || !selectedOperator) {
      alert('Please select a provider, product, and operator first');
      return;
    }

    setIsLoading(true);
    setProviderError(null);
    
    try {
      console.log(`Requesting number from provider: ${selectedProvider} for product: ${selectedProduct} with country: ${selectedCountry} and operator: ${selectedOperator}`);
      
      // Request virtual number with selected product, country, and operator
      const newNumber = await ApiService.requestVirtualNumber(selectedProduct, selectedCountry, selectedOperator);
      
      setVirtualNumbers(prev => [...prev, newNumber]);
      console.log(`Successfully requested number: ${newNumber.number} from ${selectedProvider} for ${selectedProduct} with country ${selectedCountry} and operator ${selectedOperator}`);
      
      // Start polling for OTPs
      startOtpPolling(newNumber.number);
      
    } catch (error: any) {
      console.error(`Failed to request number from ${selectedProvider}:`, error);
      setProviderError(error.message || 'Failed to request virtual number.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling for OTPs for a specific number
  const startOtpPolling = (phoneNumber: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check if the number is still active
        const virtualNumber = virtualNumbers.find(num => num.number === phoneNumber);
        if (!virtualNumber || virtualNumber.status !== 'active') {
          clearInterval(pollInterval);
          return;
        }

        // Check for new OTPs
        const otps = await ApiService.checkOtps(phoneNumber);
        if (otps.length > 0) {
          // Update the virtual number with new OTPs
          setVirtualNumbers(prev => 
            prev.map(num => 
              num.number === phoneNumber 
                ? { ...num, otps: [...num.otps, ...otps] }
                : num
            )
          );
          
          console.log(`Received OTPs for ${phoneNumber}: ${otps.map(otp => otp.code).join(', ')}`);
          
          // Stop polling since we received OTPs
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error(`Error polling OTPs for ${phoneNumber}:`, error);
      }
    }, 5000); // Poll every 5 seconds

    // Store the interval ID for cleanup
    setPollingIntervals(prev => new Map(prev).set(phoneNumber, pollInterval));
  };

  const handleUpdateNumber = (updatedNumber: VirtualNumber) => {
    setVirtualNumbers(prev => 
      prev.map(num => 
        num.number === updatedNumber.number ? updatedNumber : num
      )
    );
  };

  const handleRemoveNumber = (number: string) => {
    setVirtualNumbers(prev => prev.filter(num => num.number !== number));
  };

  const handleProductSelect = (productId: string) => {
    console.log('Product selected:', productId);
    setSelectedProduct(productId);
    // Reset operator selection when product changes
    setSelectedOperator(null);
    // Update operators based on selected product
    const productOperators = getProductOperators(productId);
    console.log('New operators for product:', productId, productOperators);
    // Force a new array reference to ensure React detects the change
    setOperators([...productOperators]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">VirtNum India</h1>
                <p className="text-sm text-gray-400">SMS & OTP Service</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Left Panel - Product List */}
        <div className="w-80 bg-gray-800 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              📱 Products for {selectedCountry === 'usa' ? '🇺🇸 USA' : '🇮🇳 India'}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {selectedCountry === 'usa' 
                ? 'Select a product to get a USA virtual number for OTP testing'
                : 'Select a product to get an Indian virtual number for OTP testing'
              }
            </p>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <div className="pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-400">
                  Showing {filteredProducts.length} of {productsData.length} products
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {isLoadingProducts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading products...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-gray-700 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-600 ${
                      selectedProduct === product.id ? 'ring-2 ring-purple-500 bg-purple-900/20 border border-purple-500' : ''
                    }`}
                    onClick={() => handleProductSelect(product.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📱</span>
                        <div>
                          <h3 className={`font-medium ${selectedProduct === product.id ? 'text-purple-200' : 'text-white'}`}>
                            {product.name}
                          </h3>
                          <p className={`text-sm ${selectedProduct === product.id ? 'text-purple-300' : 'text-gray-400'}`}>
                            Virtual Number Service
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${selectedProduct === product.id ? 'text-purple-300' : 'text-green-400'}`}>
                          {(() => {
                            const priceData = productPrices.get(product.id);
                            if (priceData) {
                              return `₹${priceData.inrCost}`;
                            }
                            return '₹415'; // Default price
                          })()}
                        </span>
                        {selectedProduct === product.id && (
                          <CheckCircle className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {(() => {
                        const priceData = productPrices.get(product.id);
                        if (priceData && priceData.count > 0) {
                          return `${priceData.count} available`;
                        }
                        return '1 available';
                      })()}
                    </div>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No products found for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No products available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-6 bg-gray-900 overflow-y-auto">
          {/* Country Selector */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🌍 Select Country for Testing
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
            >
              <option value="usa">🇺🇸 United States (USA)</option>
              <option value="india">🇮🇳 India</option>
            </select>
            <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-300">
              <span className="font-medium">Available Services:</span>
              {selectedCountry === 'usa' 
                ? ' Facebook, Google, Virtual services (Free numbers available)'
                : ' Jio Mart, Zomato, Swiggy, Ola, Uber, Paytm (Free numbers available)'
              }
            </div>
          </div>

          {/* Provider Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Select Provider</h2>
            <div className="flex space-x-4">
              <ProviderSelector 
                selectedProvider={selectedProvider}
                onProviderChange={handleProviderChange}
              />
            </div>
          </div>

          {/* Select Operator Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Select Operator</h2>
            <p className="text-gray-400 mb-6">
              {selectedProduct ? (
                <>
                  Choose a telecom operator for <span className="text-purple-400 font-medium">
                    {apiProducts.find(p => p.id === selectedProduct)?.name || selectedProduct}
                  </span>
                  <span className="text-gray-500 ml-2">(Virtual Number Service)</span>
                </>
              ) : (
                'Select a product from the left panel to see available operators'
              )}
            </p>
            
            {/* Operator Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {operators.map((operator) => (
                <div
                  key={operator.id}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-700 ${
                    operator.selected ? 'ring-2 ring-purple-500 bg-gray-700' : ''
                  }`}
                  onClick={() => handleOperatorSelect(operator.id)}
                >
                  <h3 className="text-white font-medium mb-2">{operator.name}</h3>
                  <p className="text-2xl font-bold text-green-400">{convertToINR(operator.price)}</p>
                </div>
              ))}
            </div>

            {/* Get Number Button */}
            <button
              onClick={handleRequestNumber}
              disabled={!selectedOperator || isLoading}
              className={`w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                !selectedOperator || isLoading ? 'cursor-not-allowed' : ''
              }`}
            >
              <Phone className="w-5 h-5" />
              <span>{isLoading ? 'Getting Number...' : 'Get Number'}</span>
            </button>
          </div>

          {/* Active Number Display */}
          {virtualNumbers.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-purple-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium text-lg">{virtualNumbers[0].number}</span>
                      <button className="text-gray-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">5sim</span>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {apiProducts.find(p => p.id === selectedProduct)?.name || selectedProduct || 'general'}
                      </span>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{selectedCountry.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-green-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Active</span>
                  </div>
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Received OTPs Section */}
          {virtualNumbers.length > 0 && virtualNumbers[0].otps.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">Received OTPs</h3>
              </div>
              <div className="bg-green-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-2xl">{virtualNumbers[0].otps[0].code}</span>
                  <button className="text-white hover:text-green-200">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {providerError && (
            <div className="mt-6 bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-200">{providerError}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 
