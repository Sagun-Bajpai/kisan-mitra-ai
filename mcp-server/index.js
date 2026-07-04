import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize MCP Server
const server = new Server(
  {
    name: "kisan-mitra-weather-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define WMO weather code descriptions
const WEATHER_CODES = {
  0: "Clear sky / साफ आसमान",
  1: "Mainly clear / मुख्य रूप से साफ",
  2: "Partly cloudy / आंशिक रूप से बादल",
  3: "Overcast / घने बादल",
  45: "Fog / कोहरा",
  48: "Depositing rime fog / धुंध और कोहरा",
  51: "Light drizzle / हल्की बूंदाबांदी",
  53: "Moderate drizzle / मध्यम बूंदाबांदी",
  55: "Dense drizzle / घनी बूंदाबांदी",
  61: "Slight rain / हल्की बारिश",
  63: "Moderate rain / मध्यम बारिश",
  65: "Heavy rain / भारी बारिश",
  80: "Slight rain showers / हल्की बौछारें",
  81: "Moderate rain showers / मध्यम बौछारें",
  82: "Violent rain showers / तेज बौछारें",
  95: "Thunderstorm / गरज के साथ तूफान",
  96: "Thunderstorm with slight hail / गरज के साथ हल्की ओलावृष्टि",
  99: "Thunderstorm with heavy hail / गरज के साथ भारी ओलावृष्टि",
};

function getWeatherDescription(code) {
  return WEATHER_CODES[code] || "Unknown Weather / अज्ञात मौसम";
}

// 1. List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_weather_forecast",
        description: "Fetches live weather conditions and 7-day agricultural weather forecast (rain, temperature, probability of precipitation) using Open-Meteo for given coordinates.",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude coordinate of the location (e.g. 26.9124 for Jaipur)"
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate of the location (e.g. 75.7873 for Jaipur)"
            },
            city: {
              type: "string",
              description: "Name of the city/village (optional, for logging)"
            }
          },
          required: ["latitude", "longitude"]
        }
      }
    ]
  };
});

// 2. Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== "get_weather_forecast") {
    throw new Error(`Tool not found: ${name}`);
  }

  const { latitude, longitude, city = "Unknown Location" } = args;

  try {
    // Call Open-Meteo API (Free, no key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,rain_sum,showers_sum,weathercode&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse current weather
    const current = data.current_weather || {};
    const weatherDesc = getWeatherDescription(current.weathercode);
    
    // Parse daily forecast (next 7 days)
    const daily = data.daily || {};
    const forecast = [];
    
    if (daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        forecast.push({
          date: daily.time[i],
          maxTemp: daily.temperature_2m_max[i],
          minTemp: daily.temperature_2m_min[i],
          rainSum: daily.rain_sum[i] + daily.showers_sum[i], // combine direct rain and showers
          rainProbability: daily.precipitation_probability_max[i],
          condition: getWeatherDescription(daily.weathercode[i]),
          code: daily.weathercode[i]
        });
      }
    }

    const payload = {
      location: city,
      coordinates: { latitude, longitude },
      current: {
        temp: current.temperature,
        windSpeed: current.windspeed,
        condition: weatherDesc,
        code: current.weathercode,
        time: current.time
      },
      forecast: forecast
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: `Failed to fetch weather: ${error.message}`,
            location: city
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Run server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("KisanMitra Weather MCP Server running on stdio transport");
