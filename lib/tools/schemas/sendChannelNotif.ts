// lib/tools/schemas/sendChannelNotif.ts
import { z } from "zod";

export const SendChannelNotifSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message content is required.")
    .max(2000, "Message cannot exceed 2000 characters."),
  title: z
    .string()
    .trim()
    .max(200, "Title cannot exceed 200 characters.")
    .optional(),
  level: z.enum(["info", "warning", "urgent"]).default("info"),
});

export type SendChannelNotifInput = z.infer<typeof SendChannelNotifSchema>;
