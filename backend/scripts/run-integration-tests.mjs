import { spawnSync } from "node:child_process";

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status}`);
  }
};

const composeArgs = [
  "compose",
  "--env-file",
  ".env.test",
  "-f",
  "docker-compose.test.yml",
];

try {
  run("docker", [...composeArgs, "up", "-d", "--wait", "postgres", "redis"]);
  run("npm", ["run", "test:integration:prepare"]);
  run("npm", ["run", "test:integration:run"]);
} finally {
  const cleanup = spawnSync(
    "docker",
    [...composeArgs, "down", "-v"],
    { cwd: process.cwd(), env: process.env, stdio: "inherit" },
  );

  if (cleanup.error) {
    console.warn("Integration test cleanup failed:", cleanup.error.message);
  }
}
