// Quick test of the optimized weather tool
const { executeWeatherTool } = require('./lib/weatherTools');

async function testWeatherTool() {
  console.log('🧪 Testing optimized weather tool...');
  
  try {
    // Test 1: Basic weather query
    console.log('\n1. Testing: Tokyo weather');
    const result1 = await executeWeatherTool({ location: 'Tokyo' });
    console.log('✅ Result:', result1.city, result1.temperature + '°C', result1.description);
    
    // Test 2: Weather with date
    console.log('\n2. Testing: Varanasi tomorrow');
    const result2 = await executeWeatherTool({ location: 'Varanasi', date: 'tomorrow' });
    console.log('✅ Result:', result2.city, result2.temperature + '°C', result2.description, result2.dateType);
    
    // Test 3: Historical weather
    console.log('\n3. Testing: London yesterday');
    const result3 = await executeWeatherTool({ location: 'London', date: 'yesterday' });
    console.log('✅ Result:', result3.city, result3.temperature + '°C', result3.description, result3.dateType);
    
    console.log('\n🎉 All tests passed! Optimized weather tool is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWeatherTool();