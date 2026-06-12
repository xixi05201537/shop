import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SelectionSubmissionsGlobalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  next.set("tab", "submissions");
  for (const [key, value] of Object.entries(params)) {
    if (value) next.set(key, value);
  }
  redirect(`/admin/selection-pages?${next.toString()}`);
}
