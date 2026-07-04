import { BaseAgent } from "./BaseAgent.js";
import { WeatherAgent } from "./WeatherAgent.js";
import { CropSoilAgent } from "./CropSoilAgent.js";
import { MarketAgent } from "./MarketAgent.js";

// Define structured output schema for the Orchestrator Agent
const orchestratorAgentSchema = {
  type: "OBJECT",
  properties: {
    finalDecision: {
      type: "OBJECT",
      properties: {
        en: { type: "STRING", description: "Final actionable recommendation in simple English (e.g. 'Wait 3 days to sell Wheat')" },
        hi: { type: "STRING", description: "Final actionable recommendation in simple Hindi (e.g. 'गेहूं बेचने के लिए 3 दिन प्रतीक्षा करें')" }
      },
      required: ["en", "hi"]
    },
    oneLineReason: {
      type: "OBJECT",
      properties: {
        en: { type: "STRING", description: "One simple sentence explaining why in English" },
        hi: { type: "STRING", description: "One simple sentence explaining why in Hindi" }
      },
      required: ["en", "hi"]
    },
    transparencyPanel: {
      type: "OBJECT",
      properties: {
        weatherSummary: {
          type: "OBJECT",
          properties: {
            en: { type: "STRING", description: "Weather agent summary in English" },
            hi: { type: "STRING", description: "Weather agent summary in Hindi" }
          },
          required: ["en", "hi"]
        },
        cropSoilSummary: {
          type: "OBJECT",
          properties: {
            en: { type: "STRING", description: "Crop/Soil agent summary in English" },
            hi: { type: "STRING", description: "Crop/Soil agent summary in Hindi" }
          },
          required: ["en", "hi"]
        },
        marketSummary: {
          type: "OBJECT",
          properties: {
            en: { type: "STRING", description: "Market price agent summary in English" },
            hi: { type: "STRING", description: "Market price agent summary in Hindi" }
          },
          required: ["en", "hi"]
        }
      },
      required: ["weatherSummary", "cropSoilSummary", "marketSummary"]
    }
  },
  required: ["finalDecision", "oneLineReason", "transparencyPanel"]
};

// Geocoding helper for Indian cities
const GEOLOCATION_MAP = {
  jaipur: { lat: 26.9124, lon: 75.7873, name: "Jaipur, Rajasthan" },
  ludhiana: { lat: 30.9010, lon: 75.8573, name: "Ludhiana, Punjab" },
  patna: { lat: 25.5941, lon: 85.1376, name: "Patna, Bihar" },
  pune: { lat: 18.5204, lon: 73.8567, name: "Pune, Maharashtra" },
  lucknow: { lat: 26.8467, lon: 80.9462, name: "Lucknow, Uttar Pradesh" },
  rohtak: { lat: 28.8955, lon: 76.6066, name: "Rohtak, Haryana" },
  hyderabad: { lat: 17.3850, lon: 78.4867, name: "Hyderabad, Telangana" },
  nagpur: { lat: 21.1458, lon: 79.0882, name: "Nagpur, Maharashtra" }
};

export class OrchestratorAgent extends BaseAgent {
  constructor() {
    super({
      name: "OrchestratorAgent",
      description: "Aggregates sub-agent analysis to form a single farming recommendation.",
      systemInstruction: `You are the KisanMitra Lead Orchestrator Agent. Your task is to review the independent assessments of three specialist agents (Weather, Crop/Soil, Market) and combine them into a single, cohesive recommendation for an Indian farmer.
Provide the output in a structured JSON layout that includes separate English and Hindi translations for all text properties.
Ensure the recommendation is extremely simple, direct, and actionable. Avoid complex jargon. Highlight warnings if rain is forecasted.`,
      responseSchema: orchestratorAgentSchema
    });

    // Initialize sub-agents
    this.weatherAgent = new WeatherAgent();
    this.cropSoilAgent = new CropSoilAgent();
    this.marketAgent = new MarketAgent();
  }

  /**
   * Resolves city name to coordinates, using default (Jaipur) if unrecognized.
   */
  resolveLocation(location) {
    const clean = location.toLowerCase().trim();
    for (const key in GEOLOCATION_MAP) {
      if (clean.includes(key)) {
        return GEOLOCATION_MAP[key];
      }
    }
    // Fallback: Default to Ludhiana, Punjab (a key agri-hub) or search coordinates
    console.log(`[Orchestrator] Unrecognized location '${location}'. Defaulting to Ludhiana, Punjab.`);
    return { lat: 30.9010, lon: 75.8573, name: location || "Ludhiana, Punjab" };
  }

