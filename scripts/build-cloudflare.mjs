import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["node_modules/vinext/dist/cli.js", "build"], {
  stdio: "inherit",
  env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Cloudflare static homepage and client assets are ready. Live APIs are served by cloudflare/worker.ts.");
