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
    
    // Test 5: Test POST endpoint with sample data
    console.log('\n5️⃣ Testing POST endpoint...');
    
    // Test different product/country combinations
    const testCases = [
      { product: 'facebook', country: 'usa', operator: 'any' },
      { product: 'zomato', country: 'india', operator: 'any' },
      { product: 'uber', country: 'usa', operator: 'any' },
      { product: 'paytm', country: 'india', operator: 'any' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.product} in ${testCase.country} with ${testCase.operator}...`);
      
      try {
        const postResponse = await fetch(`${baseUrl}/api/virtual-numbers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testCase)
        });
        
        if (postResponse.ok) {
          const postData = await postResponse.json();
          console.log(`   ✅ ${testCase.product} in ${testCase.country} working:`, postData.success ? 'Success' : 'Failed');
          if (postData.data && postData.data.number) {
            console.log(`   📱 Got number: ${postData.data.number}`);
            break; // Found a working combination
          }
        } else {
          const errorData = await postResponse.text();
          console.log(`   ❌ ${testCase.product} in ${testCase.country} failed:`, postResponse.status, errorData);
        }
      } catch (error) {
        console.log(`   ❌ ${testCase.product} in ${testCase.country} error:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testSwagger(); 