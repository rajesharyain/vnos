// Minimal test for 5SIM provider
require('dotenv').config();

async function test5SIM() {
  console.log('🧪 Testing 5SIM provider directly...\n');
  
  try {
    // Import the 5SIM provider directly
    const { FiveSimProvider } = await import('./src/services/fiveSimProvider.js');
    
    console.log('✅ 5SIM provider imported successfully');
    
    // Create instance
    const provider = new FiveSimProvider();
    console.log('✅ 5SIM provider instance created');
    
    // Test getting available products for USA
    console.log('\n🔍 Testing getAvailableProducts for USA...');
    const products = await provider.getAvailableProducts('usa');
    console.log(`📱 Found ${products.length} products for USA:`, products);
    
    if (products.length > 0) {
      console.log('\n🎯 Testing requestNumber with first product...');
      const productId = products[0].id;
      console.log(`📱 Using product: ${productId}`);
      
      try {
        const phoneNumber = await provider.requestNumber(productId, 'usa', 'any');
        console.log(`✅ Successfully got number: ${phoneNumber}`);
      } catch (error) {
        console.log(`❌ Failed to get number:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
test5SIM(); 