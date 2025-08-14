// Test script to check Swagger and API functionality
// Using built-in fetch (Node.js 18+)

async function testSwagger() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Swagger and API functionality...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Server is running:', healthData);
    } else {
      console.log('❌ Server health check failed:', healthResponse.status);
      return;
    }
    
    // Test 2: Check root endpoint
    console.log('\n2️⃣ Testing root endpoint...');
    const rootResponse = await fetch(`${baseUrl}/`);
    if (rootResponse.ok) {
      const rootData = await rootResponse.json();
      console.log('✅ Root endpoint working:', rootData);
      console.log('📚 Swagger URL:', rootData.documentation);
    } else {
      console.log('❌ Root endpoint failed:', rootResponse.status);
    }
    
    // Test 3: Check Swagger UI
    console.log('\n3️⃣ Testing Swagger UI...');
    const swaggerResponse = await fetch(`${baseUrl}/api-docs`);
    if (swaggerResponse.ok) {
      console.log('✅ Swagger UI is accessible');
      console.log('🌐 Open in browser: http://localhost:5000/api-docs');
    } else {
      console.log('❌ Swagger UI failed:', swaggerResponse.status);
    }
    
    // Test 4: Check API endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    const apiResponse = await fetch(`${baseUrl}/api/virtual-numbers/providers`);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API endpoints working:', apiData.success ? 'Success' : 'Failed');
    } else {
      console.log('❌ API endpoints failed:', apiResponse.status);
    }
    
    // Test POST endpoint with working combinations
    console.log('\n5️⃣ Testing POST endpoint...\n');
    
    const testCombinations = [
      { product: 'uber', country: 'usa', operator: 'any' },
      { product: 'facebook', country: 'usa', operator: 'any' },
      { product: 'google', country: 'usa', operator: 'any' }
    ];

    for (const combo of testCombinations) {
      console.log(`   Testing: ${combo.product} in ${combo.country} with ${combo.operator}...`);
      
      try {
        const response = await fetch('http://localhost:5000/api/virtual-numbers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            product: combo.product,
            country: combo.country,
            operator: combo.operator
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ ${combo.product} in ${combo.country} working: Success`);
          if (result.number) {
            console.log(`   📱 Got number: ${result.number}`);
          }
          if (result.id) {
            console.log(`   🆔 Activation ID: ${result.id}`);
          }
        } else {
          const error = await response.json();
          console.log(`   ❌ ${combo.product} in ${combo.country} failed: ${response.status} ${JSON.stringify(error)}`);
        }
      } catch (error) {
        console.log(`   ❌ ${combo.product} in ${combo.country} error: ${error.message}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testSwagger(); 