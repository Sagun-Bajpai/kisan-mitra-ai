import { GoogleGenAI } from "@google/genai";

/**
 * BaseAgent represents a Google ADK-inspired Agent abstraction.
 * It encapsulates a specific role, system instructions, model config,
 * and structured JSON outputs.
 */
export class BaseAgent {
  constructor({
    name,
    description,
    systemInstruction,
    modelName = "gemini-2.5-flash",
    responseSchema = null,
  }) {
    this.name = name;
    this.description = description;
    this.systemInstruction = systemInstruction;
    this.modelName = modelName;
    this.responseSchema = responseSchema;
    
    // Initialize Gemini AI Client
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn(`[BaseAgent - ${name}]: GEMINI_API_KEY environment variable is not set. Running in mock/fallback mode.`);
      this.ai = null;
    }
  }

  /**
   * Executes the agent's logic.
   * @param {string|object} input - Input content or prompt for the agent.
   * @param {object} [schemaOverride] - Optional JSON schema override for the output.
   * @returns {Promise<object>} The structured JSON output from the agent.
   */
  async run(input, schemaOverride = null) {
    const activeSchema = schemaOverride || this.responseSchema;
    const promptText = typeof input === "string" ? input : JSON.stringify(input);

    console.log(`[${this.name}] Running agent logic...`);

    // If no API Key, trigger fallback
    if (!this.ai) {
      return this.fallback(input, "GEMINI_API_KEY missing");
    }

    try {
      const config = {
        systemInstruction: this.systemInstruction,
      };

      // If structured output is requested
      if (activeSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = activeSchema;
      }

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: promptText,
        config: config,
      });

      const responseText = response.text;
      
      if (activeSchema) {
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[${this.name}] Failed to parse JSON response:`, responseText);
          throw parseError;
        }
      }

      return { text: responseText };

    } catch (error) {
      console.error(`[${this.name}] API Error:`, error.message);
      console.warn(`[${this.name}] Falling back to simulated/mock data.`);
      return this.fallback(input, error.message);
    }
  }

  /**
   * Mock/fallback method to ensure robustness when API keys are missing or model fails.
   * To be overridden by child classes if custom fallback is needed.
   */
  fallback(input, reason) {
    return {
      status: "fallback",
      reason: reason,
      message: "Fallback response from BaseAgent. Implement child agent custom fallbacks."
    };
  }
}
