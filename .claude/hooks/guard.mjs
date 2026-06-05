import { readFileSync } from "node:fs";
let raw = ""; try { raw = readFileSync(0, "utf8"); } catch {}
let cmd = ""; try { cmd = JSON.parse(raw)?.tool_input?.command ?? ""; } catch { cmd = raw; }
if (/--target\s+prod\b/.test(cmd) || /neon\.tech/.test(cmd) || /docker\s+compose\s+down\b[^\n]*-v\b/.test(cmd) || /\bdrop\s+database\b/i.test(cmd)) {
  console.error("Bloqueado: comando perigoso (prod DB / wipe de volume). Use o Postgres local; prod é manual/CI.");
  process.exit(2);
}
process.exit(0);
