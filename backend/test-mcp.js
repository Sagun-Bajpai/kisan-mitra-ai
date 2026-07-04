import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMCPConnection() {
  console.log("=========================================");
  console.log("🔍 Testing Weather MCP Server connection...");
  console.log("=========================================");

  const mcpServerPath = path.resolve(__dirname, "../mcp-server/index.js");
  console.log(`Server path resolved: ${mcpServerPath}`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [mcpServerPath]
  });

  const client = new Client({
    name: "test-mcp-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    console.log("Connecting client transport...");
    await client.connect(transport);
    console.log("✅ Client connected successfully.");

    console.log("Listing tools...");
    const tools = await client.listTools();
    console.log("Tools returned by server:", JSON.stringify(tools, null, 2));

    console.log("Calling get_weather_forecast for Ludhiana, Punjab...");
    const response = await client.callTool({
      name: "get_weather_forecast",
      arguments: {
        latitude: 30.9010,
        longitude: 75.8573,
        city: "Ludhiana, Punjab"
      }
    });

    console.log("✅ Tool response received successfully:");
    console.log(response.content[0].text);

  } catch (error) {
    console.error("❌ MCP Connection test failed:", error);
  } finally {
    console.log("Closing transport...");
    try {
      await transport.close();
    } catch (e) {
      // ignore close errors
    }
    console.log("Test finished.");
  }
}

testMCPConnection();
