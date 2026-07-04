import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OrchestratorAgent } from "../agents/OrchestratorAgent.js";

// Load environment variables. 
// SECURITY BEST PRACTICE: API keys (like GEMINI_API_KEY) must be stored in a local `.env` 
// file rather than being hardcoded in the source code. This prevents sensitive credentials 
// from being accidentally exposed in shared environments or committed to version control repositories (e.g. GitHub).
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Orchestrator Agent
const orchestrator = new OrchestratorAgent();

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    geminiKeyDetected: !!process.env.GEMINI_API_KEY
  });
});

/**
 * Main query endpoint: receives farmer input and triggers the multi-agent system
 */
app.post("/api/query", async (req, res) => {
  const { cropType, soilType, location, question = "" } = req.body;

  // Basic validation
  if (!cropType || !soilType || !location) {
    return res.status(400).json({
      error: "Missing required inputs: 'cropType', 'soilType', and 'location' are mandatory."
    });
  }

  console.log(`[Backend] Received request for crop: ${cropType}, soil: ${soilType}, location: ${location}`);

  try {
    const result = await orchestrator.runOrchestrator({
      cropType,
      soilType,
      location,
      question
    });
    
    res.json(result);
  } catch (error) {
    console.error("[Backend] Error processing query:", error);
    res.status(500).json({
      error: "An internal server error occurred while orchestrating agents.",
      message: error.message
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🌾 KisanMitra Backend running on port ${PORT} 🌾`);
  console.log(`API Endpoint: http://localhost:${PORT}/api/query`);
  console.log(`==================================================`);
});
