#!/usr/bin/env node
/**
 * Default `npm run build`:
 * - Local / non-CI: plain Next.js production build (used by OpenNext via `cf:build`).
 * - CI (Cloudflare Git): standalone Next + OpenNext bundle for `wrangler deploy`.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ci from "ci-info";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const opennextCli = path.join(
  root,
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "index.js"
);

function run(label, file, args, env = {}) {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...env },
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    console.error(`\n${label} failed with exit code ${code}`);
    process.exit(code);
  }
}

if (ci.isCI) {
  run("Next.js (standalone)", nextBin, ["build"], {
    NEXT_PRIVATE_STANDALONE: "true",
    NEXT_PRIVATE_OUTPUT_TRACE_ROOT: root,
  });
  run("OpenNext bundle", opennextCli, ["build", "--skipNextBuild"]);
} else {
  run("Next.js", nextBin, ["build"]);
}
