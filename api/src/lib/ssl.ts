/**
 * Decide o `ssl` do pg a partir da URL — explícito e testável (sem DB vivo).
 *
 * Neon EXIGE SSL; Postgres local roda sem. Em vez de depender do parsing de
 * `sslmode` na connection string (cujo comportamento varia por versão do pg e
 * vai inverter a semântica no pg v9), decidimos aqui de forma determinística.
 * Neon usa cert Let's Encrypt público → `rejectUnauthorized: true` (verifica de
 * verdade, equivale a `verify-full`). Local (sem neon/sslmode) → `false` = plaintext.
 */
export function resolveSsl(databaseUrl: string): false | { rejectUnauthorized: boolean } {
  const isManaged = databaseUrl.includes("neon.tech") || /sslmode=require/.test(databaseUrl);
  return isManaged ? { rejectUnauthorized: true } : false;
}
