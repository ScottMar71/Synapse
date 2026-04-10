import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-server-template",
  version: "0.1.0",
});

server.registerTool(
  "echo",
  {
    title: "Echo",
    description: "Return the provided message.",
    inputSchema: {
      message: z.string().min(1).max(500),
    },
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: message.trim(),
        },
      ],
    };
  },
);

server.registerResource(
  "framework-overview",
  "framework://overview",
  {
    title: "Framework overview",
    description: "Starter resource describing the project template.",
  },
  async () => {
    return {
      contents: [
        {
          uri: "framework://overview",
          text: "This MCP template is designed for internal tools and services.",
        },
      ],
    };
  },
);

async function main(): Promise<void> {
  const transportType = process.env.MCP_TRANSPORT ?? "stdio";

  if (transportType === "sse") {
    const transport = new SSEServerTransport("/messages", {
      port: Number(process.env.PORT ?? "8788"),
    });
    await server.connect(transport);
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP template failed:", error);
  process.exit(1);
});
