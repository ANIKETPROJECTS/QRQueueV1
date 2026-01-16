import { z } from "zod";

export const queueEntrySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  numberOfPeople: z.number().min(1, "At least 1 person required").max(15, "Maximum 15 people"),
  position: z.number(),
  status: z.enum(["waiting", "called", "cancelled", "completed"]),
  createdAt: z.coerce.date(),
  calledAt: z.coerce.date().optional(),
  visitCount: z.number().default(1),
});

export const insertQueueEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().length(10, "Phone number must be exactly 10 digits").regex(/^\d+$/, "Phone number must only contain digits"),
  numberOfPeople: z.number().min(1, "At least 1 person required").max(15, "Maximum 15 people"),
});

export type QueueEntry = z.infer<typeof queueEntrySchema>;
export type InsertQueueEntry = z.infer<typeof insertQueueEntrySchema>;

export type CreateQueueEntryRequest = InsertQueueEntry;
export type QueueEntryResponse = QueueEntry;
export type QueueListResponse = QueueEntry[];
