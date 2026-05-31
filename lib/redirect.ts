export function appUrl(path: string, request: Request) {
  const configured = process.env.APP_URL || "http://localhost:3000";
  const base = configured.startsWith("http") ? configured : new URL(request.url).origin;
  return new URL(path, base);
}
