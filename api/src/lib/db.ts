import pkg from "pg";
import { config } from "./config";

// pg é CJS: o default export é o module.exports (objeto com .Pool/.Client).
// Sob ESM, a forma segura é importar o default e desestruturar.
const { Pool } = pkg;
type PoolType = InstanceType<typeof Pool>;
type Row = pkg.QueryResultRow;

let pool: PoolType | undefined;

/** Pool singleton (lazy: só conecta na 1ª query). */
export function getPool(): PoolType {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

/** Executa SQL parametrizado e devolve as linhas tipadas. */
export async function query<T extends Row>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as unknown[]);
  return result.rows;
}

/** Fecha o pool (idempotente). Chamado no onClose do app / shutdown do server. */
export async function closeDb(): Promise<void> {
  if (pool) {
    const p = pool;
    pool = undefined;
    await p.end();
  }
}
