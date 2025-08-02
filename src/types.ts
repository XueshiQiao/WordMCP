import { z } from "zod";

// Error response types
export interface ErrorResponse {
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
  };
  id: string | null;
}

// Environment variable validation schema
export const EnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, "GitHub token is required"),
  GITHUB_OWNER: z.string().min(1, "GitHub owner is required"),
  GITHUB_REPO: z.string().min(1, "GitHub repository is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default("3000"),
  HOST: z.string().default("localhost"),
  CORS_ORIGINS: z
    .string()
    .default("*")
    .transform((val) =>
      val === "*" ? ["*"] : val.split(",").map((s) => s.trim())
    ),
});

export type Env = z.infer<typeof EnvSchema>;

// MCP Server configuration
export const mcpConfig = {
  name: "words_mcp",
  version: "1.0.0",
};
