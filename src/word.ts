import { z } from "zod";

// Enhanced Word schema with better validation
const WordSchema = z.object({
  word: z.string().min(1, "Word cannot be empty"),
  pronunciation: z.string().min(1, "Pronunciation cannot be empty"),
  definition: z.string().min(1, "Definition cannot be empty"),
  context: z.string().optional(),
  other_definitions: z.array(z.string()).optional(),
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
