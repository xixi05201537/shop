import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(process.cwd(), ".next/static");
const target = resolve(process.cwd(), ".next/standalone/.next/static");
const publicSource = resolve(process.cwd(), "public");
const publicTarget = resolve(process.cwd(), ".next/standalone/public");

if (existsSync(source)) {
  await mkdir(resolve(process.cwd(), ".next/standalone/.next"), { recursive: true });
  await cp(source, target, { recursive: true, force: true });
}

if (existsSync(publicSource)) {
  await cp(publicSource, publicTarget, { recursive: true, force: true });
}
