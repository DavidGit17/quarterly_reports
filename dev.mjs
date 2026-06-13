import { spawn } from "node:child_process";
import { watch, existsSync } from "node:fs";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envFiles = [".env", ".env.local", ".env.development", ".env.production"];

let child = null;
let manifestTimer = null;
let restartTimer = null;

const ensureBuildManifest = () => {
  const dir = ".next/server/pages/_app";
  const file = `${dir}/build-manifest.json`;
  if (!existsSync(file)) {
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, '{"pages":{}}');
    } catch {
      // .next may not exist yet
    }
  }
};

const startChild = () => {
  child = spawn("next", ["dev", "--turbopack"], {
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("exit", (code) => {
    child = null;
    if (code !== 0 && code !== null) {
      process.exit(code);
    }
  });
};

const start = () => {
  ensureBuildManifest();
  startChild();

  manifestTimer = setInterval(() => {
    if (child) ensureBuildManifest();
  }, 2000);
};

const restart = () => {
  console.log("\n[dev] .env file changed, restarting...\n");
  if (manifestTimer) clearInterval(manifestTimer);

  if (child) {
    child.kill("SIGTERM");
    child = null;
  }

  setTimeout(start, 500);
};

start();

const watchers = envFiles.map((file) => {
  const path = resolve(file);

  try {
    readFileSync(path);
  } catch {
    return null;
  }

  let timer = null;

  try {
    const watcher = watch(path, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(restart, 1000);
    });
    return watcher;
  } catch {
    return null;
  }
});

process.on("SIGTERM", () => {
  watchers.forEach((w) => w?.close());
  if (manifestTimer) clearInterval(manifestTimer);
  if (restartTimer) clearTimeout(restartTimer);
  if (child) child.kill("SIGTERM");
  process.exit(0);
});
