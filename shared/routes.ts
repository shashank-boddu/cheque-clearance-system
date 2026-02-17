import { z } from 'zod';
import { insertChequeSchema, cheques, blocks, users } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
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

// ============================================
// API CONTRACT
// ============================================
export const api = {
  cheques: {
    list: {
      method: 'GET' as const,
      path: '/api/cheques' as const,
      responses: {
        200: z.array(z.custom<typeof cheques.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cheques/:id' as const,
      responses: {
        200: z.custom<typeof cheques.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cheques' as const,
      input: insertChequeSchema,
      responses: {
        201: z.custom<typeof cheques.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    // The "process" endpoint triggers AI verification & clearance logic
    process: {
        method: 'POST' as const,
        path: '/api/cheques/:id/process' as const,
        responses: {
            200: z.custom<typeof cheques.$inferSelect>(),
            404: errorSchemas.notFound,
            400: errorSchemas.validation
        }
    }
  },
  blocks: {
    list: {
      method: 'GET' as const,
      path: '/api/blocks' as const,
      responses: {
        200: z.array(z.custom<typeof blocks.$inferSelect>()),
      },
    },
  },
  users: {
      list: {
          method: 'GET' as const,
          path: '/api/users' as const,
          responses: {
              200: z.array(z.custom<typeof users.$inferSelect>())
          }
      },
      get: {
          method: 'GET' as const,
          path: '/api/users/:id' as const,
          responses: {
              200: z.custom<typeof users.$inferSelect>(),
              404: errorSchemas.notFound
          }
      }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
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
