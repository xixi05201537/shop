import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { capturePaypalOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await request.json().catch(() => ({}))) as { paypalOrderId?: string };

  try {
    const checkout = await prisma.selectionCheckout.findUnique({
      where: { token },
      include: { submissions: { include: { submission: { include: { page: { select: { id: true, slug: true } } } } } } },
    });
    if (!checkout) return NextResponse.json({ error: "Checkout link not found." }, { status: 404 });
    if (checkout.status !== "pending") return NextResponse.json({ error: "This checkout is no longer payable." }, { status: 409 });
    if (!body.paypalOrderId || checkout.paypalOrderId !== body.paypalOrderId) {
      return NextResponse.json({ error: "PayPal order did not match this checkout." }, { status: 400 });
    }

    const capture = await capturePaypalOrder(body.paypalOrderId);
    const purchaseUnits = capture.purchase_units as Array<Record<string, unknown>> | undefined;
    const payments = purchaseUnits?.[0]?.payments as Record<string, unknown> | undefined;
    const captures = payments?.captures as Array<Record<string, unknown>> | undefined;
    const captureId = captures?.[0]?.id as string | undefined;
    const amount = captures?.[0]?.amount as { value?: string; currency_code?: string } | undefined;

    if (amount?.currency_code !== checkout.currency || Math.abs(Number(amount.value) - checkout.totalAmount) > 0.001) {
      return NextResponse.json({ error: "PayPal amount did not match this checkout." }, { status: 400 });
    }

    const paidAt = checkout.paidAt || new Date();
    await prisma.$transaction([
      prisma.selectionCheckout.update({
        where: { id: checkout.id },
        data: {
          status: "paid",
          paidAt,
          paypalCaptureId: captureId || null,
          paypalRawSummary: JSON.stringify(capture).slice(0, 8000),
        },
      }),
      prisma.selectionSubmission.updateMany({
        where: {
          id: { in: checkout.submissions.map((entry) => entry.submissionId) },
          status: { not: "paid" },
        },
        data: { status: "paid" },
      }),
    ]);

    revalidatePath(`/select/checkout/${checkout.token}`);
    revalidatePath("/admin/selection-pages/submissions");
    for (const entry of checkout.submissions) {
      revalidatePath(`/admin/selection-pages/${entry.submission.page.id}/submissions`);
      revalidatePath(`/admin/selection-pages/${entry.submission.page.id}/submissions/${entry.submission.id}`);
      revalidatePath(`/select/${entry.submission.page.slug}/submission/${entry.submission.id}`);
    }

    return NextResponse.json({ status: "paid" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal confirmation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
