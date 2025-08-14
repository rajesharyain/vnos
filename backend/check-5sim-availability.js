// Using built-in fetch (available in Node.js 18+)
require('dotenv').config();

class FiveSimAvailabilityChecker {
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

  async checkAllCountries() {
    console.log('🌍 Checking 5SIM availability for all countries...\n');
    
    try {
      // Step 1: Get all available countries
      console.log('1️⃣ Fetching all available countries...');
      const countries = await this.getAvailableCountries();
      console.log(`✅ Found ${countries.length} countries\n`);

      // Step 2: Check each country for free numbers
      console.log('2️⃣ Checking each country for free numbers...\n');
      const results = [];
      
      for (const country of countries) {
        try {
          console.log(`🔍 Checking ${country.name} (${country.id})...`);
          const availability = await this.checkCountryAvailability(country.id);
          results.push({
            country: country.name,
            id: country.id,
            ...availability
          });
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.log(`❌ Error checking ${country.name}: ${error.message}`);
          results.push({
            country: country.name,
            id: country.id,
            hasFreeNumbers: false,
            error: error.message
          });
        }
      }

      // Step 3: Display results
      console.log('\n📊 RESULTS SUMMARY:\n');
      this.displayResults(results);

      // Step 4: Show recommendations
      console.log('\n💡 RECOMMENDATIONS:\n');
      this.showRecommendations(results);

    } catch (error) {
      console.error('❌ Error during availability check:', error.message);
    }
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

  async checkCountryAvailability(countryId) {
    try {
      // Try to get a free number with "any" operator and a common product
      const testProducts = ['virtual21', 'virtual4', 'virtual58', 'facebook', 'google'];
      
      for (const product of testProducts) {
        try {
          const response = await fetch(`${this.baseUrl}/user/buy/activation/${countryId}/any/${product}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
          });

          if (response.ok) {
            const responseText = await response.text();
            
            if (responseText === 'no free phones') {
              // This product has no free numbers, try next
              continue;
            }
            
            if (responseText === 'bad country' || responseText === 'bad product') {
              // Invalid combination, try next
              continue;
            }
            
            // Try to parse as JSON to see if we got a number
            try {
              const result = JSON.parse(responseText);
              if (result.phone && result.id) {
                // We got a number! Cancel it immediately to avoid charges
                await this.cancelNumber(result.id);
                
                return {
                  hasFreeNumbers: true,
                  workingProduct: product,
                  message: `Free numbers available with product: ${product}`,
                  sampleNumber: result.phone
                };
              }
            } catch (parseError) {
              // Not JSON, continue to next product
              continue;
            }
          }
        } catch (error) {
          // Product not available, continue to next
          continue;
        }
      }
      
      // No free numbers found with any product
      return {
        hasFreeNumbers: false,
        message: 'No free numbers available with any tested product'
      };
      
    } catch (error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  async cancelNumber(activationId) {
    try {
      const response = await fetch(`${this.baseUrl}/user/cancel/${activationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (response.ok) {
        console.log(`    ✅ Cancelled test number (ID: ${activationId})`);
      } else {
        console.log(`    ⚠️  Failed to cancel test number (ID: ${activationId})`);
      }
    } catch (error) {
      console.log(`    ⚠️  Error cancelling test number: ${error.message}`);
    }
  }

  displayResults(results) {
    const available = results.filter(r => r.hasFreeNumbers);
    const unavailable = results.filter(r => !r.hasFreeNumbers);
    
    console.log(`✅ Countries with FREE numbers: ${available.length}`);
    console.log(`❌ Countries without free numbers: ${unavailable.length}\n`);
    
    if (available.length > 0) {
      console.log('🎯 COUNTRIES WITH FREE NUMBERS:');
      console.log('=' .repeat(50));
      available.forEach(result => {
        console.log(`🌍 ${result.country} (${result.id})`);
        console.log(`   📱 Product: ${result.workingProduct}`);
        console.log(`   📞 Sample: ${result.sampleNumber}`);
        console.log(`   💬 ${result.message}`);
        console.log('');
      });
    }
    
    if (unavailable.length > 0) {
      console.log('🚫 COUNTRIES WITHOUT FREE NUMBERS:');
      console.log('=' .repeat(50));
      unavailable.forEach(result => {
        console.log(`🌍 ${result.country} (${result.id})`);
        if (result.error) {
          console.log(`   ❌ Error: ${result.error}`);
        } else {
          console.log(`   💬 ${result.message}`);
        }
        console.log('');
      });
    }
  }

  showRecommendations(results) {
    const available = results.filter(r => r.hasFreeNumbers);
    
    if (available.length === 0) {
      console.log('❌ No countries have free numbers available.');
      console.log('💡 Consider:');
      console.log('   - Adding funds to your 5SIM account');
      console.log('   - Checking different products');
      console.log('   - Using different operators');
      return;
    }
    
    console.log('🎯 For development/testing, try these countries:');
    available.slice(0, 5).forEach(result => {
      console.log(`   🌍 ${result.country} with product: ${result.workingProduct}`);
    });
    
    console.log('\n💡 Tips:');
    console.log('   - Free numbers are limited and may run out quickly');
    console.log('   - Test with "any" operator for best availability');
    console.log('   - Cancel numbers immediately after testing');
    console.log('   - Monitor your 5SIM balance');
  }
}

// Run the availability check
const checker = new FiveSimAvailabilityChecker();
checker.checkAllCountries(); 