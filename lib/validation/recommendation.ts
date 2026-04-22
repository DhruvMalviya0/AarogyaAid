import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  lifestyle: z.enum(["Sedentary", "Moderately Active", "Active"]),
  conditions: z.array(z.string()).min(1),
  income: z.string().min(1),
  city: z.string().min(1),
});

export const recommendRequestSchema = z.object({
  query: z.string().min(1),
  profile: profileSchema,
});

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;
