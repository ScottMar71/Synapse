import { z } from "zod";

export const baseEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  TENANT_HEADER_NAME: z.string().min(1)
});

export type BaseEnvironment = z.infer<typeof baseEnvironmentSchema>;
