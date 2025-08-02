import { z } from "zod";
import type { ErrorResponse } from "./types.js";

// Custom error classes
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError["errors"]
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

// Error response factory
export const createErrorResponse = (
  code: number,
  message: string,
  id: string | null = null
): ErrorResponse => ({
  jsonrpc: "2.0",
  error: { code, message },
  id,
});

// Common error responses
export const ERROR_RESPONSES = {
  INVALID_SESSION: createErrorResponse(-32000, "Invalid or missing session ID"),
  VALIDATION_ERROR: createErrorResponse(-32602, "Invalid parameters"),
  INTERNAL_ERROR: createErrorResponse(-32603, "Internal error"),
  GITHUB_API_ERROR: createErrorResponse(-32001, "GitHub API error"),
} as const;

// Error handling utilities
export const handleZodError = (error: z.ZodError) => {
  console.error("Validation error:", error.errors);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { error: "Validation failed", details: error.errors },
          null,
          2
        ),
      },
    ],
  };
};

export const handleGenericError = (error: unknown) => {
  console.error("Unexpected error:", error);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: "Internal server error" }, null, 2),
      },
    ],
  };
};
