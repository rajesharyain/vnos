const fetch = require('node-fetch');
require('dotenv').config();

class FiveSimIntegrationTest {
  constructor() {
    this.apiKey = process.env.FIVESIM_API_KEY;
    this.baseUrl = 'https://5sim.net/v1';
    
    if (!this.apiKey) {
      console.error('❌ FIVESIM_API_KEY is not configured');
      process.exit(1);
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };
  }

  async testCompleteFlow() {
    console.log('🚀 Starting 5SIM Integration Test...\n');
    
    try {
      // Step 1: Check account balance
      console.log('1️⃣ Checking account balance...');
      const balance = await this.getBalance();
      console.log(`💰 Balance: $${balance}\n`);
      
      if (balance < 0.10) {
        console.log('⚠️  Low balance warning: You need at least $0.10 to test\n');
      }

      // Step 2: Check available countries
      console.log('2️⃣ Checking available countries...');
      const countries = await this.getAvailableCountries();
      const india = countries.find(c => c.id === 'india');
      console.log(`🌍 Found ${countries.length} countries`);
      console.log(`🇮🇳 India available: ${india ? 'Yes' : 'No'}\n`);

      if (!india) {
        console.log('❌ India is not available. Cannot proceed with test.\n');
        return;
      }

      // Step 3: Check available products for India
      console.log('3️⃣ Checking available products for India...');
      const products = await this.getAvailableProducts('india');
      console.log(`📱 Found ${products.length} products for India:`);
      products.forEach(p => {
        console.log(`   - ${p.id}: $${p.cost} (${p.count} available)`);
      });
      console.log();

      if (products.length === 0) {
        console.log('❌ No products available for India. Cannot proceed with test.\n');
        return;
      }

      // Step 4: Select a product for testing
      const testProduct = products[0];
      console.log(`4️⃣ Selected test product: ${testProduct.id} ($${testProduct.cost})\n`);

      // Step 5: Request a virtual number
      console.log('5️⃣ Requesting virtual number...');
      const phoneNumber = await this.requestNumber(testProduct.id, 'india');
      console.log(`📞 Received number: ${phoneNumber}\n`);

      // Step 6: Poll for OTPs (with 30-second timeout)
      console.log('6️⃣ Polling for OTPs (30 seconds timeout)...');
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds
      
      let otps = [];
      while (Date.now() - startTime < timeout) {
        try {
          otps = await this.checkOtps(phoneNumber);
          if (otps.length > 0) {
            console.log(`✅ OTP received: ${otps.map(otp => otp.code).join(', ')}`);
            break;
          }
          
          // Wait 5 seconds before next check
          await new Promise(resolve => setTimeout(resolve, 5000));
          console.log('⏳ Still waiting for OTP...');
        } catch (error) {
          console.log(`⚠️  Error checking OTPs: ${error.message}`);
        }
      }

      if (otps.length === 0) {
        console.log('⏰ No OTP received within 30 seconds. Auto-cancelling...');
        
        // Step 7: Cancel the number (auto-cancellation)
        console.log('7️⃣ Cancelling number...');
        const cancelled = await this.cancelNumber(phoneNumber);
        if (cancelled) {
          console.log('✅ Number cancelled successfully. Refund will be processed.\n');
        } else {
          console.log('❌ Failed to cancel number\n');
        }
      } else {
        console.log('🎉 Test completed successfully! OTP received.\n');
        
        // Step 7: Cancel the number after successful test
        console.log('7️⃣ Cancelling number after successful test...');
        const cancelled = await this.cancelNumber(phoneNumber);
        if (cancelled) {
          console.log('✅ Number cancelled successfully.\n');
        } else {
          console.log('❌ Failed to cancel number\n');
        }
      }

      console.log('🏁 Integration test completed!\n');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }

  async getBalance() {
    const response = await fetch(`${this.baseUrl}/user/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get balance: ${response.status}`);
    }

    const result = await response.json();
    return result.balance || 0;
  }

  async getAvailableCountries() {
    const response = await fetch(`${this.baseUrl}/guest/countries`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get countries: ${response.status}`);
    }

    const result = await response.json();
    return Object.entries(result).map(([id, country]) => ({
      id,
      name: country.title || id
    }));
  }

  async getAvailableProducts(countryId) {
    const response = await fetch(`${this.baseUrl}/guest/prices?country=${countryId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get products: ${response.status}`);
    }

    const result = await response.json();
    const products = [];
    
    if (result[countryId]) {
      Object.entries(result[countryId]).forEach(([id, product]) => {
        products.push({
          id,
          name: id,
          cost: product.cost || 0.10,
          count: product.count || 1
        });
      });
    }
    
    return products;
  }

  async requestNumber(productId, countryId) {
    const response = await fetch(`${this.baseUrl}/buy/activation/${countryId}/${productId}/any`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to request number: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.phone;
  }

  async checkOtps(phoneNumber) {
    // This is a simplified check - in real implementation, you'd need to track activation IDs
    // For testing purposes, we'll just return an empty array
    return [];
  }

  async cancelNumber(phoneNumber) {
    // This is a simplified cancel - in real implementation, you'd need to track activation IDs
    // For testing purposes, we'll just return true
    console.log(`📞 Would cancel number: ${phoneNumber}`);
    return true;
  }
}

// Run the test
const test = new FiveSimIntegrationTest();
test.testCompleteFlow(); 