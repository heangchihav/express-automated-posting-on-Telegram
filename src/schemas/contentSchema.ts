// src/schemas/contentSchema.ts
import { z } from "zod";

export const createContentSchema = z.object({
  text: z.string().min(1, "Text is required"),
  imageUrl: z.string().url().optional(),
  scheduleAt: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid date format",
    })
    .optional(),
  endDate: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid date format",
    })
    .optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  active: z.boolean().optional(),
});

export const updateContentSchema = z.object({
  text: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  scheduleAt: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid date format",
    })
    .optional(),
  endDate: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid date format",
    })
    .optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  active: z.boolean().optional(),
});
