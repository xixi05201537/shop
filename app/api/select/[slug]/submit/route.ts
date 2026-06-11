import { NextResponse } from "next/server";
import { sendSelectionEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";
import { selectionSubmissionNumber } from "@/lib/selection";

type SubmitBody = {
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  note?: string;
  items?: Array<{ id?: string; quantity?: number }>;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as SubmitBody;
  const page = await prisma.selectionPage.findUnique({
    where: { slug },
    include: { items: { where: { isActive: true } } },
  });

  if (!page || !page.isPublished) {
    return NextResponse.json({ error: "This selection page is not available." }, { status: 404 });
  }

  const customerName = cleanText(body.customerName);
  const customerEmail = cleanText(body.customerEmail);
  const customerContact = cleanText(body.customerContact);
  const note = cleanText(body.note);

  if (page.showName && page.requireName && !customerName) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (page.showEmail && page.requireEmail && !customerEmail) return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  if (page.showContact && page.requireContact && !customerContact) return NextResponse.json({ error: "Please enter your contact information." }, { status: 400 });

  const requested = new Map<string, number>();
  for (const item of body.items || []) {
    if (!item.id) continue;
    const quantity = Number(item.quantity || 1);
    requested.set(item.id, Number.isFinite(quantity) ? quantity : 1);
  }

  const selected = page.items
    .filter((item) => requested.has(item.id))
    .map((item) => {
      const rawQuantity = page.allowQuantity ? requested.get(item.id) || 1 : 1;
      const quantity = Math.max(item.minQuantity, Math.min(item.maxQuantity, Math.floor(rawQuantity)));
      const lineTotal = item.price === null ? null : Number((item.price * quantity).toFixed(2));
      return { item, quantity, lineTotal };
    });

  if (!selected.length) {
    return NextResponse.json({ error: "Please select at least one item." }, { status: 400 });
  }

  const totalQuantity = selected.reduce((sum, entry) => sum + entry.quantity, 0);
  const pricedSelections = selected.filter((entry) => entry.lineTotal !== null);
  const totalAmount = pricedSelections.length
    ? Number(pricedSelections.reduce((sum, entry) => sum + (entry.lineTotal || 0), 0).toFixed(2))
    : null;

  const submission = await prisma.selectionSubmission.create({
    data: {
      pageId: page.id,
      customerName: page.showName && customerName ? customerName : null,
      customerEmail: page.showEmail && customerEmail ? customerEmail : null,
      customerContact: page.showContact && customerContact ? customerContact : null,
      note: note || null,
      totalQuantity,
      totalAmount,
      items: {
        create: selected.map(({ item, quantity, lineTotal }) => ({
          itemId: item.id,
          titleSnapshot: item.title,
          imageSnapshot: item.imageUrl,
          descriptionSnapshot: item.description,
          priceSnapshot: item.price,
          currencySnapshot: item.currency,
          quantity,
          lineTotal,
        })),
      },
    },
    include: {
      page: { select: { title: true, slug: true } },
      items: true,
    },
  });

  if (submission.customerEmail) {
    try {
      await sendSelectionEmail(submission, appUrl("/", request).origin);
    } catch (error) {
      console.error("Selection email failed", error);
    }
  }

  return NextResponse.json({
    ok: true,
    submissionId: submission.id,
    reference: selectionSubmissionNumber(submission.id),
    path: `/select/${page.slug}/submission/${submission.id}`,
  });
}
