import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.url(),
    INTERNAL_API_KEY: z.string().min(16),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
