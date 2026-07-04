import { BaseAgent } from "./BaseAgent.js";

// Define structured output schema for the Market Price Agent
const marketAgentSchema = {
  type: "OBJECT",
  properties: {
    currentPrice: { type: "NUMBER", description: "Current market price in ₹/quintal (or ₹/ton for sugarcane)" },
    projectedPrice7Days: { type: "NUMBER", description: "Projected price in 7 days in ₹/quintal" },
    priceTrend: { type: "STRING", description: "Trend description: 'Rising', 'Falling', or 'Stable'" },
    recommendation: { type: "STRING", description: "Action recommended: MUST be either 'SELL' or 'HOLD'" },
    recommendationText: { type: "STRING", description: "Detailed market analysis and advice in format: 'English / हिन्दी'" },
    mspPrice: { type: "NUMBER", description: "Government Minimum Support Price (MSP) for this crop" },
    historicalPrices: {
      type: "ARRAY",
      items: { type: "NUMBER" },
      description: "List of 30 historical daily prices leading up to today"
    },
    projectedPrices: {
      type: "ARRAY",
      items: { type: "NUMBER" },
      description: "List of 7 projected daily prices for the next 7 days"
    }
  },
  required: [
    "currentPrice",
    "projectedPrice7Days",
    "priceTrend",
    "recommendation",
    "recommendationText",
    "mspPrice",
    "historicalPrices",
    "projectedPrices"
  ]
};

// Base MSP and Mandi values for Indian crops (per quintal, except sugarcane which is FRP per ton or quintal)
const BASE_CROP_MARKET = {
  wheat: { msp: 2425, basePrice: 2500, volatility: 0.04, trend: "up" },
  rice: { msp: 2369, basePrice: 2440, volatility: 0.03, trend: "stable" },
  rice_common: { msp: 2369, basePrice: 2440, volatility: 0.03, trend: "stable" },
  rice_grade_a: { msp: 2389, basePrice: 2460, volatility: 0.03, trend: "stable" },
  cotton: { msp: 6620, basePrice: 6850, volatility: 0.06, trend: "down" },
  mustard: { msp: 5650, basePrice: 5900, volatility: 0.05, trend: "up" },
  sugarcane: { msp: 315, basePrice: 340, volatility: 0.02, trend: "stable" } // sugarcane is typically FRP (Fair & Remunerative Price)
};

export class MarketAgent extends BaseAgent {
  constructor() {
    super({
      name: "MarketAgent",
      description: "Fetches/simulates mandi prices and analyzes trends to recommend whether to sell now or hold.",
      systemInstruction: `You are an expert Agricultural Economist and Mandi Analyst. Your job is to analyze mandi price trends and generate actionable sell/hold advice.
Ensure your recommendation is either "SELL" or "HOLD".
Explain your reasoning clearly in a bilingual format "English description / हिन्दी विवरण".
Use MSP and market price details to back up your recommendation.`,
      responseSchema: marketAgentSchema
    });
  }

  /**
   * Generates a realistic set of simulated historical prices and projects future prices
   */
  simulatePrices(crop, state) {
    const market = BASE_CROP_MARKET[crop.toLowerCase()] || { msp: 2000, basePrice: 2100, volatility: 0.05, trend: "stable" };
    
    // State adjustment factor (simulate slightly higher/lower prices based on state)
    let stateMultiplier = 1.0;
    const cleanState = state.toLowerCase();
    if (cleanState.includes("punjab") || cleanState.includes("haryana")) {
      stateMultiplier = 1.03; // Higher mandi prices/infrastructure
    } else if (cleanState.includes("bihar") || cleanState.includes("odisha")) {
      stateMultiplier = 0.95; // Slightly lower
    } else if (cleanState.includes("maharashtra") || cleanState.includes("gujarat")) {
      stateMultiplier = 1.01;
    }
    
    const baseMandiPrice = Math.round(market.basePrice * stateMultiplier);
    const msp = market.msp;

    // Generate 30 days of historical prices with a random walk
    const historicalPrices = [];
    let current = baseMandiPrice - (market.volatility * baseMandiPrice * 15); // Start lower
    
    // Set seed-like trend behavior
    const trendFactor = market.trend === "up" ? 1.002 : market.trend === "down" ? 0.997 : 1.0;

    for (let i = 0; i < 30; i++) {
      const dailyNoise = (Math.random() - 0.48) * 2 * market.volatility * baseMandiPrice; // slight bias
      current = current * trendFactor + dailyNoise;
      // Guarantee it doesn't fall way below MSP except in extreme simulated cases
      if (current < msp * 0.9) current = msp * 0.9 + Math.random() * 50;
      historicalPrices.push(Math.round(current));
    }

    const currentPrice = historicalPrices[historicalPrices.length - 1];

    // Generate 7 days of projected prices
    const projectedPrices = [];
    let futureCurrent = currentPrice;
    
    // Set future trend multiplier
    let futureTrendMultiplier = 1.0;
    let priceTrend = "Stable";
    let recommendation = "HOLD";

    if (market.trend === "up") {
      futureTrendMultiplier = 1.005; // 0.5% growth daily (~3.5% in a week)
      priceTrend = "Rising";
      recommendation = "HOLD"; // wait for higher prices
    } else if (market.trend === "down") {
      futureTrendMultiplier = 0.994; // -0.6% decline daily (~4% drop in a week)
      priceTrend = "Falling";
      recommendation = "SELL"; // sell before it drops more
    } else {
      futureTrendMultiplier = 1.0005;
      priceTrend = "Stable";
      recommendation = "SELL"; // sell now since prices are steady
    }

    for (let i = 1; i <= 7; i++) {
      const noise = (Math.random() - 0.5) * 0.8 * market.volatility * baseMandiPrice;
      futureCurrent = futureCurrent * futureTrendMultiplier + noise;
      projectedPrices.push(Math.round(futureCurrent));
    }

    const projectedPrice7Days = projectedPrices[projectedPrices.length - 1];

    return {
      currentPrice,
      projectedPrice7Days,
      priceTrend,
      recommendation,
      mspPrice: msp,
      historicalPrices,
      projectedPrices
    };
  }

