// Test script to see the actual structure of a product response
const testProductStructure = async () => {
  console.log('🧪 Testing 5SIM Product Structure...\n');
  
  const product = 'uber';
  console.log(`Testing structure for: ${product}`);
  
  try {
    const response = await fetch(`https://5sim.net/v1/guest/prices?product=${product}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Status: ${response.status}`);
      console.log(`Response structure:`, JSON.stringify(result, null, 2));
      
      if (result[product]) {
        console.log(`\nProduct data keys:`, Object.keys(result[product]));
        
        // Check first country
        const firstCountry = Object.keys(result[product])[0];
        if (firstCountry) {
          console.log(`\nFirst country (${firstCountry}) data:`, JSON.stringify(result[product][firstCountry], null, 2));
        }
      }
    } else {
      console.log(`❌ ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Network error - ${error.message}`);
  }
};

// Run the test
testProductStructure().catch(console.error); 