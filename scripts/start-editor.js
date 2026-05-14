import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dryRun = process.argv.includes("--check");
const preferredPort = Number(process.env.PORT || 5173);

if (dryRun) {
  console.log(`Start editor check: http://127.0.0.1:${preferredPort}/editor-next/`);
  process.exit(0);
}

const server = spawn(process.execPath, ["scripts/serve-editor-next.js"], {
  cwd: root,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"]
});

let opened = false;

server.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  const url = text.match(/https?:\/\/127\.0\.0\.1:\d+\/editor-next\//)?.[0];
  if (url && !opened) {
    opened = true;
    openBrowser(url);
  }
});

server.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

server.on("exit", (code) => {
  process.exitCode = code || 0;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.kill(signal);
  });
}

function openBrowser(url) {
  const command = process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "cmd"
      : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const opener = spawn(command, args, { stdio: "ignore", detached: true });
  opener.unref();
}
