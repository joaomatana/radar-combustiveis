import { z } from "zod";

/**
 * Config validada a partir de process.env. Defaults batem com .env.example
 * (dev local roda sem env). Prefere DATABASE_URL; senão monta de POSTGRES_*.
 * Sem dotenv: o shell não carrega .env e os defaults cobrem o dev.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5433),
  POSTGRES_USER: z.string().default("radar"),
  POSTGRES_PASSWORD: z.string().default("radar"),
  POSTGRES_DB: z.string().default("radar"),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const env = envSchema.parse(process.env);

/** DSN efetivo: DATABASE_URL se setado, senão montado de POSTGRES_*. */
const databaseUrl =
  env.DATABASE_URL ??
  `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;

/**
 * CORS_ORIGIN aceita uma origem única ou lista separada por vírgula (prod = domínio
 * do Vercel; permite somar um domínio custom depois). @fastify/cors aceita string|string[].
 */
export function parseCorsOrigin(raw: string): string | string[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : (parts[0] ?? raw);
}

export const config = {
  databaseUrl,
  port: env.PORT,
  host: env.HOST,
  corsOrigin: parseCorsOrigin(env.CORS_ORIGIN),
} as const;