  /**
   * Orchestrates the agent execution flow
   */
  async runOrchestrator({ cropType, soilType, location, question }) {
    console.log(`[Orchestrator] Beginning orchestration for Crop: ${cropType}, Soil: ${soilType}, Location: ${location}`);
    
    // 1. Resolve location coordinates
    const geo = this.resolveLocation(location);

    // 2. Call sub-agents in parallel
    const [weatherResult, cropSoilResult, marketResult] = await Promise.all([
      this.weatherAgent.runAgent(geo.lat, geo.lon, geo.name),
      this.cropSoilAgent.runAgent(cropType, soilType, question),
      this.marketAgent.runAgent(cropType, geo.name)
    ]);

    console.log(`[Orchestrator] Sub-agent outputs gathered. Creating final recommendation...`);

    const context = {
      cropType,
      soilType,
      location: geo.name,
      question,
      weatherResult,
      cropSoilResult,
      marketResult
    };

    let orchestratorResponse;

    if (!this.ai) {
      orchestratorResponse = this.fallback(context, "LLM API Key missing");
    } else {
      const prompt = `
Farmer's Query Details:
- Crop Type: ${cropType}
- Soil Type: ${soilType}
- Location: ${geo.name}
- Question/Concern: ${question || "Should I sell now or wait?"}

Sub-Agent Reports:
1. Weather Agent Report:
${JSON.stringify(weatherResult, null, 2)}

2. Crop/Soil Agent Report:
${JSON.stringify(cropSoilResult, null, 2)}

3. Market Price Agent Report:
${JSON.stringify(marketResult, null, 2)}

Task: Analyze these three reports.
- If the Weather Agent forecasts heavy rain and the Market Agent says HOLD, recommend HOLDING.
- If the Weather Agent forecasts rain and the Crop Agent says "ready to harvest" or "avoid spraying", advise accordingly.
- Keep the final decision under 8 words.
- Keep the oneLineReason simple and direct.
- Fill out the orchestratorAgentSchema in JSON. Translate all fields accurately into simple English and simple Hindi.
`;
      try {
        orchestratorResponse = await this.run(prompt);
      } catch (err) {
        console.error("[Orchestrator] Run error:", err);
        orchestratorResponse = this.fallback(context, err.message);
      }
    }

    // Return aggregated payload including raw sub-agent details for the transparency panel
    return {
      success: true,
      cropType,
      soilType,
      location: geo.name,
      coordinates: { latitude: geo.lat, longitude: geo.lon },
      orchestratorResponse,
      transparencyData: {
        weather: weatherResult,
        cropSoil: cropSoilResult,
        market: marketResult
      }
    };
  }

  /**
   * Fallback synthesis
   */
  fallback(context, reason) {
    const w = context.weatherResult;
    const c = context.cropSoilResult;
    const m = context.marketResult;

    // Direct translation utilities for split properties
    const splitEn = (text) => text.split("/")[0]?.trim() || text;
    const splitHi = (text) => text.split("/")[1]?.trim() || text;

    let finalEn = "";
    let finalHi = "";
    let reasonEn = "";
    let reasonHi = "";

    const rec = m?.recommendation || "HOLD";

    if (rec === "HOLD") {
      finalEn = `Wait to sell ${context.cropType}`;
      finalHi = `${context.cropType} बेचने के लिए रुकें`;
      reasonEn = `Prices are expected to rise by next week, and dry weather allows safe storage.`;
      reasonHi = `अगले सप्ताह तक कीमतें बढ़ने की उम्मीद है, और सूखा मौसम सुरक्षित भंडारण की अनुमति देता है।`;
    } else {
      finalEn = `Sell ${context.cropType} now`;
      finalHi = `अभी ${context.cropType} बेचें`;
      reasonEn = `Prices are trending down, and forecasted rains could damage harvested stock.`;
      reasonHi = `कीमतें नीचे जा रही हैं, और बारिश का पूर्वानुमान कटी हुई फसल को नुकसान पहुंचा सकता है।`;
    }

    // Weather warnings override
    if (w.precipitationProbability > 50) {
      finalEn = `Wait & protect ${context.cropType}`;
      finalHi = `रुकें और ${context.cropType} को सुरक्षित करें`;
      reasonEn = `High rain chance (${w.precipitationProbability}%). Delay harvesting or spraying, and hold stock.`;
      reasonHi = `बारिश की उच्च संभावना (${w.precipitationProbability}%)। कटाई या छिड़काव टालें, और स्टॉक रखें।`;
    }

    return {
      finalDecision: { en: finalEn, hi: finalHi },
      oneLineReason: { en: reasonEn, hi: reasonHi },
      transparencyPanel: {
        weatherSummary: {
          en: `Temp: ${w.currentTemp}°C. ${splitEn(w.condition)}. Advice: ${splitEn(w.advisory)}`,
          hi: `तापमान: ${w.currentTemp}°C। ${splitHi(w.condition)}। सलाह: ${splitHi(w.advisory)}`
        },
        cropSoilSummary: {
          en: `Soil Suitability: ${c.suitabilityScore}%. Watering: ${splitEn(c.wateringNeeds)}`,
          hi: `मिट्टी उपयुक्तता: ${c.suitabilityScore}%। सिंचाई: ${splitHi(c.wateringNeeds)}`
        },
        marketSummary: {
          en: `Price: ₹${simFormat(m?.currentPrice || 0)}. Trend: ${m?.priceTrend || "Stable"}. Rec: ${m?.recommendation || "HOLD"}`,
          hi: `मूल्य: ₹${simFormat(m?.currentPrice || 0)}। रुख: ${(m?.priceTrend || "Stable") === "Rising" ? "तेजी" : (m?.priceTrend || "Stable") === "Falling" ? "मंदी" : "स्थिर"}। सलाह: ${(m?.recommendation || "HOLD") === "HOLD" ? "रोकें" : "बेचें"}`
        }
      }
    };
  }
}

// Utility to format price
function simFormat(num) {
  return Number(num).toLocaleString('en-IN');
}
