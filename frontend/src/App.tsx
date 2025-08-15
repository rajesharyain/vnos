import React, { useState, useEffect } from 'react';
import { VirtualNumber } from './types';
import { ApiService } from './services/api';
import { socketService } from './services/socket';
import { VirtualNumberSlot } from './components/VirtualNumberSlot';

import { Phone, Plus, Wifi, WifiOff, AlertCircle, CheckCircle, Copy, Clock, MessageCircle } from 'lucide-react';
import productsData from './data/products.json';

// Interface for real Indian services from SMS-Activate API
interface IndianService {
  id: string;
  name: string;
  category: string;
  smsActivateId: string;
  description: string;
  expectedCount: number;
  priority: string;
  realTimeData: {
    cost: number;
    count: number;
    usdCost: number;
    inrCost: number;
    available: boolean;
  };
}

function App() {
  const [virtualNumbers, setVirtualNumbers] = useState<VirtualNumber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('sms-activate'); // Default to SMS-Activate
  const [providerError, setProviderError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('india'); // Default to India
  const [apiProducts, setApiProducts] = useState<Array<{ id: string; name: string; cost: number; count: number }>>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true); // Start with loading true
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string | null>('any');
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [productPrices, setProductPrices] = useState<Map<string, { usdCost: number; inrCost: number; count: number }>>(new Map());
  
  // New state for real Indian services
  const [realIndianServices, setRealIndianServices] = useState<IndianService[]>([]);
  const [isLoadingIndianServices, setIsLoadingIndianServices] = useState(true);
  const [indianServicesError, setIndianServicesError] = useState<string | null>(null);
  
  // State for country dropdown
  const [showCountryDropdown, setShowCountryDropdown] = useState<boolean>(false);

  // Background worker to fetch Indian services
  useEffect(() => {
    const fetchIndianServices = async () => {
      try {
        setIsLoadingIndianServices(true);
        setIndianServicesError(null);
        
        console.log('[Worker] Fetching Indian services from SMS-Activate API...');
        const response = await fetch('http://localhost:5000/api/virtual-numbers/indian-services');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Indian services: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.services) {
          console.log(`[Worker] Successfully fetched ${data.data.services.length} Indian services`);
          setRealIndianServices(data.data.services);
          
          // Update products state with real data
          const realProducts = data.data.services.map((service: IndianService) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            icon: getServiceIcon(service.name),
            realTimeData: service.realTimeData
          }));
          
          setApiProducts(realProducts.map((product: any) => ({
            id: product.id,
            name: product.name,
            cost: product.realTimeData?.inrCost || 0,
            count: product.realTimeData?.count || 0
          })));
          
          // Set first available product as selected
          if (realProducts.length > 0) {
            setSelectedProduct(realProducts[0].id);
            const firstProductOperators = getProductOperators(realProducts[0].id, 'sms-activate', 'india');
            setOperators(firstProductOperators);
          }
          
          // Update product prices
          const newPrices = new Map<string, { usdCost: number; inrCost: number; count: number }>();
          realProducts.forEach((product: any) => {
            if (product.realTimeData) {
              newPrices.set(product.id, {
                usdCost: product.realTimeData.usdCost,
                inrCost: product.realTimeData.inrCost,
                count: product.realTimeData.count
              });
            }
          });
          setProductPrices(newPrices);
          
        } else {
          throw new Error('Invalid response format from Indian services API');
        }
      } catch (error) {
        console.error('[Worker] Error fetching Indian services:', error);
        setIndianServicesError(error instanceof Error ? error.message : 'Failed to fetch Indian services');
        
        // Fallback to hardcoded products if API fails
        const fallbackProducts = getProductsForCountry('india', 'sms-activate');
        setApiProducts(fallbackProducts.map(product => ({
          id: product.id,
          name: product.name,
          cost: 5,
          count: 1
        })));
        
        if (fallbackProducts.length > 0) {
          setSelectedProduct(fallbackProducts[0].id);
          const fallbackOperators = getProductOperators(fallbackProducts[0].id, 'sms-activate', 'india');
          setOperators(fallbackOperators);
        }
      } finally {
        setIsLoadingIndianServices(false);
        setIsLoadingProducts(false);
      }
    };

    // Fetch immediately and then every 5 minutes
    fetchIndianServices();
    const interval = setInterval(fetchIndianServices, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to get service icons
  const getServiceIcon = (serviceName: string): string => {
    const iconMap: { [key: string]: string } = {
      // E-commerce & Shopping
      'Amazon': '📦',
      'Flipkart': '🛒',
      'JioMart': '🛍️',
      'DMart': '🏪',
      'VishalMart': '🏬',
      'Myntra': '👗',
      'Snapdeal': '📱',
      'Meesho': '🛍️',
      'AJIO': '👔',
      'Nykaa': '💄',
      'Purplle': '💅',
      'FirstCry': '👶',
      
      // Food Delivery & Quick Commerce
      'Swiggy': '🍔',
      'Zomato': '🍕',
      'Zepto': '⚡',
      'BigBasket': '🛒',
      'Blinkit': '⚡',
      'Dunzo': '🚚',
      
      // Transportation & Ride-sharing
      'Uber': '🚗',
      'Ola Cabs': '🚙',
      'Rapido': '🏍️',
      'BluSmart': '🔋',
      
      // Digital Payments & Fintech
      'PayTM (Payzapp)': '💳',
      'PhonePe': '📱',
      'Google Pay (Google)': '🔍',
      'Mobikwik': '💰',
      'Amazon Pay': '📦',
      'CRED': '💳',
      
      // Entertainment & Media
      'Disney+ Hotstar': '🎬',
      'Jio Cinema': '🎭',
      'Jio Hotstar': '📺',
      'Sony LIV': '📺',
      'Netflix': '📺',
      'Prime Video': '📺',
      'Voot': '📺',
      
      // Gaming & Fantasy Sports
      'Dream11': '🎮',
      'MPL': '🎮',
      'WinZO': '🎮',
      'Ludo Supreme': '🎲',
      'RummyCircle': '🃏',
      
      // Healthcare & Pharmacy
      '1mg': '💊',
      'PharmEasy': '💊',
      'Apollo': '🏥',
      'Practo': '👨‍⚕️',
      'Netmeds': '💊',
      
      // Education
      'BYJU\'S': '📚',
      'Unacademy': '📚',
      'Vedantu': '📚',
      'Doubtnut': '❓',
      'Toppr': '📚',
      
      // Job & Services
      'Naukri': '💼',
      'Urban Company': '🏠',
      'Just Dial': '🔍',
      'BookMyShow': '🎫',
      'MakeMyTrip': '✈️',
      'Goibibo': '🏨',
      
      // Banking & Financial Services
      'HDFC Bank': '🏦',
      'ICICI Bank': '🏦',
      'State Bank of India': '🏦',
      'Axis Bank': '🏦',
      
      // Social Media & Communication
      'WhatsApp': '💬',
      'Instagram': '📸',
      'Facebook': '📘',
      'Telegram': '📢',
      'Snapchat': '👻'
    };
    
    return iconMap[serviceName] || '📱';
  };

  // Get operators for a specific product and provider
  const getProductOperators = (productId: string, provider: string, country: string) => {
    if (provider === 'sms-activate') {
      // SMS-Activate provider - operators are handled by the service
      return [
        { id: 'any', name: 'Any Operator', description: 'Any available operator', price: '₹5-15', selected: false },
        { id: 'airtel', name: 'Airtel', description: 'Bharti Airtel', price: '₹8-20', selected: false },
        { id: 'jio', name: 'Jio', description: 'Reliance Jio', price: '₹5-15', selected: false },
        { id: 'vodafone', name: 'Vodafone', description: 'Vodafone Idea', price: '₹6-18', selected: false },
        { id: 'bsnl', name: 'BSNL', description: 'Bharat Sanchar Nigam', price: '₹3-10', selected: false }
      ];
    } else if (country === 'usa') {
      // 5SIM provider for USA
      if (productId === 'facebook' || productId === 'google') {
        return [
          { id: 'any', name: 'Any Operator', description: 'Any available operator', price: '$1.50', selected: false },
          { id: 'verizon', name: 'Verizon', description: 'Verizon Wireless', price: '$2.00', selected: false },
          { id: 'att', name: 'AT&T', description: 'AT&T Mobility', price: '$1.80', selected: false },
          { id: 'tmobile', name: 'T-Mobile', description: 'T-Mobile US', price: '$1.60', selected: false },
          { id: 'sprint', name: 'Sprint', description: 'Sprint Corporation', price: '$1.40', selected: false }
        ];
      } else {
        return [
          { id: 'any', name: 'Any Operator', description: 'Any available operator', price: '$1.00', selected: false },
          { id: 'verizon', name: 'Verizon', description: 'Verizon Wireless', price: '$1.50', selected: false },
          { id: 'att', name: 'AT&T', description: 'AT&T Mobility', price: '$1.30', selected: false },
          { id: 'tmobile', name: 'T-Mobile', description: 'T-Mobile US', price: '$1.10', selected: false }
        ];
      }
    } else {
      // 5SIM provider for India
      return [
        { id: 'any', name: 'Any Operator', description: 'Any available operator', price: '₹2', selected: false },
        { id: 'airtel', name: 'Airtel', description: 'Bharti Airtel', price: '₹3', selected: false },
        { id: 'jio', name: 'Jio', description: 'Reliance Jio', price: '₹2', selected: false },
        { id: 'vodafone', name: 'Vodafone', description: 'Vodafone Idea', price: '₹2', selected: false },
        { id: 'bsnl', name: 'BSNL', description: 'Bharat Sanchar Nigam', price: '₹1', selected: false }
      ];
    }
  };

  // Handle country change
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedOperator('any');
    
    // Update operators based on new country
    if (selectedProduct) {
      const newOperators = getProductOperators(selectedProduct, selectedProvider, country);
      setOperators(newOperators);
    }
    
    console.log(`Country changed to: ${country}`);
  };

  // Convert USD to INR (approximate rate: 1 USD = 83 INR)
  const convertToINR = (usdPrice: string): string => {
    const numericValue = parseFloat(usdPrice.replace(/[^\d.]/g, ''));
    
    if (usdPrice.includes('$')) {
      const inrValue = Math.round(numericValue * 83);
      return `₹${inrValue}`;
    } else if (usdPrice.includes('₹')) {
      return usdPrice;
    } else {
      const inrValue = Math.round(numericValue * 83);
      return `₹${inrValue}`;
    }
  };

  // Get products based on selected country and provider
  const getProductsForCountry = (country: string, provider: string) => {
    if (provider === 'sms-activate') {
      // SMS-Activate provider - use Indian services
      if (country === 'india') {
        return [
          { id: 'amazon', name: 'Amazon', icon: '📦' },
          { id: 'flipkart', name: 'Flipkart', icon: '🛒' },
          { id: 'jiomart', name: 'JioMart', icon: '🛍️' },
          { id: 'dmart', name: 'DMart', icon: '🏪' },
          { id: 'vishalmart', name: 'VishalMart', icon: '🏬' },
          { id: 'paytm', name: 'Paytm', icon: '💳' },
          { id: 'phonepe', name: 'PhonePe', icon: '📱' },
          { id: 'swiggy', name: 'Swiggy', icon: '🍔' },
          { id: 'zomato', name: 'Zomato', icon: '🍕' },
          { id: 'uber', name: 'Uber', icon: '🚗' },
          { id: 'ola', name: 'Ola', icon: '🚙' },
          { id: 'disneyhotstar', name: 'Disney+ Hotstar', icon: '🎬' },
          { id: 'netflix', name: 'Netflix', icon: '📺' },
          { id: 'dream11', name: 'Dream11', icon: '🎮' },
          { id: '1mg', name: '1mg', icon: '💊' }
        ];
      } else {
        // For other countries with SMS-Activate, show generic services
        return [
          { id: 'uber', name: 'Uber', icon: '🚗' },
          { id: 'facebook', name: 'Facebook', icon: '📘' },
          { id: 'google', name: 'Google', icon: '🔍' },
          { id: 'whatsapp', name: 'WhatsApp', icon: '💬' }
        ];
      }
    } else if (country === 'usa') {
      // 5SIM provider for USA
      return [
        { id: 'uber', name: 'Uber', icon: '🚗' },
        { id: 'facebook', name: 'Facebook', icon: '📘' },
        { id: 'google', name: 'Google', icon: '🔍' },
        { id: 'twitter', name: 'Twitter', icon: '🐦' },
        { id: 'whatsapp', name: 'WhatsApp', icon: '💬' }
      ];
    } else {
      // 5SIM provider for India
      return [
        { id: 'zomato', name: 'Zomato', icon: '🍕' },
        { id: 'uber', name: 'Uber', icon: '🚗' },
        { id: 'ola', name: 'Ola', icon: '🚙' },
        { id: 'paytm', name: 'Paytm', icon: '💳' },
        { id: 'phonepe', name: 'PhonePe', icon: '📱' },
        { id: 'amazon', name: 'Amazon', icon: '📦' },
        { id: 'flipkart', name: 'Flipkart', icon: '🛒' },
        { id: 'swiggy', name: 'Swiggy', icon: '🍔' },
        { id: 'meesho', name: 'Meesho', icon: '🛍️' },
        { id: 'snapdeal', name: 'Snapdeal', icon: '📱' }
      ];
    }
  };

  // Get current products - prioritize real Indian services if available
  const getCurrentProducts = () => {
    if (selectedProvider === 'sms-activate' && selectedCountry === 'india' && realIndianServices.length > 0) {
      // Return real Indian services with icons
      return realIndianServices.map(service => ({
        id: service.id,
        name: service.name,
        icon: getServiceIcon(service.name)
      }));
    } else {
      // Fallback to hardcoded products
      return getProductsForCountry(selectedCountry, selectedProvider);
    }
  };

  const productsData = getCurrentProducts();

  // Filter products based on search query
  const filteredProducts = productsData.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [operators, setOperators] = useState(() => getProductOperators('amazon', 'sms-activate', 'india'));

  // Update products and operators when country or provider changes
  useEffect(() => {
    const newProducts = getCurrentProducts();
    
    // Update operators based on first product
    if (newProducts.length > 0) {
      const newOperators = getProductOperators(newProducts[0].id, selectedProvider, selectedCountry);
      setOperators(newOperators);
      if (!selectedProduct) {
        setSelectedProduct(newProducts[0].id);
      }
    }
  }, [selectedCountry, selectedProvider, realIndianServices]);

  // Auto-set India when SMS-Activate is selected
  useEffect(() => {
    if (selectedProvider === 'sms-activate' && selectedCountry !== 'india') {
      setSelectedCountry('india');
      console.log('Auto-switched to India for SMS-Activate provider');
    }
  }, [selectedProvider]);

  // Close country dropdown when country changes
  useEffect(() => {
    setShowCountryDropdown(false);
  }, [selectedCountry]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.country-selector')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOperatorSelect = (operatorId: string) => {
    setSelectedOperator(operatorId);
    setOperators(prev => prev.map(op => ({ ...op, selected: op.id === operatorId })));
  };

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('State updated:', {
      selectedProduct,
      operators: operators.map(op => ({ id: op.id, price: op.price })),
      selectedOperator,
      realIndianServicesCount: realIndianServices.length
    });
  }, [selectedProduct, operators, selectedOperator, realIndianServices]);

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
        // Default to SMS-Activate for India
        console.log('No provider selected, defaulting to SMS-Activate');
        setSelectedProvider('sms-activate');
      }
    } catch (error) {
      console.error('Failed to load selected provider:', error);
      // Default to SMS-Activate for India on error
      setSelectedProvider('sms-activate');
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
      
      // If switching to SMS-Activate, fetch operators from API
      if (providerId === 'sms-activate') {
        console.log('[Frontend] SMS-Activate provider detected, fetching dynamic operators...');
        
        // Determine country code based on selected country
        const countryCode = selectedCountry === 'india' ? '22' : '1';
        
        // Fetch operators from your backend API
        const response = await fetch(`http://localhost:5000/api/virtual-numbers/smsactivate/operators?country=${countryCode}`);
        
        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.operators) {
          // Convert the operator names to the format expected by your UI
          const apiOperators = data.operators.map((operatorName: string, index: number) => ({
            id: operatorName,
            name: operatorName.charAt(0).toUpperCase() + operatorName.slice(1), // Capitalize first letter
            price: '0.20', // Default price, you can update this later
            selected: index === 0 // Select first operator by default
          }));
          
          console.log(`[Frontend] Successfully fetched ${apiOperators.length} operators from SMS-Activate:`, apiOperators);
          
          // Update the operators state with dynamic operators from API
          setOperators(apiOperators);
          setSelectedOperator(apiOperators[0]?.id || 'any');
        } else {
          console.error('[Frontend] Backend returned error:', data.error);
        }
      }
      
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
    //setSelectedOperator(null);
    // Update operators based on selected product
    //const productOperators = getProductOperators(productId, selectedProvider, selectedCountry);
   // console.log('New operators for product:', productId, productOperators);
    // Force a new array reference to ensure React detects the change
    //setOperators([...productOperators]);
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
                            {/* Country Selector - Moved to header */}
              <div className="flex items-center space-x-2 country-selector">
                <div className="relative">
                  <button
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg border border-gray-600 transition-colors"
                  >
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🌍</span>
                    </div>
                    <span className="text-white font-medium text-sm">{selectedCountry === 'usa' ? 'US' : 'IN'}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Country Dropdown */}
                  {showCountryDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleCountryChange('india');
                            setShowCountryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${
                            selectedCountry === 'india' ? 'text-purple-400 bg-gray-700' : 'text-white'
                          }`}
                        >
                          🇮🇳 India
                        </button>
                        <button
                          onClick={() => {
                            handleCountryChange('usa');
                            setShowCountryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${
                            selectedCountry === 'usa' ? 'text-purple-400 bg-gray-700' : 'text-white'
                          }`}
                        >
                          🇺🇸 United States
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
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
            {/* Provider Selection - Moved to left panel */}
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="sms-activate">SMS-Activate</option>
                <option value="5sim">5SIM</option>
                <option value="twilio">Twilio</option>
                <option value="mock">Mock Provider</option>
              </select>
            </div>

            {/* Dynamic Description - Moved below Provider section */}
            <p className="text-sm text-gray-400 mb-4">
              {selectedProvider === 'sms-activate' && selectedCountry === 'india' 
                ? 'Real-time Indian services from SMS-Activate'
                : selectedCountry === 'usa' 
                  ? 'Select a product to get a USA virtual number'
                  : 'Select a product to get an Indian virtual number'
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
                filteredProducts.map((product) => {
                  // Get real-time data for this product
                  const realService = realIndianServices.find(s => s.id === product.id);
                  const priceData = productPrices.get(product.id);
                  
                  return (
                    <div
                      key={product.id}
                      className={`bg-gray-700 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-600 ${
                        selectedProduct === product.id ? 'ring-2 ring-purple-500 bg-purple-900/20 border border-purple-500' : ''
                      }`}
                      onClick={() => handleProductSelect(product.id)}
                    >
                                             <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                           <span className="text-2xl">{product.icon}</span>
                           <div>
                             <div className="flex items-center space-x-2">
                               <h3 className={`font-medium ${selectedProduct === product.id ? 'text-purple-200' : 'text-white'}`}>
                                 {product.name}
                               </h3>
                               {/* Availability indicator - just the dot */}
                               <div className={`w-2 h-2 rounded-full ${
                                 realService && realService.realTimeData 
                                   ? (realService.realTimeData.available ? 'bg-green-400' : 'bg-red-400')
                                   : 'bg-gray-400'
                               }`}></div>
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className={`text-lg font-bold ${selectedProduct === product.id ? 'text-purple-300' : 'text-green-400'}`}>
                             {realService && realService.realTimeData ? 
                               `₹${realService.realTimeData.inrCost}` : 
                               priceData ? `₹${priceData.inrCost}` : '₹415'
                             }
                           </span>
                           {selectedProduct === product.id && (
                             <CheckCircle className="w-4 h-4 text-purple-400" />
                           )}
                         </div>
                       </div>


                    </div>
                  );
                })
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

                                           {/* Compact Service & Operator Selection */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* Service Title & Provider Dropdown */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Service: <span className="text-purple-400">
                      {selectedProduct ? (apiProducts.find(p => p.id === selectedProduct)?.name || selectedProduct) : 'Select a service'}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Operator Selection - Added back to right panel */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-300">Select Operator</h4>
                  {selectedOperator && (
                    <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                      Selected: {operators.find(op => op.id === selectedOperator)?.name}
                    </span>
                  )}
                </div>
                
                {/* Operator Grid - 5 columns for better space usage */}
                <div className="grid grid-cols-5 gap-2">
                  {operators.map((operator) => (
                    <div
                      key={operator.id}
                      className={`bg-gray-700 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-600 ${
                        operator.selected ? 'ring-2 ring-purple-500 bg-purple-900/20 border border-purple-500' : ''
                      }`}
                      onClick={() => handleOperatorSelect(operator.id)}
                    >
                      <h5 className="text-white font-medium text-xs mb-1 truncate">{operator.name}</h5>
                      <p className="text-lg font-bold text-green-400">{convertToINR(operator.price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Get Number Button - Full Width */}
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
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{selectedProvider}</span>
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
