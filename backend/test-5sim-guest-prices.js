// Test script to check 5SIM guest prices API structure
const test5SimGuestPrices = async () => {
  console.log('🧪 Testing 5SIM Guest Prices API...\n');
  
  const products = ['uber', 'facebook', 'google', 'zomato'];
  
  for (const product of products) {
    console.log(`Testing: ${product}`);
    
    try {
      const response = await fetch(`https://5sim.net/v1/guest/prices?product=${product}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${product}: Status ${response.status}`);
        console.log(`Response keys:`, Object.keys(result));
        
        if (result[product]) {
          console.log(`Product data keys:`, Object.keys(result[product]));
          console.log(`Sample virtual type:`, Object.keys(result[product])[0]);
        }
        
        console.log(`Raw response:`, JSON.stringify(result, null, 2));
      } else {
        console.log(`❌ ${product}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${product}: Network error - ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
};

// Run the test
test5SimGuestPrices().catch(console.error); 