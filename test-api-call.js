// Test the API endpoint directly
async function testChatAPI() {
  console.log('🧪 Testing /api/chat endpoint...\n');
  
  const testMessages = [
    {
      role: 'user',
      content: 'What is the weather in Varanasi?'
    }
  ];
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: testMessages,
        language: 'en'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ API Response:', result);
    console.log('   - Tool used:', result.toolUsed);
    console.log('   - Response:', result.response?.substring(0, 100) + '...');
    
    if (result.weatherData) {
      console.log('   - Weather data:', result.weatherData.city, result.weatherData.temperature + '°C');
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

// Test follow-up query
async function testFollowUpQuery() {
  console.log('\n🧪 Testing follow-up query...\n');
  
  const testMessages = [
    {
      role: 'user',
      content: 'What is the weather in Varanasi?'
    },
    {
      role: 'assistant',
      content: 'The weather in Varanasi today is 28°C with clear skies...'
    },
    {
      role: 'user',
      content: 'Tomorrow?'
    }
  ];
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: testMessages,
        language: 'en'
      })
    });
    
    const result = await response.json();
    console.log('✅ Follow-up Response:', result);
    console.log('   - Tool used:', result.toolUsed);
    console.log('   - Response:', result.response?.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ Follow-up test failed:', error.message);
  }
}

// Run tests if server is running
if (typeof fetch !== 'undefined') {
  testChatAPI();
  setTimeout(testFollowUpQuery, 2000);
} else {
  console.log('⚠️ Run this test in a browser or with node-fetch');
}