import { NextRequest, NextResponse } from 'next/server';
import { weatherTool, executeWeatherTool, WeatherToolParams } from '@/lib/weatherTools';





export async function POST(req: NextRequest) {
  const { messages, language = 'en' } = await req.json();

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json({ error: 'OpenAI API key not found' }, { status: 500 });
  }

  const lastMessage = messages[messages.length - 1];
  console.log('💬 Optimized chat API called with:', lastMessage?.content);
  console.log('🌐 Language:', language);
  console.log('📚 Total messages:', messages.length);

  if (lastMessage && lastMessage.role === 'user') {
    // Let OpenAI decide if it needs to use weather tools - no pre-filtering
    // This allows for natural follow-up questions like "tomorrow?" after discussing a city

    try {
      console.log('🚀 Starting optimized weather workflow with tool calling...');

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

IMPORTANT: Today's date is ${new Date().toISOString().split('T')[0]} (${new Date().getFullYear()}). Always use current year dates unless explicitly specified otherwise.

You have access to a weather tool that can get current weather, forecasts, and historical weather data for any city worldwide.

When users ask about weather:
1. Use the get_weather tool to fetch weather data
2. For dates without years, ALWAYS assume the current year (${new Date().getFullYear()})
3. Provide comprehensive weather information
4. Include fashion recommendations based on the weather
5. Suggest activities and travel advice
6. Be conversational and helpful

Date handling rules:
- "today" = current weather
- "tomorrow" = forecast for next day
- "yesterday" = historical data for previous day
- "January 15" = January 15, ${new Date().getFullYear()} (current year)
- "12-25" = December 25, ${new Date().getFullYear()} (current year)

Respond in ${language === 'ja' ? 'Japanese' : 'English'}.

For follow-up questions like "tomorrow?" or "how about yesterday?", remember the previous location context from the conversation.`},
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

      // Check if OpenAI wants to call weather tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🛠️ OpenAI requested ${message.tool_calls.length} tool call(s)`);

        try {
          // Execute all tool calls in parallel for better performance
          const toolResults = await Promise.all(
            message.tool_calls.map(async (toolCall) => {
              console.log('🔧 Executing tool:', toolCall.function.name);
              const toolArgs: WeatherToolParams = JSON.parse(toolCall.function.arguments);
              console.log('📋 Tool arguments:', toolArgs);
              
              const result = await executeWeatherTool(toolArgs);
              return {
                tool_call_id: toolCall.id,
                result
              };
            })
          );

          console.log(`✅ Executed ${toolResults.length} tool calls successfully`);

          // Send all tool results back to OpenAI for final formatting
          const toolMessages = toolResults.map(({ tool_call_id, result }) => ({
            role: 'tool' as const,
            tool_call_id,
            content: JSON.stringify(result)
          }));

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
- For multiple cities: create clear comparisons and highlight differences
- Start with a weather summary for each location
- Include temperature, conditions, humidity, wind, and precipitation
- Provide clothing recommendations based on the weather
- Suggest activities appropriate for the conditions
- Give practical tips (umbrella, sunscreen, etc.)
- Be conversational and helpful
- If historical data: use past tense
- If forecast data: mention it's a prediction
- For comparisons: highlight which city is warmer/cooler, wetter/drier, etc.

Respond in ${language === 'ja' ? 'Japanese' : 'English'}.`
                },
                ...messages,
                message, // Include the assistant's tool call message
                ...toolMessages // Include all tool results
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
            weatherData: toolResults.map(r => r.result),
            toolsUsed: toolResults.length,
            multiCity: toolResults.length > 1
          });

        } catch (toolError) {
          console.error('❌ Tool execution error:', toolError);

          // Return error message to user
          const errorMessage = language === 'ja'
            ? `申し訳ございませんが、天気情報を取得できませんでした。別の都市名をお試しください。`
            : `Sorry, I couldn't get weather information. Please try different city names.`;

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

  // If no valid message, return default response
  const defaultMessage = language === 'ja'
    ? 'こんにちは！天気や旅行、ファッションについて何でもお聞きください。'
    : 'Hello! Ask me anything about weather, travel, or fashion recommendations.';

  return NextResponse.json({
    response: defaultMessage,
    toolUsed: false
  });
}