import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Word } from "../word.js";
import { WordSchema } from "../word.js";
import { GitHubService } from "./github.service.js";
import { handleZodError, handleGenericError } from "../errors.js";

export class McpService {
  private server: McpServer;
  private githubService: GitHubService;

  constructor(githubService: GitHubService) {
    this.githubService = githubService;
    this.server = new McpServer({
      name: "words_mcp",
      version: "1.0.0",
    });
    this.registerTools();
  }

  private registerTools(): void {
    // Register add-word tool
    this.server.registerTool(
      "add-word",
      {
        title: "Add word",
        description: "Add a word to the list",
        inputSchema: WordSchema.shape,
      },
      async (args: Word) => {
        try {
          const word = WordSchema.parse(args);
          const result = await this.githubService.createWordIssue(word);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: true, data: result }, null, 2),
              },
            ],
          };
        } catch (error) {
          if (error instanceof z.ZodError) {
            return handleZodError(error);
          }
          return handleGenericError(error);
        }
      }
    );

    // Register list-words tool
    this.server.registerTool(
      "list-words",
      {
        title: "List words",
        description: "List all words",
      },
      async () => {
        try {
          const words = await this.githubService.listWordIssues();
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(words, null, 2),
              },
            ],
          };
        } catch (error) {
          return handleGenericError(error);
        }
      }
    );

    // Register get-word tool
    this.server.registerTool(
      "get-word",
      {
        title: "Get word",
        description: "Get a specific word by ID",
        inputSchema: {
          id: z.number(),
        },
      },
      async (args: { id: number }) => {
        try {
          const word = await this.githubService.getWordIssue(args.id);
          if (!word) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ error: "Word not found" }, null, 2),
                },
              ],
            };
          }
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(word, null, 2),
              },
            ],
          };
        } catch (error) {
          return handleGenericError(error);
        }
      }
    );
  }

  getServer(): McpServer {
    return this.server;
  }
}
