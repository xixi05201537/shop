export function appUrl(path: string, request: Request) {
  const configured = process.env.APP_URL?.trim();
  if (configured?.startsWith("http")) return new URL(path, configured);

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0];
  const proto = forwardedProto || new URL(request.url).protocol.replace(":", "");
  const base = host ? `${proto}://${host}` : new URL(request.url).origin;

  return new URL(path, base);
}
