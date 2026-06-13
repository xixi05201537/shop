import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statusColumns = [
  {
    table: "SelectionSubmission",
    column: "status",
    fallback: "pending",
    allowed: ["pending", "confirmed", "paying", "paid", "cancelled", "completed"],
  },
  {
    table: "SelectionCheckout",
    column: "status",
    fallback: "pending",
    allowed: ["pending", "paying", "paid", "cancelled"],
  },
  {
    table: "SelectionCheckout",
    column: "emailStatus",
    fallback: "pending",
    allowed: ["pending", "sending", "sent", "failed", "skipped", "disabled"],
  },
  {
    table: "PaymentRequest",
    column: "status",
    fallback: "pending",
    allowed: ["pending", "confirmed", "deferred", "paying", "paid", "cancelled"],
  },
  {
    table: "PaymentRequest",
    column: "emailStatus",
    fallback: "pending",
    allowed: ["pending", "sending", "sent", "failed", "skipped", "disabled"],
  },
  {
    table: "PaymentRequest",
    column: "paidEmailStatus",
    fallback: "pending",
    allowed: ["pending", "sending", "sent", "failed", "skipped", "disabled"],
  },
  {
    table: "Order",
    column: "status",
    fallback: "created",
    allowed: ["created", "paying", "paid", "cancelled", "refunded", "failed"],
  },
  {
    table: "Order",
    column: "buyerEmailStatus",
    fallback: "pending",
    allowed: ["pending", "sending", "sent", "failed", "skipped", "disabled"],
  },
  {
    table: "Order",
    column: "adminEmailStatus",
    fallback: "pending",
    allowed: ["pending", "sending", "sent", "failed", "skipped", "disabled"],
  },
  {
    table: "Order",
    column: "shipmentEmailStatus",
    fallback: "pending",
    allowed: ["pending", "sending", "sent", "failed", "skipped", "disabled"],
  },
];

function quoteIdentifier(identifier) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

async function resolveTableName(table) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT TABLE_NAME AS tableName FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) LIMIT 1",
    table,
  );
  return rows[0]?.tableName ?? null;
}

async function columnExists(table, column) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    table,
    column,
  );
  return rows.length > 0;
}

async function normalizeStatusColumns() {
  for (const { table, column, fallback, allowed } of statusColumns) {
    const tableName = await resolveTableName(table);
    if (!tableName || !(await columnExists(tableName, column))) continue;

    const placeholders = allowed.map(() => "?").join(", ");
    await prisma.$executeRawUnsafe(
      `UPDATE ${quoteIdentifier(tableName)} SET ${quoteIdentifier(column)} = ? WHERE ${quoteIdentifier(column)} IS NULL OR ${quoteIdentifier(column)} NOT IN (${placeholders})`,
      fallback,
      ...allowed,
    );
  }
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

async function main() {
  await normalizeStatusColumns();
  await prisma.$disconnect();
  run("prisma db push --accept-data-loss --skip-generate");
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
