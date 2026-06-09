import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { saveEmailForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const formData = await request.formData();
  await saveEmailForm(formData);
  const tab = String(formData.get("tab") || "");
  const params = new URLSearchParams({ saved: "1" });
  if (["buyer", "seller", "shipment"].includes(tab)) params.set("tab", tab);
  return NextResponse.redirect(appUrl(`/admin/email?${params.toString()}`, request), { status: 303 });
}
