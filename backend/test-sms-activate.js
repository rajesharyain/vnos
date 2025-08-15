require('dotenv').config();

// Test script for SMS-Activate API integration
const testSMSActivate = async () => {
  console.log('🧪 Testing SMS-Activate API Integration...\n');
  
  try {
    // Test 1: Get available countries
    console.log('1️⃣ Testing getAvailableCountries...');
    const countriesResponse = await fetch('http://localhost:5000/api/virtual-numbers/countries');
    if (countriesResponse.ok) {
      const countries = await countriesResponse.json();
      console.log(`✅ Found ${countries.length} countries`);
      const india = countries.find(c => c.id === '22' || c.name.toLowerCase().includes('india'));
      if (india) {
        console.log(`📍 India found: ${india.name} (ID: ${india.id})`);
      }
    } else {
      console.log('❌ Failed to get countries');
    }
    
    console.log('');
    
    // Test 2: Get available services for India
    console.log('2️⃣ Testing getAvailableServices for India...');
    const servicesResponse = await fetch('http://localhost:5000/api/virtual-numbers/services/22');
    if (servicesResponse.ok) {
      const services = await servicesResponse.json();
      console.log(`✅ Found ${services.length} services for India`);
      services.slice(0, 5).forEach(service => {
        console.log(`   - ${service.name}: $${service.cost} (${service.count} available)`);
      });
    } else {
      console.log('❌ Failed to get services for India');
    }
    
    console.log('');
    
    // Test 3: Get product prices
    console.log('3️⃣ Testing getProductPrice for various services...');
    const testServices = ['wa', 'tg', 'ig', 'fb', 'go'];
    
    for (const service of testServices) {
      try {
        const priceResponse = await fetch(`http://localhost:5000/api/virtual-numbers/price/${service}/22`);
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          console.log(`✅ ${service}: $${priceData.data.usdCost} → ₹${priceData.data.inrCost} (${priceData.data.count} available)`);
        } else {
          const error = await priceResponse.json();
          console.log(`❌ ${service}: ${priceResponse.status} - ${error.message}`);
        }
      } catch (error) {
        console.log(`❌ ${service}: Network error - ${error.message}`);
      }
    }
    
    console.log('');
    
    // Test 4: Get account balance
    console.log('4️⃣ Testing getBalance...');
    try {
      const balanceResponse = await fetch('http://localhost:5000/api/virtual-numbers/balance');
      if (balanceResponse.ok) {
        const balance = await balanceResponse.json();
        console.log(`✅ Account balance: $${balance.data.balance} ${balance.data.currency}`);
      } else {
        console.log('❌ Failed to get balance');
      }
    } catch (error) {
      console.log('❌ Balance check failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testSMSActivate().catch(console.error); 