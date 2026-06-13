import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

process.env.PORT ||= "4000";

await import("../.next/standalone/server.js");
