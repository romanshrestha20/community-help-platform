import { spawn } from "node:child_process";

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });

const nodeCommand = process.execPath;

const migrateExitCode = await run(nodeCommand, ["scripts/prisma-migrate-deploy-retry.mjs"]);
if (migrateExitCode !== 0) {
  process.exit(migrateExitCode);
}

const serverExitCode = await run(nodeCommand, ["dist/src/server.js"]);
process.exit(serverExitCode);
