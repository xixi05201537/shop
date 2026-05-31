import { Storefront } from "@/components/Storefront";
import { getPublicConfig } from "@/lib/config";
import { parseAmounts } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import "./shop.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const product = await prisma.product.findFirst({ where: { isActive: true } });
  const config = await getPublicConfig();

  if (!product) {
    return (
      <main className="container empty-page">
        <h1 className="display">No product yet</h1>
        <p>Log in to the admin panel and create your single product.</p>
      </main>
    );
  }

  return (
    <Storefront
      config={config}
      product={{
        ...product,
        enabledAmounts: parseAmounts(product.enabledAmounts),
      }}
    />
  );
}
