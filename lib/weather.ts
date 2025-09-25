import { contextManager, LocationData } from './contextManager';
import { sessionStore } from './sessionContext';

export interface WeatherData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  cloudCover: number;
  uvIndex: number;
  weatherCode: number;
  description: string;
}



// Weather code to description mapping for Open-Meteo
const weatherCodeDescriptions: { [key: number]: string } = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

// Country capitals mapping
const countryCapitals: { [key: string]: string } = {
  'united states': 'Washington, D.C.',
  'usa': 'Washington, D.C.',
  'us': 'Washington, D.C.',
  'united kingdom': 'London',
  'uk': 'London',
  'japan': 'Tokyo',
  'china': 'Beijing',
  'india': 'New Delhi',
  'germany': 'Berlin',
  'france': 'Paris',
  'italy': 'Rome',
  'spain': 'Madrid',
  'canada': 'Ottawa',
  'australia': 'Canberra',
  'brazil': 'Brasília',
  'russia': 'Moscow',
  'south korea': 'Seoul',
  'mexico': 'Mexico City',
  'netherlands': 'Amsterdam',
  'sweden': 'Stockholm',
  'norway': 'Oslo',
  'denmark': 'Copenhagen',
  'finland': 'Helsinki',
  'switzerland': 'Bern',
  'austria': 'Vienna',
  'belgium': 'Brussels',
  'portugal': 'Lisbon',
  'greece': 'Athens',
  'turkey': 'Ankara',
  'egypt': 'Cairo',
  'south africa': 'Cape Town',
  'argentina': 'Buenos Aires',
  'chile': 'Santiago',
  'colombia': 'Bogotá',
  'peru': 'Lima',
  'venezuela': 'Caracas',
  'thailand': 'Bangkok',
  'vietnam': 'Hanoi',
  'singapore': 'Singapore',
  'malaysia': 'Kuala Lumpur',
  'indonesia': 'Jakarta',
  'philippines': 'Manila',
  'new zealand': 'Wellington',
  'israel': 'Jerusalem',
  'saudi arabia': 'Riyadh',
  'uae': 'Abu Dhabi',
  'united arab emirates': 'Abu Dhabi',
  'poland': 'Warsaw',
  'czech republic': 'Prague',
  'hungary': 'Budapest',
  'romania': 'Bucharest',
  'bulgaria': 'Sofia',
  'croatia': 'Zagreb',
  'serbia': 'Belgrade',
  'ukraine': 'Kyiv',
  'belarus': 'Minsk',
  'lithuania': 'Vilnius',
  'latvia': 'Riga',
  'estonia': 'Tallinn'
};

// Simple fallback function to get location data directly
export async function getLocationData(cityName: string): Promise<LocationData> {
  // Get coordinates using geocoding API
  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
  );

  if (!geoResponse.ok) {
    throw new Error(`Geocoding API error: ${geoResponse.status}`);
  }

  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Location not found: ${cityName}`);
  }

  const location = geoData.results[0];

  return {
    city: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude
  };
}

export interface LocationRequest {
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  requestTime: string;
  targetDate?: string; // YYYY-MM-DD format
  dateType: 'current' | 'historical' | 'forecast';
}

export async function analyzeUserQueryWithContext(query: string, language: string = 'en', sessionId?: string): Promise<LocationRequest> {
  console.log('🔍 Analyzing user query with session context:', query);
  console.log('🌐 Query language:', language);
  console.log('🔑 Session ID:', sessionId || 'No session provided');

  // Get session context if available
  const session = sessionId ? sessionStore.getSession(sessionId) : null;
  const sessionContext = session?.context;

  // First, resolve implicit context using the context manager
  const contextResolution = contextManager.resolveImplicitContext(query, language);

  console.log('🧠 Context resolution result:', contextResolution);
  console.log('📊 Session context:', sessionContext ? 'Available' : 'Not available');

  // Check if we have location from session context
  const hasLocationFromSession = sessionContext?.location.current !== null;
  
  // Be more permissive - let OpenAI handle location detection like the original system
  // Only throw error if it's a very short query with no context
  const isVeryShortQuery = query.trim().length < 8;
  const hasLocationIndicators = language === 'ja'
    ? /の天気|で|に|天気|気温|湿度/.test(query)
    : /weather|temperature|in |at |for |climate/.test(query.toLowerCase());

  // Only ask for location if query is very short, has no location indicators, and no session context
  if (isVeryShortQuery && !hasLocationIndicators && !hasLocationFromSession) {
    const error = new Error(language === 'ja' 
      ? 'どちらの場所の天気を知りたいですか？' 
      : 'Which location would you like to know the weather for?');
    (error as any).missingInfo = true;
    throw error;
  }

  if (contextResolution.needsTimeInput) {
    const error = new Error(language === 'ja'
      ? 'いつの天気を知りたいですか？（今日、明日、昨日など）'
      : 'When would you like to know the weather for? (today, tomorrow, yesterday, etc.)');
    (error as any).missingInfo = true;
    throw error;
  }

  // Use the enhanced contextual query for better AI analysis
  const enhancedQuery = contextResolution.contextualQuery;
  console.log('📝 Enhanced query:', enhancedQuery);

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not found');
  }

  try {
    // Get current context summary for AI (use session context if available)
    const contextSummary = sessionContext ?
      `Current Context:
