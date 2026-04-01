import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();
const nextDir = join(projectRoot, ".next");

if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
}

const child =
  process.platform === "win32"
    ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx next dev"], {
        cwd: projectRoot,
        stdio: "inherit",
        shell: false
      })
    : spawn("npx", ["next", "dev"], {
        cwd: projectRoot,
        stdio: "inherit",
        shell: false
      });

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
