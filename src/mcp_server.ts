import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import cors from "cors";
import express from "express";

import { octokit, owner, repo } from "./github_issus.js";
import { WordSchema, Word } from "./word.js";

function configMCPServer(server: McpServer, sessionId: string) {
  server.registerTool(
    "add-word",
    {
      title: "Add word",
      description: "Add a word to the list",
      inputSchema: WordSchema.shape,
    },
    async (args: Word) => {
      try {
        const word = WordSchema.parse(args);
        const response = await octokit.issues.create({
          owner,
          repo,
          title: word.word,
          body: JSON.stringify(word, null, 2),
          labels: ["word"],
        });
        console.log("create issue response: ", response);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(args, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(error.errors);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(error.errors, null, 2),
              },
            ],
          };
        } else {
          console.error(error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(error, null, 2),
              },
            ],
          };
        }
      }
    }
  );

  server.registerTool(
    "list-words",
    {
      title: "List words",
      description: "List all words",
    },
    async () => {
      try {
        const response = await octokit.issues.listForRepo({
          owner,
          repo,
        });

        const words = response.data
          .map((issue) => {
            try {
              const word = WordSchema.parse(JSON.parse(issue.body || "{}"));
              return {
                ...word,
                id: issue.number,
              };
            } catch (error) {
              console.error("error, issue body: ", issue.body);
              return null;
            }
          })
          .filter((word) => word !== null);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(words, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("error: ", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "Failed to list issues" }, null, 2),
            },
          ],
        };
      }
    }
  );
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*", // Configure appropriately for production, for example:
    // origin: ['https://your-remote-domain.com', 'https://your-other-remote-domain.com'],
    exposedHeaders: ["Mcp-Session-Id"],
    allowedHeaders: ["Content-Type", "mcp-session-id"],
  })
);

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post("/mcp", async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = new McpServer({
      name: "words_mcp",
      version: "1.0.0",
    });

    configMCPServer(server, transport.sessionId || "");

    // ... set up server resources, tools, and prompts ...

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (
  req: express.Request,
  res: express.Response
) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get("/mcp", handleSessionRequest);

// Handle DELETE requests for session termination
app.delete("/mcp", handleSessionRequest);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
