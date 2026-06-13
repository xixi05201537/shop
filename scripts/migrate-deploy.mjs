import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function tableExists(name) {
  const rows = await prisma.$queryRawUnsafe("SHOW TABLES LIKE ?", name);
  return rows.length > 0;
}

async function columnExists(table, column) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    table,
    column,
  );
  return rows.length > 0;
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

async function main() {
  const migrationsTableExists = await tableExists("_prisma_migrations");

  if (!migrationsTableExists) {
    const hasExistingTables = await tableExists("Admin") || await tableExists("Product") || await tableExists("Order");
    if (hasExistingTables) {
      console.log("Existing database detected without Prisma migration history. Baselining...");
      run("prisma migrate resolve --applied 20240613000000_init");
      // If the schema already looks hardened (e.g. AuditLog.updatedAt exists), mark the hardening migration as applied too.
      if (await columnExists("AuditLog", "updatedAt")) {
        run("prisma migrate resolve --applied 20240613000001_schema_hardening");
      }
    }
  }

  run("prisma migrate deploy");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
