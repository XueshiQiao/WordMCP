import { z } from "zod";

const WordSchema = z.object({
  word: z.string(),
  pronunciation: z.string(),
  definition: z.string(),
  context: z.string().optional(),
  other_definitions: z.array(z.string()).optional(),
  id: z.number().optional(),
});
type Word = z.infer<typeof WordSchema>;

export { WordSchema, Word };
