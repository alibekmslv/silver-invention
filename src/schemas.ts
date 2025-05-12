import { z } from "zod";

export const OptionSchema = z.tuple([
  z.object({ option: z.literal("A"), value: z.string() }),
  z.object({ option: z.literal("B"), value: z.string() }),
  z.object({ option: z.literal("C"), value: z.string() }),
  z.object({ option: z.literal("D"), value: z.string() }),
]);

export const QuestionSchema = z.object({
  title: z.string(),
  options: OptionSchema,
  answer: z.enum(["A", "B", "C", "D"]),
});

export const QuizSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(QuestionSchema),
  meta: z
    .object({
      level: z.string().optional(),
      page: z.string().optional(),
    })
    .optional(),
});

export type Quiz = z.infer<typeof QuizSchema>;
