import { z } from "zod";
import { insertQueueEntrySchema, queueEntrySchema } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  queue: {
    list: {
      method: "GET" as const,
      path: "/api/queue",
      responses: {
        200: z.array(queueEntrySchema),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/queue/:id",
      responses: {
        200: queueEntrySchema,
        404: errorSchemas.notFound,
      },
    },
    getByPhone: {
      method: "GET" as const,
      path: "/api/queue/phone/:phoneNumber",
      responses: {
        200: queueEntrySchema.nullable(),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/queue",
      input: insertQueueEntrySchema,
      responses: {
        201: queueEntrySchema,
        400: errorSchemas.validation,
      },
    },
    cancel: {
      method: "PATCH" as const,
      path: "/api/queue/:id/cancel",
      responses: {
        200: queueEntrySchema,
        404: errorSchemas.notFound,
      },
    },
    position: {
      method: "GET" as const,
      path: "/api/queue/:id/position",
      responses: {
        200: z.object({
          position: z.number(),
          totalWaiting: z.number(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type QueueInput = z.infer<typeof api.queue.create.input>;
export type QueueResponse = z.infer<typeof api.queue.create.responses[201]>;
export type QueueListResponse = z.infer<typeof api.queue.list.responses[200]>;
export type PositionResponse = z.infer<typeof api.queue.position.responses[200]>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
