/**
 * Start Next.js production server with environment-specific env files.
 *
 * Usage:
 *   node scripts/next-start.mjs          # loads .env.local (default)
 *   APP_ENV=prod node scripts/next-start.mjs  # loads .env.production
 */
import { config } from "dotenv";
import { spawn } from "node:child_process";

// Load base .env first (shared defaults)
config();

// Load environment-specific overrides
const appEnv = process.env.APP_ENV || "local";
const envFiles = { local: ".env.local", test: ".env.test", prod: ".env.production" };
const envFile = envFiles[appEnv];
if (envFile) {
  config({ path: envFile, override: true });
}

console.log(`[env] APP_ENV=${appEnv} — DATABASE_URL=${process.env.DATABASE_URL}`);

const child = spawn("next", ["start"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 1));