- Location: ${sessionContext.location.current ? `${sessionContext.location.current.city}, ${sessionContext.location.current.country}` : 'Not set'}
- Timeframe: ${sessionContext.temporal.currentTimeframe}${sessionContext.temporal.targetDate ? ` (${sessionContext.temporal.targetDate})` : ''}
- Last Query: ${sessionContext.conversation.lastWeatherQuery || 'None'}
- Intent: ${sessionContext.conversation.queryIntent}
- Recent Locations: ${sessionContext.location.recent.slice(0, 3).map(l => l.city).join(', ') || 'None'}
- Session: ${sessionContext.session.messageCount} messages` :
      contextManager.getContextSummary();

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
            content: `You are a multilingual location and time analyzer with enhanced context awareness. Analyze the user's query (in ${language === 'ja' ? 'Japanese' : 'English'}) and extract location and date information.

ENHANCED CONTEXT INFORMATION:
${contextSummary}

RESOLVED CONTEXT FROM SESSION:
- Location: ${sessionContext?.location.current ? `${sessionContext.location.current.city}, ${sessionContext.location.current.country}` : 'None'}
- Timeframe: ${sessionContext?.temporal.currentTimeframe || 'current'}
- Target Date: ${sessionContext?.temporal.targetDate || 'None'}

CONTEXT MANAGER FALLBACK:
- Location: ${contextResolution.location ? `${contextResolution.location.city}, ${contextResolution.location.country}` : 'None'}
- Timeframe: ${contextResolution.temporal.currentTimeframe}
- Enhanced Query: ${enhancedQuery}

IMPORTANT: If the user query is ambiguous (like "tomorrow?", "how about yesterday?", "what about there?"), use the SESSION CONTEXT information above to resolve the location and timeframe. The session context represents the user's current conversation state.

Return ONLY a JSON object with the following format:

{
  "city": "City Name or null",
  "country": "Country Name or null", 
  "latitude": 0.0,
  "longitude": 0.0,
  "timezone": "timezone_identifier",
  "requestTime": "current_time_iso",
  "targetDate": "YYYY-MM-DD or null",
  "dateType": "current|historical|forecast",
  "missingInfo": "location|time|none",
  "errorMessage": "user-friendly message in ${language === 'ja' ? 'Japanese' : 'English'} or null"
}

