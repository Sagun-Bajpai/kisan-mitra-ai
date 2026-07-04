import { OrchestratorAgent } from "../agents/OrchestratorAgent.js";
import dotenv from "dotenv";

// Load environment variables for Gemini API key
dotenv.config();

async function testAgents() {
  console.log("=========================================");
  console.log("🌾 Running KisanMitra Agent Pipeline Test 🌾");
  console.log("=========================================");

  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY is not set. Agents will execute in fallback (simulation) mode.");
  } else {
    console.log("✅ GEMINI_API_KEY detected. Running real Gemini models.");
  }

  const orchestrator = new OrchestratorAgent();

  const testParams = {
    cropType: "Wheat",
    soilType: "Alluvial",
    location: "Jaipur, Rajasthan",
    question: "Should I sell my wheat now or wait?"
  };

  try {
    console.log("Triggering Orchestrator agent...");
    const result = await orchestrator.runOrchestrator(testParams);

    console.log("\n=========================================");
    console.log("✅ ORCHESTRATION COMPLETED SUCCESSFULLY");
    console.log("=========================================");
    console.log(`Resolved Location: ${result.location}`);
    console.log(`Coordinates: Lat ${result.coordinates.latitude}, Lon ${result.coordinates.longitude}`);
    
    console.log("\n--- Final Recommendation Output ---");
    console.log(JSON.stringify(result.orchestratorResponse, null, 2));

    console.log("\n--- Transparency Data: Weather Agent ---");
    console.log(`Current Temp: ${result.transparencyData.weather.currentTemp}°C`);
    console.log(`Advisory: ${result.transparencyData.weather.advisory}`);

    console.log("\n--- Transparency Data: Crop/Soil Agent ---");
    console.log(`Suitability Score: ${result.transparencyData.cropSoil.suitabilityScore}%`);
    console.log(`Nutrient Advice: ${result.transparencyData.cropSoil.fertilizerAdvice}`);

    console.log("\n--- Transparency Data: Market Agent ---");
    console.log(`Current Mandi Rate: ₹${result.transparencyData.market.currentPrice}`);
    console.log(`Recommendation: ${result.transparencyData.market.recommendation}`);
    console.log(`Reasoning: ${result.transparencyData.market.recommendationText}`);

  } catch (error) {
    console.error("❌ Orchestration test failed with error:", error);
  }
}

testAgents();
