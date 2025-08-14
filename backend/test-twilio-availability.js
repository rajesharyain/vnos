require('dotenv').config();
const twilio = require('twilio');

async function testTwilioAvailability() {
  console.log('🔍 Testing Twilio Account Availability...\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.log('❌ Twilio credentials not found in .env file');
    return;
  }

  const client = twilio(accountSid, authToken);

  try {
    // Test 1: Check account status
    console.log('📋 Account Information:');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`   Account Name: ${account.friendlyName}`);
    console.log(`   Account Status: ${account.status}`);
    console.log(`   Account Type: ${account.type || 'Standard'}`);
    console.log(`   Date Created: ${account.dateCreated}`);
    console.log('');

    // Test 2: Check available countries
    console.log('🌍 Testing Available Countries:');
    const countries = ['US', 'CA', 'GB', 'IN', 'AU', 'DE', 'FR', 'JP'];
    
    for (const country of countries) {
      try {
        const availableNumbers = await client.availablePhoneNumbers(country)
          .local
          .list({ limit: 1, voiceEnabled: false, smsEnabled: true });
        
        if (availableNumbers.length > 0) {
          console.log(`   ✅ ${country}: Available (${availableNumbers.length} numbers)`);
        } else {
          console.log(`   ❌ ${country}: No numbers available`);
        }
      } catch (error) {
        if (error.code === 20404) {
          console.log(`   ❌ ${country}: Not available (404 error)`);
        } else {
          console.log(`   ❌ ${country}: Error - ${error.message}`);
        }
      }
    }
    console.log('');

    // Test 3: Check existing phone numbers
    console.log('📱 Existing Phone Numbers:');
    const incomingNumbers = await client.incomingPhoneNumbers.list();
    if (incomingNumbers.length > 0) {
      incomingNumbers.forEach(num => {
        console.log(`   📞 ${num.phoneNumber} (${num.countryCode}) - ${num.capabilities.sms ? 'SMS' : 'No SMS'}`);
      });
    } else {
      console.log('   No existing phone numbers found');
    }
    console.log('');

    // Test 4: Check account balance (if available)
    try {
      const balance = await client.api.accounts(accountSid).balance.fetch();
      console.log('💰 Account Balance:');
      console.log(`   Balance: ${balance.balance} ${balance.currency}`);
      console.log('');
    } catch (error) {
      console.log('💰 Account Balance: Not available (trial account)');
      console.log('');
    }

    // Test 5: Recommendations
    console.log('💡 Recommendations:');
    if (account.status === 'active' && account.type !== 'Trial') {
      console.log('   ✅ Your account appears to be active and should support international numbers');
      console.log('   🔍 The 404 error might be due to temporary unavailability of Indian numbers');
      console.log('   📞 Try again later or contact Twilio support');
    } else {
      console.log('   ❌ Your account appears to be a trial account');
      console.log('   🔓 Upgrade to a full account to access Indian numbers');
      console.log('   💳 Add a credit card and verify your account');
      console.log('   🌍 Trial accounts are limited to US/Canada numbers only');
    }

  } catch (error) {
    console.error('❌ Error testing Twilio availability:', error.message);
    console.log('');
    console.log('🔍 Error Details:');
    console.log(`   Code: ${error.code}`);
    console.log(`   Status: ${error.status}`);
    console.log(`   Message: ${error.message}`);
    
    if (error.moreInfo) {
      console.log(`   More Info: ${error.moreInfo}`);
    }
  }
}

// Run the test
testTwilioAvailability().catch(console.error); 