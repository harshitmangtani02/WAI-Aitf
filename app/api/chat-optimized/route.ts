import { NextRequest, NextResponse } from 'next/server';
import { weatherTool, executeWeatherTool, WeatherToolParams } from '@/lib/weatherTools';

// Optimized chat API using OpenAI Tool Calling
// Reduces from 3 API calls to 1

export async function POST(req: NextRequest) {
  const { messages, language = 'en' } = await req.json();
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json({ error: 'OpenAI API key not found' }, { status: 500 });
  }
  
  const lastMessage = messages[messages.length - 1];
  console.log('💬 Optimized chat API called with:', lastMessage?.content);
  console.log('🌐 Language:', language);
  
  try {
    // Single OpenAI call with tool calling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful weather assistant that provides weather information with fashion and travel recommendations. 

You have access to a weather tool that can get current weather, forecasts, and historical weather data for any city worldwide.

When users ask about weather:
1. Use the get_weather tool to fetch weather data
2. Provide comprehensive weather information
3. Include fashion recommendations based on the weather
4. Suggest activities and travel advice
5. Be conversational and helpful

Respond in ${language === 'ja' ? 'Japanese' : 'English'}.

For follow-up questions like "tomorrow?" or "how about yesterday?", remember the previous location context from the conversation.`
          },
          ...messages
        ],
        tools: [weatherTool],
        tool_choice: 'auto',
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const completion = await response.json();
    const message = completion.choices[0].message;

    // Check if OpenAI wants to call the weather tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('🛠️ OpenAI requested tool call:', message.tool_calls[0].function.name);
      
      const toolCall = message.tool_calls[0];
      const toolArgs: WeatherToolParams = JSON.parse(toolCall.function.arguments);
      
      console.log('📋 Tool arguments:', toolArgs);
      
      try {
        // Execute the weather tool
        const weatherResult = await executeWeatherTool(toolArgs);
        
        // Send the tool result back to OpenAI for final formatting
        const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a helpful weather assistant. Format the weather data into a comprehensive response with fashion and travel recommendations.

FORMATTING GUIDELINES:
- Start with a clear weather summary
- Include temperature, conditions, humidity, wind, and precipitation
- Provide clothing recommendations based on the weather
- Suggest activities appropriate for the conditions
- Give practical tips (umbrella, sunscreen, etc.)
- Be conversational and helpful
- If historical data: use past tense
- If forecast data: mention it's a prediction

Respond in ${language === 'ja' ? 'Japanese' : 'English'}.`
              },
              ...messages,
              message, // Include the assistant's tool call message
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(weatherResult)
              }
            ],
            temperature: 0.7
          })
        });

        if (!finalResponse.ok) {
          throw new Error(`OpenAI final response error: ${finalResponse.status}`);
        }

        const finalCompletion = await finalResponse.json();
        const finalMessage = finalCompletion.choices[0].message.content;

        console.log('✅ Optimized weather response generated');
        
        return NextResponse.json({
          response: finalMessage,
          weatherData: weatherResult,
          toolUsed: true
        });

      } catch (toolError) {
        console.error('❌ Tool execution error:', toolError);
        
        // Return error message to user
        const errorMessage = language === 'ja' 
          ? `申し訳ございませんが、${toolArgs.location}の天気情報を取得できませんでした。別の都市名をお試しください。`
          : `Sorry, I couldn't get weather information for ${toolArgs.location}. Please try a different city name.`;
          
        return NextResponse.json({
          response: errorMessage,
          error: true
        });
      }
    } else {
      // No tool call needed, return direct response
      console.log('💬 Direct response (no tool needed)');
      
      return NextResponse.json({
        response: message.content,
        toolUsed: false
      });
    }

  } catch (error) {
    console.error('❌ Optimized chat API error:', error);
    
    const fallbackMessage = language === 'ja'
      ? 'すみません、エラーが発生しました。もう一度お試しください。'
      : 'Sorry, an error occurred. Please try again.';
      
    return NextResponse.json({
      response: fallbackMessage,
      error: true
    }, { status: 500 });
  }
}