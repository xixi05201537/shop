import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedIfNeeded() {
  const [adminCount, productCount, configCount, articleCount] = await Promise.all([
    prisma.admin.count(),
    prisma.product.count(),
    prisma.siteConfig.count(),
    prisma.article.count(),
  ]);

  if (adminCount === 0 && productCount === 0 && configCount === 0 && articleCount === 0) {
    console.log("Database is empty. Running initial seed.");
    const { seedAll } = await import("./seed.mjs");
    await seedAll();
    return;
  }

  if (adminCount === 0) {
    console.log("Admin table is empty. Running seed for default admin.");
    const { seedAdmin } = await import("./seed.mjs");
    await seedAdmin();
  }
  if (productCount === 0) {
    console.log("Product table is empty. Running seed for default product.");
    const { seedProduct } = await import("./seed.mjs");
    await seedProduct();
  }
  if (articleCount === 0) {
    console.log("Article table is empty. Running seed for default article.");
    const { seedArticle } = await import("./seed.mjs");
    await seedArticle();
  }
  if (configCount === 0) {
    console.log("SiteConfig table is empty. Running seed for default configs.");
    const { seedConfigs } = await import("./seed.mjs");
    await seedConfigs();
  }

  console.log("Seed check complete.");
}

seedIfNeeded()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
