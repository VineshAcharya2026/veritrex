#!/usr/bin/env node
/**
 * Cloudflare deploy helper — avoids Windows path issues when the project
 * folder contains "&" (npm .bin and OpenNext standalone both break).
 *
 * When the project path contains "&", builds/deploys from a sibling copy at
 * ../trusthire-build. node_modules is copied (not junctioned) so Next/OpenNext
 * do not resolve realpaths back to the "&" folder.
 *
 * Always deploys via `opennextjs-cloudflare deploy` (sets OPEN_NEXT_DEPLOY)
 * so wrangler does not recurse back into OpenNext.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const needsCleanPath = root.includes("&");
const buildRoot = needsCleanPath
  ? path.join(path.dirname(root), "trusthire-build")
  : root;

function run(cmd, args, cwd, label, opts = {}) {
  console.log(`\n▶ ${label}\n`);
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  const status = result.status ?? 1;
  if (opts.acceptStatus ? !opts.acceptStatus(status) : status !== 0) {
    process.exit(status);
  }
}

function robocopy(src, dest, extraArgs, label) {
  run("robocopy", [src, dest, ...extraArgs], root, label, {
    acceptStatus: (c) => c <= 7,
  });
}

if (needsCleanPath) {
  console.log(`\n▶ Syncing to clean build path: ${buildRoot}\n`);
  mkdirSync(buildRoot, { recursive: true });

  robocopy(
    root,
    buildRoot,
    [
      "/E",
      "/XD",
      "node_modules",
      ".next",
      ".open-next",
      ".git",
      "trusthire-build",
      "/NFL",
      "/NDL",
      "/NJH",
      "/NJS",
      "/nc",
      "/ns",
      "/np",
    ],
    "Robocopy source → trusthire-build"
  );

  // Physical copy — junctions resolve realpath back to the "&" folder and break OpenNext
  const nmSrc = path.join(root, "node_modules");
  const nmDest = path.join(buildRoot, "node_modules");
  if (!existsSync(path.join(nmDest, "next", "package.json"))) {
    robocopy(
      nmSrc,
      nmDest,
      ["/E", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"],
      "Robocopy node_modules → trusthire-build"
    );
  } else {
    console.log("\n▶ Reusing existing trusthire-build/node_modules\n");
  }
}

const opennextCli = path.join(
  buildRoot,
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "index.js"
);

run(process.execPath, [opennextCli, "build"], buildRoot, "OpenNext build");
run(process.execPath, [opennextCli, "deploy"], buildRoot, "OpenNext deploy");
