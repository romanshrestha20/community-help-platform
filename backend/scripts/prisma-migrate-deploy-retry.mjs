import { spawn } from "node:child_process";

const MAX_ATTEMPTS = Number(process.env.PRISMA_MIGRATE_MAX_ATTEMPTS ?? 5);
const BASE_DELAY_MS = Number(process.env.PRISMA_MIGRATE_RETRY_DELAY_MS ?? 15000);
const LOCK_ERROR_MARKERS = [
  "Timed out trying to acquire a postgres advisory lock",
  "Error: P1002",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runPrismaMigrateDeploy = () =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["prisma", "migrate", "deploy"],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      }
    );

    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  console.log(`[render-start] Running prisma migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})`);

  const result = await runPrismaMigrateDeploy();
  if (result.code === 0) {
    console.log("[render-start] Prisma migrations deployed successfully.");
    process.exit(0);
  }

  const isLockTimeout = LOCK_ERROR_MARKERS.some((marker) => result.output.includes(marker));
  if (!isLockTimeout || attempt === MAX_ATTEMPTS) {
    process.exit(result.code);
  }

  const delayMs = BASE_DELAY_MS * attempt;
  console.warn(
    `[render-start] Prisma advisory lock timed out. Retrying in ${Math.ceil(delayMs / 1000)}s...`
  );
  await sleep(delayMs);
}
