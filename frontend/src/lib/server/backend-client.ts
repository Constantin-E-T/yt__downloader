const rawBaseUrl =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:8080";

const backendBaseUrl = normalizeBaseUrl(rawBaseUrl);

function normalizeBaseUrl(url: string): string {
  if (!url) {
    return url;
  }
  let normalized = url.trim();
  while (normalized.endsWith("/") && !normalized.endsWith("://")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function getBackendBaseUrl(): string {
  return backendBaseUrl;
}

export async function backendFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url =
    backendBaseUrl +
    (path.startsWith("/") ? path : `/${path}`);

  const headers =
    init.headers instanceof Headers
      ? init.headers
      : new Headers(init.headers);

  return fetch(url, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
}
