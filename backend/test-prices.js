// Test script for product price API endpoint
const testProductPrices = async () => {
  console.log('🧪 Testing Product Price API...\n');
  
  const testCombinations = [
    { product: 'uber', country: 'usa' },
    { product: 'facebook', country: 'usa' },
    { product: 'google', country: 'usa' },
    { product: 'zomato', country: 'india' }
  ];
  
  for (const combo of testCombinations) {
    console.log(`Testing price for: ${combo.product} in ${combo.country}`);
    
    try {
      const response = await fetch(`http://localhost:5000/api/virtual-numbers/price/${combo.product}/${combo.country}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${combo.product} in ${combo.country}: $${result.data.usdCost} → ₹${result.data.inrCost} (${result.data.count} available)`);
      } else {
        const error = await response.json();
        console.log(`❌ ${combo.product} in ${combo.country}: ${response.status} - ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ ${combo.product} in ${combo.country}: Network error - ${error.message}`);
    }
    
    console.log('');
  }
};

// Run the test
testProductPrices().catch(console.error); 