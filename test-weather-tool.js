// Test the weather tool directly
import { executeWeatherTool } from './lib/weatherTools.js';

async function testWeatherTool() {
  console.log('🧪 Testing weather tool directly...\n');
  
  try {
    // Test 1: Basic location
    console.log('1. Testing: Varanasi today');
    const result1 = await executeWeatherTool({ location: 'Varanasi' });
    console.log('✅ Success:', result1.city, result1.temperature + '°C', result1.description);
    
    // Test 2: Location with date
    console.log('\n2. Testing: Tokyo tomorrow');
    const result2 = await executeWeatherTool({ location: 'Tokyo', date: 'tomorrow' });
    console.log('✅ Success:', result2.city, result2.temperature + '°C', result2.description, `(${result2.dateType})`);
    
    // Test 3: Historical
    console.log('\n3. Testing: London yesterday');
    const result3 = await executeWeatherTool({ location: 'London', date: 'yesterday' });
    console.log('✅ Success:', result3.city, result3.temperature + '°C', result3.description, `(${result3.dateType})`);
    
    console.log('\n🎉 Weather tool is working correctly!');
    
  } catch (error) {
    console.error('❌ Weather tool error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test OpenAI tool call format
function testToolCallFormat() {
  console.log('\n🔧 Testing tool call format...');
  
  const mockToolCall = {
    id: 'call_123',
    function: {
      name: 'get_weather',
      arguments: JSON.stringify({ location: 'Varanasi', date: 'tomorrow' })
    }
  };
  
  try {
    const args = JSON.parse(mockToolCall.function.arguments);
    console.log('✅ Tool arguments parsed:', args);
    console.log('   - Location:', args.location);
    console.log('   - Date:', args.date || 'today (default)');
  } catch (error) {
    console.error('❌ Tool call parsing error:', error);
  }
}

testWeatherTool();
testToolCallFormat();