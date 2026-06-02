import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [adminCount, productCount, configCount, articleCount, orderCount] = await Promise.all([
    prisma.admin.count(),
    prisma.product.count(),
    prisma.siteConfig.count(),
    prisma.article.count(),
    prisma.order.count(),
  ]);

  const hasExistingData = adminCount + productCount + configCount + articleCount + orderCount > 0;
  if (hasExistingData) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  console.log("Database is empty. Running initial seed.");
  await import("./seed.mjs");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
