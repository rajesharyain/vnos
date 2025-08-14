import React, { useState, useEffect } from 'react';
import { VirtualNumber } from './types';
import { ApiService } from './services/api';
import { socketService } from './services/socket';
import { VirtualNumberSlot } from './components/VirtualNumberSlot';
import { ProviderSelector } from './components/ProviderSelector';
import { Phone, Plus, Wifi, WifiOff, AlertCircle, CheckCircle, Copy, Clock, MessageCircle } from 'lucide-react';

function App() {
  const [virtualNumbers, setVirtualNumbers] = useState<VirtualNumber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('5sim'); // Default to 5SIM for India
  const [providerError, setProviderError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [apiProducts, setApiProducts] = useState<Array<{ id: string; name: string; cost: number; count: number }>>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products based on search query
  const filteredProducts = apiProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock operators data - you can replace this with real data
  const operatorsData = [
    { id: 'jio', name: 'Reliance Jio', price: '₹3', selected: false },
    { id: 'airtel', name: 'Bharti Airtel', price: '₹4', selected: false },
    { id: 'vodafone', name: 'Vodafone Idea', price: '₹2', selected: false },
    { id: 'bsnl', name: 'BSNL', price: '₹3', selected: false },
    { id: 'mtnl', name: 'MTNL', price: '₹2', selected: false },
    { id: 'idea', name: 'Idea Cellular', price: '₹3', selected: false }
  ];

  // Product-specific operator configurations
  const getProductOperators = (productId: string) => {
    const baseOperators = [...operatorsData];
    
    switch (productId) {
      case 'zomato':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹2' : op.id === 'airtel' ? '₹3' : '₹2',
          selected: false
        }));
      case 'swiggy':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'vodafone' ? '₹2' : op.id === 'mtnl' ? '₹1' : '₹3',
          selected: false
        }));
      case 'ola':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'bsnl' ? '₹2' : op.id === 'idea' ? '₹2' : '₹3',
          selected: false
        }));
      case 'uber':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹3' : op.id === 'airtel' ? '₹4' : '₹2',
          selected: false
        }));
      case 'banking':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹5' : op.id === 'airtel' ? '₹6' : '₹4',
          selected: false
        }));
      case 'crypto':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹6' : op.id === 'airtel' ? '₹7' : '₹5',
          selected: false
        }));
      case 'gaming':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'vodafone' ? '₹3' : op.id === 'mtnl' ? '₹2' : '₹4',
          selected: false
        }));
      case 'social':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'idea' ? '₹2' : op.id === 'bsnl' ? '₹3' : '₹3',
          selected: false
        }));
      case 'shopping':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹1' : op.id === 'airtel' ? '₹2' : '₹2',
          selected: false
        }));
      case 'travel':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'vodafone' ? '₹3' : op.id === 'mtnl' ? '₹2' : '₹4',
          selected: false
        }));
      case 'health':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹5' : op.id === 'airtel' ? '₹6' : '₹4',
          selected: false
        }));
      case 'education':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'idea' ? '₹2' : op.id === 'bsnl' ? '₹3' : '₹3',
          selected: false
        }));
      case 'finance':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹6' : op.id === 'airtel' ? '₹7' : '₹5',
          selected: false
        }));
      case 'entertainment':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'vodafone' ? '₹3' : op.id === 'mtnl' ? '₹2' : '₹4',
          selected: false
        }));
      case 'utilities':
        return baseOperators.map(op => ({
          ...op,
          price: op.id === 'jio' ? '₹1' : op.id === 'airtel' ? '₹2' : '₹2',
          selected: false
        }));
      default:
        return baseOperators;
    }
  };

  // Load products from 5SIM API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        // Get products for India from 5SIM
        const products = await ApiService.getProviderProducts('5sim', 'india');
        console.log('Loaded 5SIM products:', products);
        setApiProducts(products);
        
        // Set first product as default if available
        if (products.length > 0) {
          setSelectedProduct(products[0].id);
          // Update operators based on first product
          const productOperators = getProductOperators(products[0].id);
          setOperators([...productOperators]);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        // Fallback to mock products if API fails
        setApiProducts([
          { id: '1688', name: '1688', cost: 0.1, count: 1 },
          { id: '17live', name: '17live', cost: 0.1, count: 1 },
          { id: '1mg', name: '1mg', cost: 0.1, count: 1 },
          { id: '23red', name: '23red', cost: 0.1, count: 1 },
          { id: '32red', name: '32red', cost: 0.1, count: 1 },
          { id: '4fun', name: '4fun', cost: 0.1, count: 1 },
          { id: '51exch', name: '51exch', cost: 0.1, count: 1 },
          { id: '51game', name: '51game', cost: 0.1, count: 1 },
          { id: '777ace', name: '777ace', cost: 0.1, count: 1 },
          { id: '789jackpotsagent', name: '789jackpotsagent', cost: 0.1, count: 1 }
        ]);
        setSelectedProduct('1688');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Mock products data - you can replace this with real data
  const products = [
    { id: 'zomato', name: 'Zomato', description: 'Food delivery OTP', price: '₹2', icon: '🍕' },
    { id: 'swiggy', name: 'Swiggy', description: 'Food delivery OTP', price: '₹3', icon: '🛍️' },
    { id: 'ola', name: 'Ola', description: 'Ola cab services', price: '₹2', icon: '🚗' },
    { id: 'uber', name: 'Uber', description: 'Uber cab services', price: '₹3', icon: '🚙' },
    { id: 'banking', name: 'Banking', description: 'Bank OTP services', price: '₹5', icon: '🏦' },
    { id: 'crypto', name: 'Crypto', description: 'Cryptocurrency OTP', price: '₹6', icon: '₿' },
    { id: 'gaming', name: 'Gaming', description: 'Gaming platform OTP', price: '₹4', icon: '🎮' },
    { id: 'social', name: 'Social', description: 'Social media OTP', price: '₹3', icon: '📱' },
    { id: 'shopping', name: 'Shopping', description: 'E-commerce OTP', price: '₹2', icon: '🛒' },
    { id: 'travel', name: 'Travel', description: 'Travel booking OTP', price: '₹4', icon: '✈️' },
    { id: 'health', name: 'Health', description: 'Healthcare OTP', price: '₹5', icon: '🏥' },
    { id: 'education', name: 'Education', description: 'Education platform OTP', price: '₹3', icon: '📚' },
    { id: 'finance', name: 'Finance', description: 'Financial services OTP', price: '₹6', icon: '💰' },
    { id: 'entertainment', name: 'Entertainment', description: 'Entertainment OTP', price: '₹4', icon: '🎬' },
    { id: 'utilities', name: 'Utilities', description: 'Utility services OTP', price: '₹2', icon: '⚡' }
  ];

  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);

  const handleOperatorSelect = (operatorId: string) => {
    setSelectedOperator(operatorId);
    setOperators(prev => prev.map(op => ({ ...op, selected: op.id === operatorId })));
  };

  const [operators, setOperators] = useState(() => getProductOperators('zomato'));

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
    if (!selectedProvider) {
      alert('Please select a provider first');
      return;
    }

    setIsLoading(true);
    setProviderError(null);
    
    try {
      console.log(`Requesting number from provider: ${selectedProvider}`);
      const newNumber = await ApiService.requestNumber();
      setVirtualNumbers(prev => [...prev, newNumber]);
      console.log(`Successfully requested number: ${newNumber.number} from ${selectedProvider}`);
    } catch (error) {
      console.error(`Failed to request number from ${selectedProvider}:`, error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          provider: selectedProvider
        });
      }
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProviderError(`Failed to request number from ${selectedProvider}: ${errorMessage}`);
      
      // Don't show generic alert, let the error display handle it
    } finally {
      setIsLoading(false);
    }
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
        {/* Left Panel - Products Only */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 min-h-screen p-6">
          <div className="sticky top-6 space-y-6">
            {/* SMS Services Only Section */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">SMS Services Only</h3>
                  <p className="text-sm text-gray-400">Indian operators & popular platforms</p>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">PRODUCTS ({apiProducts.length})</h2>
              
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
                    Showing {filteredProducts.length} of {apiProducts.length} products
                  </div>
                )}
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
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
                            ${product.cost}
                          </span>
                          {selectedProduct === product.id && (
                            <CheckCircle className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {product.count} available
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
        </div>

        {/* Right Panel - Main Content */}
        <div className="flex-1 bg-gray-900 p-6">
          {/* Provider Selection Section - Top Row */}
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
                  <p className="text-2xl font-bold text-green-400">{operator.price}</p>
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
                      <span className="text-white font-medium text-lg">+91{virtualNumbers[0].number}</span>
                      <button className="text-gray-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">5sim</span>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        SMS - {apiProducts.find(p => p.id === selectedProduct)?.name || selectedProduct || 'general'}
                      </span>
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
