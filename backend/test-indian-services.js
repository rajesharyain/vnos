// Test script for Indian Services API endpoints
const testIndianServices = async () => {
  console.log('🧪 Testing Indian Services API...\n');
  
  try {
    // Test 1: Get all Indian services with real-time data
    console.log('1️⃣ Testing /indian-services endpoint...');
    const allServicesResponse = await fetch('http://localhost:5000/api/virtual-numbers/indian-services');
    
    if (allServicesResponse.ok) {
      const allServices = await allServicesResponse.json();
      console.log(`✅ Found ${allServices.data.summary.total} Indian services`);
      console.log(`📊 Available: ${allServices.data.summary.available}, Unavailable: ${allServices.data.summary.unavailable}`);
      console.log(`📁 Categories: ${allServices.data.summary.categories}`);
      
      // Show some sample services
      console.log('\n📱 Sample Services:');
      allServices.data.services.slice(0, 5).forEach(service => {
        const status = service.realTimeData.available ? '✅' : '❌';
        console.log(`   ${status} ${service.name}: $${service.realTimeData.usdCost} → ₹${service.realTimeData.inrCost} (${service.realTimeData.count} available)`);
      });
    } else {
      const error = await allServicesResponse.json();
      console.log(`❌ Failed to get all services: ${error.message}`);
    }
    
    console.log('');
    
    // Test 2: Get services by category
    console.log('2️⃣ Testing /indian-services/:category endpoints...');
    const categories = [
      'E-commerce & Shopping',
      'Food Delivery & Quick Commerce',
      'Transportation & Ride-sharing',
      'Digital Payments & Fintech',
      'Entertainment & Media',
      'Gaming & Fantasy Sports',
      'Healthcare & Pharmacy',
      'Education',
      'Job & Services'
    ];
    
    for (const category of categories) {
      try {
        const encodedCategory = encodeURIComponent(category);
        const categoryResponse = await fetch(`http://localhost:5000/api/virtual-numbers/indian-services/${encodedCategory}`);
        
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          const availableCount = categoryData.data.summary.available;
          const totalCount = categoryData.data.summary.total;
          console.log(`✅ ${category}: ${availableCount}/${totalCount} services available`);
          
          // Show top available services in this category
          const availableServices = categoryData.data.services.filter(s => s.realTimeData.available);
          if (availableServices.length > 0) {
            const topService = availableServices[0];
            console.log(`   🏆 ${topService.name}: $${topService.realTimeData.usdCost} → ₹${topService.realTimeData.inrCost} (${topService.realTimeData.count} available)`);
          }
        } else {
          console.log(`❌ ${category}: Failed to get data`);
        }
      } catch (error) {
        console.log(`❌ ${category}: Network error - ${error.message}`);
      }
    }
    
    console.log('');
    
    // Test 3: Get specific high-value services
    console.log('3️⃣ Testing specific high-value services...');
    const highValueServices = ['amazon', 'uber', 'netflix', 'dream11', 'googlepay'];
    
    for (const serviceId of highValueServices) {
      try {
        const priceResponse = await fetch(`http://localhost:5000/api/virtual-numbers/price/${serviceId}/22`);
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          console.log(`✅ ${serviceId}: $${priceData.data.usdCost} → ₹${priceData.data.inrCost} (${priceData.data.count} available)`);
        } else {
          const error = await priceResponse.json();
          console.log(`❌ ${serviceId}: ${error.message}`);
        }
      } catch (error) {
        console.log(`❌ ${serviceId}: Network error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testIndianServices().catch(console.error); 