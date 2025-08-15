// Test script to check what products are available in 5SIM
const test5SimProducts = async () => {
  console.log('🧪 Testing 5SIM Available Products...\n');
  
  // Test different product names that might exist
  const testProducts = [
    'uber', 'facebook', 'google', 'zomato', 
    'whatsapp', 'telegram', 'instagram', 'tinder',
    'amazon', 'flipkart', 'paytm', 'phonepe'
  ];
  
  for (const product of testProducts) {
    console.log(`Testing product: ${product}`);
    
    try {
      const response = await fetch(`https://5sim.net/v1/guest/prices?product=${product}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${product}: Status ${response.status}`);
        console.log(`Response keys:`, Object.keys(result));
        
        if (Object.keys(result).length > 0) {
          console.log(`Available countries:`, Object.keys(result).slice(0, 5));
          console.log(`Total countries:`, Object.keys(result).length);
        } else {
          console.log(`❌ No countries available for ${product}`);
        }
      } else {
        console.log(`❌ ${product}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${product}: Network error - ${error.message}`);
    }
    
    console.log('');
  }
};

// Run the test
test5SimProducts().catch(console.error); 