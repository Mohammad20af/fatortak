import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { loadEnv } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const env = { ...loadEnv("development", root), ...process.env };
const api = new URL(env.VITE_API_URL || "http://localhost:3000/api");
const healthUrl = `${api.href.replace(/\/$/, "")}/health`;
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill();
}

process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());
process.once("exit", () => {
  for (const child of children) child.kill();
});

function launch(label, args, options) {
  const child = spawn(process.execPath, args, { stdio: "inherit", ...options });
  children.add(child);
  child.once("error", (error) => {
    console.error(`${label} could not start: ${error.message}`);
    stop(1);
  });
  child.once("exit", (code, signal) => {
    children.delete(child);
    if (!stopping) {
      console.error(`${label} stopped (${signal || code}).`);
      stop(code || 1);
    }
  });
  return child;
}

async function backendReady() {
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok && (await response.json()).status === "ok";
  } catch {
    return false;
  }
}

try {
  if (["localhost", "127.0.0.1", "[::1]"].includes(api.hostname)) {
    if (await backendReady()) {
      console.log(`Using the running Fatortak backend at ${api.origin}.`);
    } else {
      const backend = path.resolve(
        root,
        env.FATORTAK_BACKEND_PATH || "../fatortak",
      );
      if (!existsSync(path.join(backend, "index.js"))) {
        throw new Error(
          "Backend not found. Set FATORTAK_BACKEND_PATH to its directory, or use npm run dev:frontend with a separately running API.",
        );
      }
      console.log(`Starting the Fatortak backend at ${api.origin}...`);
      launch("Backend", ["index.js"], {
        cwd: backend,
        env: {
          ...process.env,
          PORT: api.port || (api.protocol === "https:" ? "443" : "80"),
        },
      });
      const deadline = Date.now() + 45000;
      while (!stopping && !(await backendReady())) {
        if (Date.now() >= deadline) {
          throw new Error(
            "Backend did not become ready. Check its output above and its MongoDB connection in the backend .env file.",
          );
        }
        await delay(250);
      }
    }
  }

  if (!stopping) {
    const vite = path.join(
      path.dirname(fileURLToPath(import.meta.resolve("vite/package.json"))),
      "bin/vite.js",
    );
    launch("Frontend", [vite, ...process.argv.slice(2)], { cwd: root });
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
