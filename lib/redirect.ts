export function appUrl(path: string, request: Request) {
  const configured = process.env.APP_URL?.trim();
  if (configured?.startsWith("http")) {
    return new URL(path, configured);
  }

  const origin = new URL(request.url).origin;
  return new URL(path, origin);
}

export function isSafeReturnTo(returnTo: string) {
  if (!returnTo) return false;
  if (!returnTo.startsWith("/")) return false;
  if (returnTo.startsWith("//")) return false;
  return true;
}

export function safeReturnTo(returnTo: string, fallback: string) {
  return isSafeReturnTo(returnTo) ? returnTo : fallback;
}
