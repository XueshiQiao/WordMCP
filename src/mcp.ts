import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import cors from "cors";

// import { Octokit } from "@octokit/rest";

// {
//     "word": "evade",
//     "pronunciation": "/ɪˈveɪd/",
//     "definition": "vt. 回避，躲避（问题）",
//     "context": "America’s vice-president evaded a question about whether the targets had been “totally obliterated”, as Donald Trump had claimed.",
//     "other_definitions": [
//         "vt. 逃避（责任、法律等）",
//         "vi. 逃脱，躲避"
//     ],
//     "id": 0
// }

const wordStructure = {
  word: z.string(),
  pronunciation: z.string(),
  definition: z.string(),
  context: z.string(),
  other_definitions: z.array(z.string()),
  id: z.number(),
};
const WordSchema = z.object(wordStructure);
type Word = z.infer<typeof WordSchema>;

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

// const server = new McpServer({
//   name: "words_mcp",
//   version: "0.0.1",
// });

// server.registerTool(
//   "list",
//   {
//     title: "List words",
//     description: "List all words",
//     inputSchema: WordSchema.shape,
//   },
//   async (args: Word) => {
//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(args, null, 2),
//         },
//       ],
//     };
//   }
// );

// // const transport = new StreamableHTTPServerTransport({
// //   sessionIdGenerator: () => crypto.randomUUID(),
// // });
// const transport = new StdioServerTransport();
// console.log("Starting server...");
// await server.connect(transport);
// console.log("Server started");

// export async function handleAddIssue(
//   stream: McpStream,
//   octokit: Octokit,
//   owner: string,
//   repo: string,
//   args: any
// ) {
//   try {
//     const word = args as Word;
//     // Create a formatted title and body for the GitHub issue
//     const title = `New Word: ${word.body}`;
//     const issueBody = `
// **Pronunciation:** ${word.pronunciation}
// **Meaning:** ${word.meaning}
// **Samples:**
// ${word.samples.map((sample) => `- ${sample}`).join("\n")}
// `;
//     const response = await octokit.issues.create({
//       owner,
//       repo,
//       title,
//       body: issueBody,
//     });
//     stream.write(JSON.stringify(response.data));
//     stream.end();
//   } catch (error) {
//     stream.write(JSON.stringify({ error: "Failed to create issue" }));
//     stream.end();
//   }
// }

// export async function handleListIssues(
//   stream: McpStream,
//   octokit: Octokit,
//   owner: string,
//   repo: string
// ) {
//   try {
//     const response = await octokit.issues.listForRepo({
//       owner,
//       repo,
//     });

//     stream.write(JSON.stringify(response.data));
//     stream.end();
//   } catch (error) {
//     stream.write(JSON.stringify({ error: "Failed to list issues" }));
//     stream.end();
//   }
// }
