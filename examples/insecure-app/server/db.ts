/**
 * Server-side database access reading DATABASE_URL from process.env.
 * Guardian classifies this as MEDIUM because it is server-only and not bundled
 * into the browser, but still surfaces it for traceability.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}
