import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { GitHubService } from "./services/github.service.js";
import { McpService } from "./services/mcp.service.js";
import { ERROR_RESPONSES } from "./errors.js";
import { EnvSchema } from "./types.js";

import * as dotenv from "dotenv";
import z from "zod";

dotenv.config();
// Validate environment variables
let env: z.infer<typeof EnvSchema>;
try {
  env = EnvSchema.parse(process.env);
} catch (error) {
  console.error("Error validating environment variables:", error);
  process.exit(1);
}

class WordMcpServer {
  private app: express.Application;
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();
  private githubService: GitHubService;
  private mcpService: McpService;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();

    // Initialize services
    this.githubService = new GitHubService(
      env.GITHUB_OWNER,
      env.GITHUB_REPO,
      env.GITHUB_TOKEN
    );
    this.mcpService = new McpService(this.githubService);
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(
      cors({
        origin: env.CORS_ORIGINS,
        exposedHeaders: ["Mcp-Session-Id"],
        allowedHeaders: ["Content-Type", "mcp-session-id"],
      })
    );
  }

  private setupRoutes(): void {
    // Handle POST requests for client-to-server communication
    this.app.post("/mcp", this.handleMcpRequest.bind(this));

    // Handle GET requests for server-to-client notifications via SSE
    this.app.get("/mcp", this.handleSessionRequest.bind(this));

    // Handle DELETE requests for session termination
    this.app.delete("/mcp", this.handleSessionRequest.bind(this));

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
  }

  private async handleMcpRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.transports.has(sessionId)) {
        // Reuse existing transport
        transport = this.transports.get(sessionId)!;
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = this.createNewTransport();
      } else {
        // Invalid request
        res.status(400).json(ERROR_RESPONSES.INVALID_SESSION);
        return;
      }

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      res.status(500).json(ERROR_RESPONSES.INTERNAL_ERROR);
    }
  }

  private createNewTransport(): StreamableHTTPServerTransport {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        this.transports.set(sessionId, transport);
      },
      // DNS rebinding protection is disabled by default for backwards compatibility
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        this.transports.delete(transport.sessionId);
      }
    };

    // Connect MCP server to transport
    const mcpServer = this.mcpService.getServer();
    mcpServer.connect(transport).catch((error) => {
      console.error("Failed to connect MCP server:", error);
    });

    return transport;
  }

  private async handleSessionRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (!sessionId || !this.transports.has(sessionId)) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }

      const transport = this.transports.get(sessionId)!;
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling session request:", error);
      res.status(500).json(ERROR_RESPONSES.INTERNAL_ERROR);
    }
  }

  public start(): void {
    this.app.listen(env.PORT, env.HOST, () => {
      console.log(`Server is running on http://${env.HOST}:${env.PORT}`);
      console.log(
        `Health check available at http://${env.HOST}:${env.PORT}/health`
      );
    });
  }
}

// Start the server
const server = new WordMcpServer();
server.start();
