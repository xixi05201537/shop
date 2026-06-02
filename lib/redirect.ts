export function appUrl(path: string, request: Request) {
  const configured = process.env.APP_URL?.trim();
  const base = configured?.startsWith("http") ? configured : new URL(request.url).origin;
  return new URL(path, base);
}
