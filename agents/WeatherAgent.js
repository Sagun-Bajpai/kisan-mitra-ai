import { BaseAgent } from "./BaseAgent.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define structured output schema for the Weather Agent
const weatherAgentSchema = {
  type: "OBJECT",
  properties: {
    currentTemp: { type: "NUMBER", description: "Current temperature in Celsius" },
    condition: { type: "STRING", description: "Brief description of current weather in format: 'English / हिन्दी'" },
    rainForecast: { type: "STRING", description: "Detailed rain forecast summary in format: 'English / हिन्दी'" },
    advisory: { type: "STRING", description: "Agricultural advisory based on weather (e.g. pesticide spraying, watering) in format: 'English / हिन्दी'" },
    precipitationProbability: { type: "NUMBER", description: "Maximum precipitation probability (0-100) expected this week" },
    weeklyForecast: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING", description: "YYYY-MM-DD date" },
          maxTemp: { type: "NUMBER", description: "Max temp in Celsius" },
          minTemp: { type: "NUMBER", description: "Min temp in Celsius" },
          rainSum: { type: "NUMBER", description: "Rain in mm" },
          condition: { type: "STRING", description: "Weather condition description in format: 'English / हिन्दी'" }
        },
        required: ["date", "maxTemp", "minTemp", "rainSum", "condition"]
      }
    }
  },
  required: ["currentTemp", "condition", "rainForecast", "advisory", "precipitationProbability", "weeklyForecast"]
};

export class WeatherAgent extends BaseAgent {
  constructor() {
    super({
      name: "WeatherAgent",
      description: "Fetches weather forecasts and provides direct farming advisories regarding rain, temperature, and winds.",
      systemInstruction: `You are an expert Agricultural Weather Advisory Agent. Your job is to take raw JSON weather data for a location and compile a farmer-friendly agricultural report.
Provide all text/descriptions strictly in a bilingual format: "English description / हिन्दी विवरण" (English first, followed by Hindi after a slash).
Keep advice practical, focusing on water management, crop safety, and spraying guidelines.`,
      responseSchema: weatherAgentSchema
    });
  }