CURRENT DATE: ${new Date().toISOString().split('T')[0]} (Use this as TODAY's date for relative date calculations)

DYNAMIC DATE CALCULATION HELPER:
const today = new Date();
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayBeforeYesterday = new Date(today); dayBeforeYesterday.setDate(today.getDate() - 2);
const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(today.getDate() + 2);

Use these calculations to determine the exact dates for relative terms.

Date Analysis Rules (${language === 'ja' ? 'Japanese' : 'English'}):
IMPORTANT: Calculate dates dynamically based on TODAY's date!

CRITICAL RULES:
1. If ONLY location is mentioned (no date/time) AND no previous date context: use dateType: "current", targetDate: null
2. If ONLY location is mentioned (no date/time) AND previous date exists: use the previous date and dateType
3. If ONLY date is mentioned (no location) AND previous location exists: use previous location
4. For specific dates like "10th October", "December 25th", assume CURRENT YEAR (2025) unless specified otherwise
5. Compare the target date with today's date to determine if it's "historical" (past) or "forecast" (future)
6. FORECAST LIMIT: Weather forecasts are only available up to 16 days in the future. If a date is more than 16 days from today, return an error.

${language === 'ja' ? `
- "今日", "本日", "現在" -> dateType: "current", targetDate: null
- "昨日", "きのう" -> dateType: "historical", targetDate: [TODAY - 1 day]
- "明日", "あした", "あす" -> dateType: "forecast", targetDate: [TODAY + 1 day]  
- "一昨日", "おととい" -> dateType: "historical", targetDate: [TODAY - 2 days]
- "明後日", "あさって" -> dateType: "forecast", targetDate: [TODAY + 2 days]
- "10月10日", "12月25日" -> Use 2025 as year, determine if historical/forecast based on current date
- Location only (no date) -> dateType: "current", targetDate: null
- Date only (no location) -> Use previous location if available
` : `
- "today", "now", "current" -> dateType: "current", targetDate: null
- "yesterday" -> dateType: "historical", targetDate: [TODAY - 1 day]
- "tomorrow" -> dateType: "forecast", targetDate: [TODAY + 1 day]
- "day before yesterday" -> dateType: "historical", targetDate: [TODAY - 2 days]  
- "day after tomorrow" -> dateType: "forecast", targetDate: [TODAY + 2 days]
- "10th October", "December 25th", "Oct 10" -> Use 2025 as year, determine if historical/forecast based on current date
- Location only (no date) -> dateType: "current", targetDate: null
- Date only (no location) -> Use previous location if available
`}

CALCULATION EXAMPLES (today is ${new Date().toISOString().split('T')[0]}):
- "yesterday" = "${new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]}"
- "tomorrow" = "${new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}"
- "day before yesterday" = "${new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0]}"
- "day after tomorrow" = "${new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0]}"
- "10th October" = "2025-10-10" (assume current year 2025)
- "December 25th" = "2025-12-25" (assume current year 2025)
- "March 15" = "2025-03-15" (assume current year 2025)

Location Rules:
- If country mentioned instead of city, use the capital city
- Use approximate coordinates for major cities
- Use proper timezone identifiers (e.g., "America/New_York", "Asia/Tokyo")
- If no location found AND no previous location context, set city to null and missingInfo to "location"
- If previous location exists and current query has no location, use the previous location

Missing Information Handling:
- If location is missing AND no previous location: missingInfo: "location", errorMessage: "${language === 'ja' ? 'どちらの場所の天気を知りたいですか？' : 'Which location would you like to know the weather for?'}"
- If time is ambiguous but location exists: missingInfo: "time", errorMessage: "${language === 'ja' ? 'いつの天気を知りたいですか？（今日、明日、昨日など）' : 'When would you like to know the weather for? (today, tomorrow, yesterday, etc.)'}"
- If both clear: missingInfo: "none", errorMessage: null

Examples with Context Resolution:
${sessionContext?.location.current ? `
LOCATION CONTEXT EXAMPLES (using session context):
- Previous: "${sessionContext.location.current.city}", Current: "tomorrow" -> Use ${sessionContext.location.current.city} with tomorrow's date
- Previous: "${sessionContext.location.current.city}", Current: "yesterday" -> Use ${sessionContext.location.current.city} with yesterday's date
- Previous: "${sessionContext.location.current.city}", Current: "how about 10th October" -> Use ${sessionContext.location.current.city} with "2025-10-10"
- Previous: "${sessionContext.location.current.city}", Current: "what about December 25th" -> Use ${sessionContext.location.current.city} with "2025-12-25"
- Previous: "${sessionContext.location.current.city}", Current: "明日" -> Use ${sessionContext.location.current.city} with tomorrow's date
- Previous: "${sessionContext.location.current.city}", Current: "10月10日はどう？" -> Use ${sessionContext.location.current.city} with "2025-10-10"
- Previous: "${sessionContext.location.current.city}", Current: "Tomorrow?" -> Use ${sessionContext.location.current.city} with tomorrow's date and dateType: "forecast"
- Previous: "${sessionContext.location.current.city}", Current: "How about tomorrow?" -> Use ${sessionContext.location.current.city} with tomorrow's date and dateType: "forecast"
` : ''}

${sessionContext?.temporal.targetDate ? `
DATE CONTEXT EXAMPLES (using session context):
- Previous date: "${sessionContext.temporal.targetDate}" (${sessionContext.temporal.currentTimeframe}), Current: "Paris" -> Use Paris with "${sessionContext.temporal.targetDate}" and dateType: "${sessionContext.temporal.currentTimeframe}"
- Previous date: "${sessionContext.temporal.targetDate}" (${sessionContext.temporal.currentTimeframe}), Current: "Tokyo weather" -> Use Tokyo with "${sessionContext.temporal.targetDate}" and dateType: "${sessionContext.temporal.currentTimeframe}"
- Previous date: "${sessionContext.temporal.targetDate}" (${sessionContext.temporal.currentTimeframe}), Current: "how about London" -> Use London with "${sessionContext.temporal.targetDate}" and dateType: "${sessionContext.temporal.currentTimeframe}"
` : ''}

SPECIFIC EXAMPLES:
${language === 'ja' ? `
- "東京の天気" (location only) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": null, "dateType": "current", "missingInfo": "none", "errorMessage": null}
- "明日" (with previous location Tokyo) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-09-25", "dateType": "forecast", "missingInfo": "none", "errorMessage": null}
- "10月10日はどう？" (with previous location Tokyo) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-10-10", "dateType": "forecast", "missingInfo": "none", "errorMessage": null}
- "天気はどう？" -> {"city": null, "country": null, "latitude": null, "longitude": null, "timezone": null, "requestTime": "2025-09-24T12:00:00Z", "targetDate": null, "dateType": "current", "missingInfo": "location", "errorMessage": "どちらの場所の天気を知りたいですか？"}
` : `
- "weather in Tokyo" (location only) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": null, "dateType": "current", "missingInfo": "none", "errorMessage": null}
- "tomorrow" (with previous location Tokyo) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-09-25", "dateType": "forecast", "missingInfo": "none", "errorMessage": null}
- "how about 10th October" (with previous location Tokyo) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-10-10", "dateType": "forecast", "missingInfo": "none", "errorMessage": null}
- "what's the weather like?" -> {"city": null, "country": null, "latitude": null, "longitude": null, "timezone": null, "requestTime": "2025-09-24T12:00:00Z", "targetDate": null, "dateType": "current", "missingInfo": "location", "errorMessage": "Which location would you like to know the weather for?"}
`}
ADDITIONAL EXAMPLES:
- "weather in Tokyo today" -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": null, "dateType": "current"}
- "Tokyo" (location only, no date, no previous date) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": null, "dateType": "current"}
- "Tokyo" (location only, with previous date 2025-10-10 forecast) -> {"city": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-10-10", "dateType": "forecast"}
- "weather in Paris tomorrow" -> {"city": "Paris", "country": "France", "latitude": 48.8566, "longitude": 2.3522, "timezone": "Europe/Paris", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-09-25", "dateType": "forecast"}
- "weather in London yesterday" -> {"city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "timezone": "Europe/London", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-09-23", "dateType": "historical"}
- "weather in New York on December 25th" -> {"city": "New York", "country": "USA", "latitude": 40.7128, "longitude": -74.0060, "timezone": "America/New_York", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-12-25", "dateType": "forecast"}
- "December 25th" (with previous location New York) -> {"city": "New York", "country": "USA", "latitude": 40.7128, "longitude": -74.0060, "timezone": "America/New_York", "requestTime": "2025-09-24T12:00:00Z", "targetDate": "2025-12-25", "dateType": "forecast"}

FORECAST LIMIT VALIDATION:
- If a forecast date is more than 16 days from today, return: {"missingInfo": "time", "errorMessage": "Weather forecasts are only available up to 16 days in the future. Please choose a date within the next 16 days."}`
          },
          {
            role: 'user',
            content: enhancedQuery
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    console.log('🤖 OpenAI response:', aiResponse);

    let locationData;
    try {
      locationData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse);
      throw new Error('Could not parse location data from AI response');
    }

    // Check if AI couldn't identify a location and handle missing info
    if (locationData.missingInfo === 'location' || !locationData.city || locationData.city === null) {
      console.log('⚠️ No location identified in query');
      const error = new Error(locationData.errorMessage || 'No location identified in query');
      (error as any).missingInfo = true;
      throw error;
    }

    console.log('✅ Location identified:', {
      city: locationData.city,
      country: locationData.country,
      lat: locationData.latitude,
      lng: locationData.longitude,
      timezone: locationData.timezone
    });

    // Validate that we have numeric coordinates
    if (typeof locationData.latitude !== 'number' || typeof locationData.longitude !== 'number') {
      console.error('❌ Invalid coordinate types:', typeof locationData.latitude, typeof locationData.longitude);
      throw new Error('Invalid coordinate types received from AI');
    }

    // Update context manager with the resolved location and temporal info
    const resolvedLocationData: LocationData = {
      city: locationData.city,
      country: locationData.country || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timezone: locationData.timezone,
      confidence: 1.0
    };

    contextManager.updateLocation(resolvedLocationData);
    contextManager.updateTemporalContext(
      locationData.dateType || 'current',
      locationData.targetDate || undefined,
      contextResolution.temporal.relativeDateContext
    );

    return {
      city: locationData.city,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timezone: locationData.timezone,
      requestTime: locationData.requestTime,
      targetDate: locationData.targetDate || null,
      dateType: locationData.dateType || 'current'
    };
  } catch (error) {
    console.error('❌ Error in analyzeUserQuery:', error);
    throw error;
  }
}

export async function getWeatherFromOpenMeteo(locationRequest: LocationRequest): Promise<any> {
  console.log('🌤️ Fetching weather data from Open-Meteo for:', locationRequest.city);
  console.log('📍 Coordinates:', locationRequest.latitude, locationRequest.longitude);
  console.log('📅 Date type:', locationRequest.dateType, 'Target date:', locationRequest.targetDate);

  // Validate coordinates
  if (!locationRequest.latitude || !locationRequest.longitude) {
    throw new Error('Invalid coordinates provided');
  }

  if (Math.abs(locationRequest.latitude) > 90 || Math.abs(locationRequest.longitude) > 180) {
    throw new Error('Coordinates out of valid range');
  }

  // Validate forecast date limits
  if (locationRequest.dateType === 'forecast' && locationRequest.targetDate) {
    const today = new Date();
    const targetDate = new Date(locationRequest.targetDate);
    const daysDifference = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    console.log('📊 Days difference for forecast:', daysDifference);

    if (daysDifference > 16) {
      const error = new Error('Weather forecasts are only available up to 16 days in the future. Please choose a date within the next 16 days.');
      (error as any).forecastLimitExceeded = true;
      throw error;
    }

    if (daysDifference < 0) {
      console.log('⚠️ Target date is in the past, switching to historical data');
      locationRequest.dateType = 'historical';
    }
  }

  let url: string;
  let params: URLSearchParams;

  if (locationRequest.dateType === 'historical' && locationRequest.targetDate) {
    // Historical weather data
    console.log('📜 Fetching historical weather data');
    params = new URLSearchParams({
      latitude: locationRequest.latitude.toString(),
      longitude: locationRequest.longitude.toString(),
      start_date: locationRequest.targetDate,
      end_date: locationRequest.targetDate,
      daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,precipitation_sum,wind_speed_10m_max,uv_index_max,weather_code',
      timezone: 'auto'
    });
    url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;

  } else if (locationRequest.dateType === 'forecast' && locationRequest.targetDate) {
    // Future forecast data
    console.log('🔮 Fetching forecast weather data');
    params = new URLSearchParams({
      latitude: locationRequest.latitude.toString(),
      longitude: locationRequest.longitude.toString(),
      start_date: locationRequest.targetDate,
      end_date: locationRequest.targetDate,
      daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,precipitation_sum,wind_speed_10m_max,uv_index_max,weather_code',
      timezone: 'auto'
    });
    url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  } else {
    // Current weather data
    console.log('⏰ Fetching current weather data');
    params = new URLSearchParams({
      latitude: locationRequest.latitude.toString(),
      longitude: locationRequest.longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,uv_index,weather_code',
      timezone: 'auto'
    });
    url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  }

  console.log('🔗 Open-Meteo API URL:', url);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Open-Meteo API error:', response.status);
    console.error('❌ Error response:', errorText);
    throw new Error(`Open-Meteo API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('📊 Raw weather data from Open-Meteo:', JSON.stringify(data, null, 2));

  let weatherData: any;

  if (locationRequest.dateType === 'historical' || locationRequest.dateType === 'forecast') {
    // Handle daily data for historical/forecast
    const daily = data.daily;
    if (!daily || !daily.time || daily.time.length === 0) {
      throw new Error('No weather data available for the requested date');
    }

    const dayIndex = 0; // First (and only) day since we query single date
    weatherData = {
      city: locationRequest.city,
      latitude: locationRequest.latitude,
      longitude: locationRequest.longitude,
      timezone: data.timezone,
      dateType: locationRequest.dateType,
      targetDate: locationRequest.targetDate,
      temperature: Math.round((daily.temperature_2m_max[dayIndex] + daily.temperature_2m_min[dayIndex]) / 2),
      temperatureMax: Math.round(daily.temperature_2m_max[dayIndex]),
      temperatureMin: Math.round(daily.temperature_2m_min[dayIndex]),
      humidity: daily.relative_humidity_2m_max[dayIndex],
      windSpeed: daily.wind_speed_10m_max[dayIndex],
      precipitation: daily.precipitation_sum[dayIndex],
      uvIndex: daily.uv_index_max[dayIndex],
      weatherCode: daily.weather_code[dayIndex],
      description: weatherCodeDescriptions[daily.weather_code[dayIndex]] || 'Unknown',
      timestamp: daily.time[dayIndex]
    };
  } else {
    // Handle current weather data
    const current = data.current;
    weatherData = {
      city: locationRequest.city,
      latitude: locationRequest.latitude,
      longitude: locationRequest.longitude,
      timezone: data.timezone,
      dateType: locationRequest.dateType,
      targetDate: null,
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      cloudCover: current.cloud_cover,
      uvIndex: current.uv_index,
      weatherCode: current.weather_code,
      description: weatherCodeDescriptions[current.weather_code] || 'Unknown',
      timestamp: current.time
    };
  }

  console.log('✅ Processed weather data:', weatherData);
  return weatherData;
}

// Server-side context extraction from client context summary
function extractContextFromSummary(contextSummary: string): {
  currentLocation: { city: string; country: string } | null;
  currentTimeframe: string;
  targetDate: string | null;
} {
  if (!contextSummary) {
    return { currentLocation: null, currentTimeframe: 'current', targetDate: null };
  }

  // Extract location from context summary
  const locationMatch = contextSummary.match(/Location: ([^,]+), ([^\n-]+)/);
  const currentLocation = locationMatch ? { city: locationMatch[1].trim(), country: locationMatch[2].trim() } : null;

  // Extract timeframe and date
  const timeframeMatch = contextSummary.match(/Timeframe: (\w+)(?:\s*\(([^)]+)\))?/);
  const currentTimeframe = timeframeMatch ? timeframeMatch[1] : 'current';
  const targetDate = timeframeMatch && timeframeMatch[2] ? timeframeMatch[2] : null;

  console.log('🔍 Extracted context:', { currentLocation, currentTimeframe, targetDate });

  return { currentLocation, currentTimeframe, targetDate };
}

// Legacy function for backward compatibility
export async function analyzeUserQuery(query: string, language: string = 'en', previousLocation: string | null = null, previousDate: { targetDate: string; dateType: 'historical' | 'forecast' } | null = null): Promise<LocationRequest> {
  console.log('⚠️ Using legacy analyzeUserQuery - consider upgrading to analyzeUserQueryWithContext');
  return analyzeUserQueryWithContext(query, language);
}

export async function formatWeatherResponseWithContext(weatherData: any, originalQuery: string, language: string = 'en'): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not found');
  }

  console.log('🎨 Formatting weather response with enhanced context...');
  console.log('📝 Original query:', originalQuery);
  console.log('🌍 Language:', language);

  // Get conversation context for better response formatting
  const conversationContext = contextManager.getConversationContext();
  const contextSummary = contextManager.getContextSummary();
  const userPreferences = contextManager.getPreferences();

  try {
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
            content: `You are a weather and lifestyle assistant with enhanced context awareness. Format the weather data into a comprehensive response with fashion and travel recommendations.

WEATHER DATA PROVIDED:
${JSON.stringify(weatherData, null, 2)}

ENHANCED CONTEXT:
${contextSummary}

USER PREFERENCES:
- Language: ${language}
- Detail Level: ${userPreferences.detailLevel}
- Units: ${userPreferences.units}

CONVERSATION CONTEXT:
- Query Intent: ${conversationContext.queryIntent}
- Last Query: ${conversationContext.lastWeatherQuery}
- Follow-up Context: ${conversationContext.followUpContext || 'None'}

FORMATTING RULES:
1. Start with "Weather Summary" (NO stars or special characters in heading)
2. Use ${userPreferences.detailLevel} level of detail
3. Tailor response to query intent: ${conversationContext.queryIntent}
4. Include specific temperature, humidity, wind, and precipitation details
5. Provide fashion recommendations (clothing, materials, accessories) based on weather
6. Suggest activities and travel advice appropriate for conditions
7. Give practical tips based on UV index, weather conditions
8. If historical: use past tense ("was", "had")
9. If forecast: mention it's a prediction ("expected", "likely")
10. If this is a follow-up question, reference previous context appropriately
11. Keep the response focused and actionable

INTENT-SPECIFIC FORMATTING:
- weather: Focus on current conditions and immediate recommendations
- clothing: Emphasize fashion and outfit suggestions
- travel: Highlight travel conditions and outdoor activity advice
- comparison: Compare with previous queries or dates if context available
- general: Provide balanced overview

Language: Respond in ${language === 'ja' ? 'Japanese' : 'English'}

IMPORTANT: Do NOT use stars (**) or special formatting characters in headings. Use plain text only.

Make it conversational, helpful, and specific to the weather conditions, time context, and user's query intent.`
          },
          {
            role: 'user',
            content: originalQuery
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI formatting error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const formattedResponse = data.choices[0].message.content.trim();

    // Update conversation context with the response
    contextManager.updateConversationContext(originalQuery, conversationContext.queryIntent, formattedResponse);

    console.log('✅ Formatted response with enhanced context');
    return formattedResponse;
  } catch (error) {
    console.error('❌ Error in formatWeatherResponseWithContext:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function formatWeatherResponse(weatherData: any, originalQuery: string, language: string = 'en'): Promise<string> {
  console.log('⚠️ Using legacy formatWeatherResponse - consider upgrading to formatWeatherResponseWithContext');
  return formatWeatherResponseWithContext(weatherData, originalQuery, language);
}