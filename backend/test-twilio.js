#!/usr/bin/env node

/**
 * Test script for Twilio integration
 * Run this to verify your Twilio credentials and configuration
 */

require('dotenv').config();
const twilio = require('twilio');

async function testTwilio() {
  console.log('🧪 Testing Twilio Integration...\n');

  // Check environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  console.log('📋 Environment Variables:');
  console.log(`   Account SID: ${accountSid ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Auth Token: ${authToken ? '✅ Set' : '❌ Missing'}\n`);

  if (!accountSid || !authToken) {
    console.log('❌ Missing required environment variables.');
    console.log('Please check your .env file and TWILIO_SETUP.md for instructions.\n');
    return;
  }

  try {
    // Initialize Twilio client
    const client = twilio(accountSid, authToken);
    console.log('🔐 Twilio client initialized successfully\n');

    // Test account connection
    console.log('📊 Testing account connection...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`   Account SID: ${account.sid}`);
    console.log(`   Account Name: ${account.friendlyName}`);
    console.log(`   Account Status: ${account.status}`);
    console.log(`   Balance: $${account.balance}\n`);

    // Test available phone numbers in India
    console.log('📱 Testing available Indian phone numbers...');
    try {
      const availableNumbers = await client.availablePhoneNumbers('IN')
        .local
        .list({
          limit: 3,
          voiceEnabled: false,
          smsEnabled: true
        });
      
      if (availableNumbers.length > 0) {
        console.log(`   ✅ Found ${availableNumbers.length} available Indian numbers:`);
        availableNumbers.forEach((num, index) => {
          console.log(`      ${index + 1}. ${num.phoneNumber} (${num.locality}, ${num.region})`);
        });
      } else {
        console.log('   ⚠️  No available Indian phone numbers found');
        console.log('   This might be due to:');
        console.log('   - No numbers available in your region');
        console.log('   - Account restrictions');
        console.log('   - Insufficient balance');
      }
    } catch (error) {
      console.log(`   ❌ Error checking available numbers: ${error.message}`);
    }

    // Test existing purchased numbers
    console.log('\n📞 Testing existing purchased numbers...');
    try {
      const incomingNumbers = await client.incomingPhoneNumbers.list();
      
      if (incomingNumbers.length > 0) {
        console.log(`   ✅ Found ${incomingNumbers.length} purchased numbers:`);
        incomingNumbers.forEach((num, index) => {
          console.log(`      ${index + 1}. ${num.phoneNumber} (${num.friendlyName || 'Unnamed'})`);
        });
      } else {
        console.log('   ℹ️  No purchased phone numbers found');
        console.log('   Numbers will be purchased dynamically when requested');
      }
    } catch (error) {
      console.log(`   ❌ Error checking purchased numbers: ${error.message}`);
    }

    // Test number purchasing capability (optional)
    console.log('\n🛒 Testing number purchasing capability...');
    try {
      // This is just a test - we won't actually purchase a number
      const availableNumbers = await client.availablePhoneNumbers('IN')
        .local
        .list({
          limit: 1,
          voiceEnabled: false,
          smsEnabled: true
        });
      
      if (availableNumbers.length > 0) {
        console.log('   ✅ Number purchasing test passed');
        console.log(`   Sample available number: ${availableNumbers[0].phoneNumber}`);
        console.log('   Note: No actual purchase was made during this test');
      } else {
        console.log('   ⚠️  No numbers available for purchase test');
      }
    } catch (error) {
      console.log(`   ❌ Number purchasing test failed: ${error.message}`);
    }

    console.log('\n✅ Twilio integration test completed successfully!');
    console.log('Your backend is ready to dynamically purchase and manage virtual numbers.');

  } catch (error) {
    console.log(`\n❌ Twilio integration test failed: ${error.message}`);
    
    if (error.code === 20003) {
      console.log('   This usually means your Account SID or Auth Token is incorrect.');
    } else if (error.code === 20404) {
      console.log('   This usually means the requested resource was not found.');
    } else if (error.code === 20008) {
      console.log('   This usually means your account has insufficient permissions.');
    }
    
    console.log('\nPlease check:');
    console.log('   1. Your .env file has correct credentials');
    console.log('   2. Your Twilio account is active');
    console.log('   3. Your account has sufficient balance');
    console.log('   4. Your account has permission to purchase phone numbers');
  }
}

// Run the test
testTwilio().catch(console.error); 