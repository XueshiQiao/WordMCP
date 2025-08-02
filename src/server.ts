import fastify from "fastify";
import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";
import { McpServer, McpStream } from "@modelcontextprotocol/sdk";
import { handleAddIssue, handleListIssues } from "./mcp";

dotenv.config();

const server = fastify({ logger: true });

// Configure Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER as string;
const repo = process.env.GITHUB_REPO as string;

// MCP Server
const mcpServer = new McpServer();

mcpServer.addStreamHandler("/issues", async (stream: McpStream) => {
  stream.on("data", async (chunk: any) => {
    const { function: func, args } = JSON.parse(chunk.toString());
    if (func === "add-issue") {
      await handleAddIssue(stream, octokit, owner, repo, args);
    } else if (func === "list-issues") {
      await handleListIssues(stream, octokit, owner, repo);
    }
  });
});

server.post("/mcp", async (request, reply) => {
  const stream = new McpStream();
  mcpServer.handleStream(stream);
  stream.duplex.pipe(reply.raw);
  request.raw.pipe(stream.duplex);
});

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
