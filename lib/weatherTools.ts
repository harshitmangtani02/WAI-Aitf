// Optimized weather system using OpenAI Tool Calling
// Reduces 3 API calls to 1

export interface WeatherToolParams {
  location: string;
  date?: string;
}

export interface WeatherToolResponse {
  city: string;
  country: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
  timestamp: string;
  dateType: 'current' | 'historical' | 'forecast';
  targetDate?: string;
}

// Weather tool definition for OpenAI
export const weatherTool = {
  type: "function" as const,
  function: {
    name: "get_weather",
    description: "Get current weather, forecast, or historical weather data for any city worldwide. Supports natural language dates like 'today', 'tomorrow', 'yesterday', or specific dates.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name (e.g., 'Tokyo', 'Varanasi', 'New York', 'London'). Can be just city name or 'City, Country'."
        },
        date: {
          type: "string",
          description: "Date for weather data. Options: 'today' (default), 'tomorrow', 'yesterday', or YYYY-MM-DD format. For historical data, use dates in the past."
        }
      },
      required: ["location"]
    }
  }
};

// City coordinates lookup (for common cities)
const CITY_COORDINATES: Record<string, { lat: number; lng: number; country: string }> = {
  // India
  "mumbai": { lat: 19.0760, lng: 72.8777, country: "India" },
  "delhi": { lat: 28.7041, lng: 77.1025, country: "India" },
  "bangalore": { lat: 12.9716, lng: 77.5946, country: "India" },
  "varanasi": { lat: 25.3176, lng: 82.9739, country: "India" },
  "kolkata": { lat: 22.5726, lng: 88.3639, country: "India" },
  "chennai": { lat: 13.0827, lng: 80.2707, country: "India" },
  "hyderabad": { lat: 17.3850, lng: 78.4867, country: "India" },
  "pune": { lat: 18.5204, lng: 73.8567, country: "India" },
  
  // International
  "tokyo": { lat: 35.6762, lng: 139.6503, country: "Japan" },
  "london": { lat: 51.5074, lng: -0.1278, country: "UK" },
  "paris": { lat: 48.8566, lng: 2.3522, country: "France" },
  "new york": { lat: 40.7128, lng: -74.0060, country: "USA" },
  "sydney": { lat: -33.8688, lng: 151.2093, country: "Australia" },
  "berlin": { lat: 52.5200, lng: 13.4050, country: "Germany" },
  "rome": { lat: 41.9028, lng: 12.4964, country: "Italy" },
  "madrid": { lat: 40.4168, lng: -3.7038, country: "Spain" }
};

// Get coordinates for a city
async function getCoordinates(location: string): Promise<{ lat: number; lng: number; city: string; country: string }> {
  const normalizedLocation = location.toLowerCase().trim();
  
  // Try hardcoded cities first (fastest)
  const coords = CITY_COORDINATES[normalizedLocation];
  if (coords) {
    return {
      lat: coords.lat,
      lng: coords.lng,
      city: location,
      country: coords.country
    };
  }
  
  // Fallback to geocoding API
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error(`Location "${location}" not found`);
    }
    
    const result = data.results[0];
    return {
      lat: result.latitude,
      lng: result.longitude,
      city: result.name,
      country: result.country
    };
  } catch (error) {
    throw new Error(`Could not find coordinates for "${location}": ${error}`);
  }
}

// Convert date string to proper format
function parseDate(dateStr: string = "today"): { targetDate: string | undefined; dateType: 'current' | 'historical' | 'forecast' } {
  const today = new Date();
  
  switch (dateStr.toLowerCase()) {
    case "today":
    case "now":
      return { targetDate: undefined, dateType: 'current' };
      
    case "tomorrow":
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return { 
        targetDate: tomorrow.toISOString().split('T')[0], 
        dateType: 'forecast' 
      };
      
    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return { 
        targetDate: yesterday.toISOString().split('T')[0], 
        dateType: 'historical' 
      };
      
    default:
      // Try to parse as YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const targetDate = new Date(dateStr);
        const isHistorical = targetDate < today;
        return {
          targetDate: dateStr,
          dateType: isHistorical ? 'historical' : 'forecast'
        };
      }
      
      // Default to current
      return { targetDate: undefined, dateType: 'current' };
  }
}

// Weather code descriptions
const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm'
};

// Execute weather tool
export async function executeWeatherTool(params: WeatherToolParams): Promise<WeatherToolResponse> {
  console.log('🛠️ Executing weather tool:', params);
  
  try {
    // 1. Get coordinates
    const coords = await getCoordinates(params.location);
    console.log('📍 Coordinates:', coords);
    
    // 2. Parse date
    const { targetDate, dateType } = parseDate(params.date);
    console.log('📅 Date info:', { targetDate, dateType });
    
    // 3. Build weather API URL
    let url: string;
    let weatherParams: URLSearchParams;
    
    if (dateType === 'historical' && targetDate) {
      // Historical weather
      weatherParams = new URLSearchParams({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        start_date: targetDate,
        end_date: targetDate,
        daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,precipitation_sum,wind_speed_10m_max,uv_index_max,weather_code',
        timezone: 'auto'
      });
      url = `https://archive-api.open-meteo.com/v1/archive?${weatherParams.toString()}`;
      
    } else if (dateType === 'forecast' && targetDate) {
      // Forecast weather
      weatherParams = new URLSearchParams({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        start_date: targetDate,
        end_date: targetDate,
        daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,precipitation_sum,wind_speed_10m_max,uv_index_max,weather_code',
        timezone: 'auto'
      });
      url = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`;
      
    } else {
      // Current weather
      weatherParams = new URLSearchParams({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,uv_index,weather_code',
        timezone: 'auto'
      });
      url = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`;
    }
    
    // 4. Fetch weather data
    console.log('🌤️ Fetching weather from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 5. Process weather data
    let weatherResult: WeatherToolResponse;
    
    if (dateType === 'current') {
      // Current weather
      const current = data.current;
      weatherResult = {
        city: coords.city,
        country: coords.country,
        temperature: Math.round(current.temperature_2m),
        description: weatherDescriptions[current.weather_code] || 'Unknown',
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        uvIndex: current.uv_index,
        timestamp: current.time,
        dateType: 'current'
      };
    } else {
      // Historical/forecast weather
      const daily = data.daily;
      if (!daily || !daily.time || daily.time.length === 0) {
        throw new Error('No weather data available for the requested date');
      }
      
      const dayIndex = 0; // First day
      weatherResult = {
        city: coords.city,
        country: coords.country,
        temperature: Math.round((daily.temperature_2m_max[dayIndex] + daily.temperature_2m_min[dayIndex]) / 2),
        description: weatherDescriptions[daily.weather_code[dayIndex]] || 'Unknown',
        humidity: daily.relative_humidity_2m_max[dayIndex],
        windSpeed: daily.wind_speed_10m_max[dayIndex],
        precipitation: daily.precipitation_sum[dayIndex],
        uvIndex: daily.uv_index_max[dayIndex],
        timestamp: daily.time[dayIndex],
        dateType,
        targetDate
      };
    }
    
    console.log('✅ Weather tool result:', weatherResult);
    return weatherResult;
    
  } catch (error) {
    console.error('❌ Weather tool error:', error);
    throw error;
  }
}