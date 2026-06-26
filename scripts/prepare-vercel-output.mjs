import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("packages/telegram/dist");
const target = resolve("dist");

if (!existsSync(source)) {
  throw new Error(`Missing Telegram build output: ${source}`);
}

rmSync(target, { force: true, recursive: true });
cpSync(source, target, { recursive: true });

