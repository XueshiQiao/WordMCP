import { z } from "zod";

// Enhanced Word schema with better validation
const WordSchema = z.object({
  word: z
    .string()
    .min(1, "Word cannot be empty")
    .describe("单词或者词组，英文单词或者词组"),
  pronunciation: z
    .string()
    .min(1, "Pronunciation cannot be empty")
    .describe("单词发音"),
  definition: z
    .string()
    .min(1, "Definition cannot be empty")
    .describe("单词或者词组在 context的中文释义"),
  context: z
    .string()
    .describe("单词或者词组出现的上下文句子，必须是英文")
    .optional(),
  other_definitions: z
    .array(z.string())
    .describe("其他的释义（如果还有的话），必须为中文释义")
    .optional(),
  id: z.number().optional(),
});

// Type inference from schema
type Word = z.infer<typeof WordSchema>;

// Validation helper functions
export const validateWord = (data: unknown): Word => {
  return WordSchema.parse(data);
};

export const validateWordSafe = (
  data: unknown
): { success: true; data: Word } | { success: false; error: z.ZodError } => {
  const result = WordSchema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
};

export { WordSchema, Word };
