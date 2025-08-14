require('dotenv').config();

async function testSMSActivate() {
  console.log('🔍 Testing SMS-Activate Integration...\n');

  const apiKey = process.env.SMS_ACTIVATE_API_KEY;

  if (!apiKey) {
    console.log('❌ SMS_ACTIVATE_API_KEY not found in .env file');
    console.log('');
    console.log('📝 To fix this:');
    console.log('1. Go to https://sms-activate.io and sign up');
    console.log('2. Get your API key from dashboard');
    console.log('3. Add SMS_ACTIVATE_API_KEY=your_key_here to .env file');
    return;
  }

  if (apiKey === 'your_sms_activate_api_key_here') {
    console.log('❌ Please replace "your_sms_activate_api_key_here" with your actual SMS-Activate API key');
    console.log('');
    console.log('📝 Steps:');
    console.log('1. Go to https://sms-activate.io');
    console.log('2. Sign up and verify your account');
    console.log('3. Get your API key from dashboard');
    console.log('4. Update .env file with real API key');
    return;
  }

  console.log('✅ SMS_ACTIVATE_API_KEY found in .env file');
  console.log('');

  // Test SMS-Activate API endpoints
  console.log('🌐 Testing SMS-Activate API endpoints...');
  
  try {
    // Test 1: Get account balance
    console.log('💰 Testing account balance...');
    const balanceParams = new URLSearchParams({
      api_key: apiKey,
      action: 'getBalance'
    });

    const balanceResponse = await fetch(`https://api.sms-activate.org/stubs/handler_api.php?${balanceParams.toString()}`);
    const balanceResult = await balanceResponse.text();
    
    console.log(`   Raw balance response: "${balanceResult}"`);
    
    if (balanceResult.startsWith('ACCESS:')) {
      const balance = parseFloat(balanceResult.split(':')[1]);
      console.log(`   ✅ Balance loaded successfully: $${balance}`);
      
      if (balance < 1) {
        console.log(`   ⚠️  Low balance! You need at least $1-2 for testing`);
        console.log(`   💡 Recommended: Add $5-10 for proper testing`);
      }
    } else if (balanceResult.startsWith('BAD_KEY')) {
      console.log('   ❌ Invalid API key - please check your key');
    } else if (balanceResult.startsWith('NO_BALANCE')) {
      console.log('   ❌ No balance - please add funds to your account');
    } else {
      console.log(`   ❌ Balance failed: ${balanceResult}`);
    }
    console.log('');

    // Test 2: Get available countries
    console.log('🌍 Testing available countries...');
    const countriesParams = new URLSearchParams({
      api_key: apiKey,
      action: 'getCountries'
    });

    const countriesResponse = await fetch(`https://api.sms-activate.org/stubs/handler_api.php?${countriesParams.toString()}`);
    const countriesResult = await countriesResponse.text();
    
    console.log(`   Raw countries response length: ${countriesResult.length} characters`);
    
    if (countriesResult && !countriesResult.startsWith('BAD_KEY')) {
      try {
        // Try to parse as JSON first
        const countries = JSON.parse(countriesResult);
        console.log(`   ✅ Found ${Object.keys(countries).length} countries (JSON format):`);
        
        // Look for India in different possible formats
        let indiaFound = false;
        Object.entries(countries).forEach(([id, country]) => {
          if (typeof country === 'object' && country.eng) {
            if (id === '22' || country.eng.toLowerCase().includes('india')) {
              console.log(`   🎯 INDIA FOUND: ${country.eng} (ID: ${id})`);
              indiaFound = true;
            }
          }
        });
        
        if (!indiaFound) {
          console.log('   ❌ India not found in available countries');
          console.log('   💡 This might be due to:');
          console.log('      - Regional restrictions');
          console.log('      - Account verification status');
          console.log('      - Service availability');
        }
      } catch (parseError) {
        // Try parsing as semicolon-separated format
        const countries = countriesResult.split(';').filter(c => c.trim()).map(country => {
          const parts = country.split(':');
          return { id: parts[0], name: parts[1] || 'Unknown' };
        });
        
        console.log(`   ✅ Found ${countries.length} countries (semicolon format):`);
        countries.slice(0, 10).forEach(country => {
          console.log(`      ${country.id}: ${country.name}`);
        });
        
        // Check if India is available
        const india = countries.find(c => c.id === '22' || c.name.toLowerCase().includes('india'));
        if (india) {
          console.log(`   🎯 INDIA FOUND: ${india.name} (ID: ${india.id})`);
        } else {
          console.log('   ❌ India not found in available countries');
        }
      }
    } else {
      console.log(`   ❌ Countries failed: ${countriesResult}`);
    }
    console.log('');

    // Test 3: Check prices for India (country code 22) specifically
    console.log('💵 Testing prices for India (country code 22)...');
    const indiaPricesParams = new URLSearchParams({
      api_key: apiKey,
      action: 'getPrices',
      country: '22' // India country code
    });

    const indiaPricesResponse = await fetch(`https://api.sms-activate.org/stubs/handler_api.php?${indiaPricesParams.toString()}`);
    const indiaPricesResult = await indiaPricesResponse.text();
    
    if (indiaPricesResult && !indiaPricesResult.startsWith('BAD_KEY')) {
      try {
        const prices = JSON.parse(indiaPricesResult);
        if (prices['22']) {
          console.log('   ✅ India prices available:');
          Object.entries(prices['22']).slice(0, 5).forEach(([service, price]) => {
            console.log(`      📱 ${service}: $${price.cost} (${price.count} available)`);
          });
        } else {
          console.log('   ❌ India prices not available');
        }
      } catch (parseError) {
        console.log(`   ⚠️  India prices response: ${indiaPricesResult.substring(0, 100)}...`);
      }
    } else {
      console.log(`   ❌ India prices failed: ${indiaPricesResult}`);
    }
    console.log('');

    // Test 4: Check prices for fallback countries
    console.log('💵 Testing prices for fallback countries...');
    const fallbackCountries = ['0', '187', '196', '199']; // Fallback options
    
    for (const countryCode of fallbackCountries) {
      const pricesParams = new URLSearchParams({
        api_key: apiKey,
        action: 'getPrices',
        country: countryCode
      });

      const pricesResponse = await fetch(`https://api.sms-activate.org/stubs/handler_api.php?${pricesParams.toString()}`);
      const pricesResult = await pricesResponse.text();
      
      if (pricesResult && !pricesResult.startsWith('BAD_KEY')) {
        try {
          const prices = JSON.parse(pricesResult);
          if (prices[countryCode]) {
            console.log(`   ✅ Country ${countryCode} prices available:`);
            Object.entries(prices[countryCode]).slice(0, 3).forEach(([service, price]) => {
              console.log(`      📱 ${service}: $${price.cost} (${price.count} available)`);
            });
            break; // Found a working country
          }
        } catch (parseError) {
          console.log(`   ⚠️  Country ${countryCode} response: ${pricesResult.substring(0, 100)}...`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing SMS-Activate API:', error.message);
  }

  console.log('');
  console.log('🎯 Next Steps:');
  console.log('1. ✅ API key configured');
  console.log('2. 💰 Add funds to your SMS-Activate account');
  console.log('3. 🔄 Restart your backend server');
  console.log('4. 🌐 Open frontend and select SMS-Activate provider');
  console.log('5. 📱 Request virtual numbers');
  console.log('');
  console.log('💡 SMS-Activate offers good coverage and competitive pricing!');
  console.log('💰 Cost: $0.20-0.80 per number (cheaper than Twilio)');
  console.log('');
  console.log('🔧 If India is not available:');
  console.log('   - Try other countries (US, Russia, Europe)');
  console.log('   - Check your account verification status');
  console.log('   - Contact SMS-Activate support');
  console.log('');
  console.log('🇮🇳 India should be available as country code 22!');
}

// Run the test
testSMSActivate().catch(console.error); 