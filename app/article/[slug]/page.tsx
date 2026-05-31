import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import "../../shop.css";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || !article.published) notFound();

  return (
    <main className="shop-page">
      <article className="container article-page">
        <Link className="support-link" href="/">
          Back to shop
        </Link>
        <h1 className="display">{article.title}</h1>
        <div className="prose">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{article.content}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
