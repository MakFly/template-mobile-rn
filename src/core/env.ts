import { z } from 'zod';

/**
 * Validated EXPO_PUBLIC_* environment variables.
 *
 * EXPO_PUBLIC_API_URL: optional. Empty or unset means "use local mocks".
 * When set, it must be a valid http(s) URL.
 *
 * Note: EXPO_PUBLIC_* values are inlined at build time by Metro, so
 * `process.env.EXPO_PUBLIC_API_URL` must be referenced literally (no
 * dynamic access) for the substitution to happen.
 */
const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .union([z.literal(''), z.url()])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  EXPO_PUBLIC_CHAT_ENDPOINT_URL: z
    .union([z.literal(''), z.url()])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_CHAT_ENDPOINT_URL: process.env.EXPO_PUBLIC_CHAT_ENDPOINT_URL,
});

if (!parsed.success) {
  // Fail fast at boot: a misconfigured env must never ship silently.
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export type Env = z.infer<typeof envSchema>;

export const env: Env = parsed.data;