  /**
   * Fetches weather data using the MCP server.
   */
  async fetchWeatherViaMCP(latitude, longitude, city) {
    let client;
    let transport;
    try {
      console.log(`[WeatherAgent] Connecting to Weather MCP Server...`);
      
      // Path to the MCP server
      const mcpServerPath = path.resolve(__dirname, "../mcp-server/index.js");
      
      // MCP SERVER: Connecting to Open-Meteo API via local Weather MCP server transport
      transport = new StdioClientTransport({
        command: "node",
        args: [mcpServerPath]
      });

      client = new Client({
        name: "kisan-mitra-backend-client",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      await client.connect(transport);
      console.log(`[WeatherAgent] MCP Server connected. Querying get_weather_forecast...`);

      // MCP TOOL CALL: Fetching weather data from Open-Meteo external API
      const result = await client.callTool({
        name: "get_weather_forecast",
        arguments: { latitude, longitude, city }
      });

      // Cleanup connection
      try {
        await transport.close();
      } catch (closeErr) {
        // ignore close error
      }

      if (result.isError) {
        throw new Error(result.content[0].text);
      }

      return JSON.parse(result.content[0].text);

    } catch (error) {
      console.warn(`[WeatherAgent] MCP fetch failed: ${error.message}. Trying direct API fallback.`);
      if (transport) {
        try { await transport.close(); } catch (e) {}
      }
      return this.fetchWeatherDirect(latitude, longitude, city);
    }
  }

  /**
   * Direct API fallback in case the MCP server is not available/configured.
   */
  async fetchWeatherDirect(latitude, longitude, city) {
    console.log(`[WeatherAgent] Executing direct API fetch for weather...`);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,rain_sum,showers_sum,weathercode&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo fallback API failed with code ${response.status}`);
    }
    const data = await response.json();
    
    // Simplistic mapping for fallback weather codes
    const getCodeDesc = (code) => {
      const codes = {
        0: "Clear / साफ",
        1: "Mainly Clear / मुख्य रूप से साफ",
        2: "Partly Cloudy / आंशिक रूप से बादल",
        3: "Overcast / घने बादल",
        61: "Slight Rain / हल्की बारिश",
        63: "Moderate Rain / मध्यम बारिश",
        65: "Heavy Rain / भारी बारिश",
        95: "Thunderstorm / आंधी-तूफान"
      };
      return codes[code] || "Cloudy / बादल";
    };

    const daily = data.daily || {};
    const forecast = [];
    if (daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        forecast.push({
          date: daily.time[i],
          maxTemp: daily.temperature_2m_max[i],
          minTemp: daily.temperature_2m_min[i],
          rainSum: (daily.rain_sum[i] || 0) + (daily.showers_sum[i] || 0),
          rainProbability: daily.precipitation_probability_max[i] || 0,
          condition: getCodeDesc(daily.weathercode[i])
        });
      }
    }

    return {
      location: city,
      coordinates: { latitude, longitude },
      current: {
        temp: data.current_weather?.temperature,
        windSpeed: data.current_weather?.windspeed,
        condition: getCodeDesc(data.current_weather?.weathercode),
        time: data.current_weather?.time
      },
      forecast
    };
  }

  /**
   * Run the Weather Agent analysis
   */
  async runAgent(latitude, longitude, city) {
    try {
      const rawWeather = await this.fetchWeatherViaMCP(latitude, longitude, city);
      
      // If we don't have LLM support, do fallback analysis
      if (!this.ai) {
        return this.fallback(rawWeather, "LLM API Key missing");
      }

      // Execute Gemini to summarize and add agricultural advice
      const prompt = `Location: ${city}
Coordinates: Latitude ${latitude}, Longitude ${longitude}
Raw Weather JSON:
${JSON.stringify(rawWeather, null, 2)}

Analyze this data and fill out the weatherAgentSchema. Determine if rainfall is expected, check maximum temperatures, and provide an agricultural advisory (e.g. 'Safe to spray pesticides, but avoid watering heavily' or 'Do not spray chemicals for the next 2 days due to high rain risk'). Keep sentences short, practical, and bilingual.`;

      return await this.run(prompt);

    } catch (err) {
      console.error("[WeatherAgent] Run error:", err);
      return this.fallback({ location: city }, err.message);
    }
  }

  /**
   * Fallback output if the API keys are missing or LLM call fails
   */
  fallback(weatherData, reason) {
    const isTempPresent = weatherData?.current?.temp !== undefined;
    const tempVal = isTempPresent ? weatherData.current.temp : 28.5;
    
    // Check if rain is expected in forecast
    const hasRain = weatherData?.forecast?.some(day => day.rainSum > 1 || day.rainProbability > 40) || false;
    
    const condition = hasRain ? "Light rain forecast / हल्की बारिश का अनुमान" : "Clear weather / मौसम साफ रहेगा";
    const rainForecast = hasRain 
      ? "Rain expected in the next few days. / अगले कुछ दिनों में बारिश की संभावना है।" 
      : "No significant rain expected this week. / इस सप्ताह कोई महत्वपूर्ण बारिश की संभावना नहीं है।";
    const advisory = hasRain
      ? "Avoid pesticide sprays and delay harvesting if possible. / कीटनाशकों के छिड़काव से बचें और यदि संभव हो तो कटाई में देरी करें।"
      : "Ideal time for pesticide spraying and regular irrigation. / कीटनाशकों के छिड़काव और नियमित सिंचाई के लिए आदर्श समय।";

    const defaultForecast = weatherData.forecast || [
      { date: "2026-06-29", maxTemp: 32, minTemp: 24, rainSum: 0, condition: "Clear / साफ" },
      { date: "2026-06-30", maxTemp: 31, minTemp: 24, rainSum: 2, condition: "Light rain / हल्की बारिश" },
      { date: "2026-07-01", maxTemp: 30, minTemp: 23, rainSum: 8, condition: "Moderate rain / मध्यम बारिश" },
      { date: "2026-07-02", maxTemp: 32, minTemp: 24, rainSum: 0, condition: "Clear / साफ" },
      { date: "2026-07-03", maxTemp: 33, minTemp: 25, rainSum: 0, condition: "Sunny / धूप" },
    ];

    return {
      currentTemp: tempVal,
      condition,
      rainForecast,
      advisory,
      precipitationProbability: hasRain ? 75 : 10,
      weeklyForecast: defaultForecast.slice(0, 5)
    };
  }
}
