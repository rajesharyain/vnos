require('dotenv').config();
const twilio = require('twilio');

async function testUSNumbers() {
  console.log('🇺🇸 Testing US Phone Number Availability...\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.log('❌ Twilio credentials not found in .env file');
    return;
  }

  const client = twilio(accountSid, authToken);

  try {
    // Test different US area codes
    console.log('📱 Testing US Area Codes:');
    const areaCodes = ['212', '415', '650', '310', '404', '305', '312', '773'];
    
    for (const areaCode of areaCodes) {
      try {
        const availableNumbers = await client.availablePhoneNumbers('US')
          .local
          .list({ 
            limit: 1, 
            voiceEnabled: false, 
            smsEnabled: true,
            areaCode: areaCode
          });
        
        if (availableNumbers.length > 0) {
          console.log(`   ✅ Area Code ${areaCode}: Available (${availableNumbers[0].phoneNumber})`);
        } else {
          console.log(`   ❌ Area Code ${areaCode}: No numbers available`);
        }
      } catch (error) {
        console.log(`   ❌ Area Code ${areaCode}: Error - ${error.message}`);
      }
    }
    console.log('');

    // Test general US availability
    console.log('🌍 Testing General US Availability:');
    try {
      const availableNumbers = await client.availablePhoneNumbers('US')
        .local
        .list({ 
          limit: 5, 
          voiceEnabled: false, 
          smsEnabled: true 
        });
      
      if (availableNumbers.length > 0) {
        console.log(`   ✅ Found ${availableNumbers.length} US numbers available:`);
        availableNumbers.forEach(num => {
          console.log(`      📞 ${num.phoneNumber} (${num.locality}, ${num.region})`);
        });
      } else {
        console.log('   ❌ No US numbers available');
      }
    } catch (error) {
      console.log(`   ❌ Error testing US availability: ${error.message}`);
    }
    console.log('');

    // Test toll-free numbers
    console.log('📞 Testing Toll-Free Numbers:');
    try {
      const tollFreeNumbers = await client.availablePhoneNumbers('US')
        .tollFree
        .list({ 
          limit: 3, 
          voiceEnabled: false, 
          smsEnabled: true 
        });
      
      if (tollFreeNumbers.length > 0) {
        console.log(`   ✅ Found ${tollFreeNumbers.length} toll-free numbers:`);
        tollFreeNumbers.forEach(num => {
          console.log(`      📞 ${num.phoneNumber}`);
        });
      } else {
        console.log('   ❌ No toll-free numbers available');
      }
    } catch (error) {
      console.log(`   ❌ Error testing toll-free: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error testing US numbers:', error.message);
  }
}

// Run the test
testUSNumbers().catch(console.error); 