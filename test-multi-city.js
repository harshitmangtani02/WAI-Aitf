// Test multi-city weather queries
const testMultiCity = async () => {
  const testQueries = [
    "What's the weather in Tokyo and San Francisco?",
    "Compare Mumbai today with London tomorrow",
    "Weather in Paris, Berlin, and Rome",
    "Tokyo vs New York weather comparison"
  ];

  for (const query of testQueries) {
    console.log(`\n🧪 Testing: "${query}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: query }
          ],
          language: 'en'
        })
      });

      const data = await response.json();
      console.log('✅ Response:', data.response);
      console.log('🛠️ Tool used:', data.toolUsed);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
};

testMultiCity();