import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

import { execSync } from "child_process";
function git(command: string): string {
  return execSync(`git ${command}`, { encoding: "utf8" }).trim();
}

process.env.VITE_GIT_VERSION = [
  git("describe --always"),
  git("log -1 --format=%ad --date=short")
].join(", ");

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [preact()]
});
