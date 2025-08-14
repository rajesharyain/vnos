// Test script to check 5SIM guest prices endpoint
require('dotenv').config();

async function testGuestPrices() {
  const apiKey = process.env.FIVESIM_API_KEY;
  const baseUrl = 'https://5sim.net/v1';
  
  if (!apiKey) {
    console.error('❌ FIVESIM_API_KEY not found in .env file');
    return;
  }
  
  console.log('🧪 Testing 5SIM guest prices endpoint...\n');
  
  const testCountries = ['usa', 'india', 'england', 'canada'];
  
  for (const country of testCountries) {
    console.log(`🔍 Testing country: ${country}`);
    
    try {
      const response = await fetch(`${baseUrl}/guest/prices?country=${country}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${country} response status: ${response.status}`);
        console.log(`📊 ${country} response keys:`, Object.keys(data));
        
        if (data[country]) {
          console.log(`📱 ${country} products:`, Object.keys(data[country]));
          console.log(`💰 ${country} sample product data:`, JSON.stringify(data[country], null, 2));
        } else {
          console.log(`❌ ${country} not found in response`);
        }
      } else {
        console.log(`❌ ${country} failed: ${response.status} ${response.statusText}`);
      }
      
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.error(`❌ ${country} error:`, error.message);
    }
  }
}

// Run the test
testGuestPrices(); 