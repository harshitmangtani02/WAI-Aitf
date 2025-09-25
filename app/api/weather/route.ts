import { NextRequest, NextResponse } from 'next/server';
import { analyzeUserQueryWithContext, getWeatherFromOpenMeteo } from '@/lib/weather';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || searchParams.get('city');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  console.log('🌤️ Weather API called with query:', query);

  try {
    // Step 1: Use enhanced context-aware query analysis
    const locationRequest = await analyzeUserQueryWithContext(query);
    
    // Step 2: Use extracted data to get weather from Open-Meteo
    const weatherData = await getWeatherFromOpenMeteo(locationRequest);
    
    console.log('✅ Weather API completed successfully');
    return NextResponse.json(weatherData);
    
  } catch (error) {
    console.error('❌ Weather API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}