// Debug script for 5SIM guest prices endpoint
require('dotenv').config();

async function debug5SIM() {
  console.log('🧪 Debugging 5SIM guest prices endpoint...\n');
  
  const testCountries = ['usa', 'india'];
  
  for (const country of testCountries) {
    console.log(`🔍 Testing country: ${country}`);
    
    try {
      const response = await fetch(`https://5sim.net/v1/guest/prices?country=${country}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${country} response status: ${response.status}`);
        console.log(`📊 ${country} response keys:`, Object.keys(data));
        console.log(`📱 ${country} response structure:`, JSON.stringify(data, null, 2));
        
        // Check if facebook and google products exist
        if (data.facebook) {
          console.log(`✅ ${country} has facebook product`);
        } else {
          console.log(`❌ ${country} missing facebook product`);
        }
        
        if (data.google) {
          console.log(`✅ ${country} has google product`);
        } else {
          console.log(`❌ ${country} missing google product`);
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

// Run the debug
debug5SIM(); 