  /**
   * Run the Market Agent
   */
  async runAgent(cropType, location) {
    const simulation = this.simulatePrices(cropType, location);

    const context = {
      cropType,
      location,
      simulation
    };

    if (!this.ai) {
      return this.fallback(context, "LLM API Key missing");
    }

    const prompt = `
Crop: ${cropType}
Location: ${location}
Government Minimum Support Price (MSP): ₹${simulation.mspPrice}/quintal
Current Mandi Price: ₹${simulation.currentPrice}/quintal
Projected Price in 7 Days: ₹${simulation.projectedPrice7Days}/quintal
Price Trend: ${simulation.priceTrend}

Historical Price Path (last 30 days):
${simulation.historicalPrices.join(", ")}

Projected Price Path (next 7 days):
${simulation.projectedPrices.join(", ")}

Task: Analyze these market conditions and populate the marketAgentSchema. Write a compelling, farmer-friendly recommendationText explaining the trend, why they should ${simulation.recommendation} now, and compare the mandi price against the Government MSP. Use the bilingual format "English explanation / हिन्दी विवरण".
`;

    const result = await this.run(prompt);
    
    // Safety check: ensure arrays are preserved
    return {
      ...result,
      historicalPrices: simulation.historicalPrices,
      projectedPrices: simulation.projectedPrices,
      mspPrice: simulation.mspPrice
    };
  }

  /**
   * Fallback implementation
   */
  fallback(context, reason) {
    const sim = context.simulation;
    const crop = (context.cropType || 'wheat').toLowerCase();

    let recommendationText = "";
    if (sim.recommendation === "HOLD") {
      recommendationText = `Mandi prices for ${context.cropType} are rising and currently sit above the MSP of ₹${sim.mspPrice}. We recommend HOLDING your stock for a week, as we project a price increase to ₹${sim.projectedPrice7Days} per quintal. / ${context.cropType} के लिए मंडी की कीमतें बढ़ रही हैं और वर्तमान में ₹${sim.mspPrice} के एमएसपी से ऊपर हैं। हम आपके स्टॉक को एक सप्ताह के लिए रोकने (HOLD) की सलाह देते हैं, क्योंकि हम प्रति क्विंटल ₹${sim.projectedPrice7Days} तक की वृद्धि का अनुमान लगा रहे हैं।`;
    } else if (sim.recommendation === "SELL") {
      recommendationText = `Prices for ${context.cropType} are showing a declining trend. Mandi price is ₹${sim.currentPrice}, which is near the MSP. We recommend SELLING now to avoid further losses as prices may drop to ₹${sim.projectedPrice7Days} in 7 days. / ${context.cropType} की कीमतें गिरावट का रुख दिखा रही हैं। मंडी की कीमत ₹${sim.currentPrice} है, जो एमएसपी के करीब है। हम नुकसान से बचने के लिए अभी बेचने (SELL) की सलाह देते हैं क्योंकि 7 दिनों में कीमतें गिरकर ₹${sim.projectedPrice7Days} हो सकती हैं।`;
    } else {
      recommendationText = `Mandi prices for ${context.cropType} are stable at ₹${sim.currentPrice} per quintal. We recommend SELLING as there are no signs of price increases in the coming week. / ${context.cropType} के लिए मंडी की कीमतें ₹${sim.currentPrice} प्रति क्विंटल पर स्थिर हैं। हम बेचने (SELL) की सलाह देते हैं क्योंकि आने वाले सप्ताह में कीमतों में वृद्धि के कोई संकेत नहीं हैं।`;
    }

    return {
      currentPrice: sim.currentPrice,
      projectedPrice7Days: sim.projectedPrice7Days,
      priceTrend: sim.priceTrend,
      recommendation: sim.recommendation,
      recommendationText,
      mspPrice: sim.mspPrice,
      historicalPrices: sim.historicalPrices,
      projectedPrices: sim.projectedPrices
    };
  }
}
