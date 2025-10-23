const rawApiBaseUrl =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:8080";

export const API_BASE_URL = normalizeBaseUrl(rawApiBaseUrl);

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

export type TranscriptLine = {
  start: number;
  duration: number;
  text: string;
};

export type TranscriptResponse = {
  transcript_id: string;
  video_id: string;
  title: string;
  language: string;
  transcript: TranscriptLine[];
};

export type ExportFormat = "json" | "text";

type ErrorResponse = {
  error: string;
  message?: string;
  status_code?: number;
};

export async function requestTranscript(params: {
  video_url: string;
  language?: string;
}): Promise<{ data?: TranscriptResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/transcripts/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
      const message =
        payload?.error ??
        payload?.message ??
        `Unexpected error while fetching transcript (status ${response.status})`;
      return { error: message };
    }

    const payload = (await response.json()) as TranscriptResponse;
    return { data: payload };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to reach backend: ${error.message}`
        : "Failed to reach backend: unknown error";
    return { error: message };
  }
}

export async function requestTranscriptExport({
  transcriptId,
  format,
  signal,
}: {
  transcriptId: string;
  format: ExportFormat;
  signal?: AbortSignal;
}): Promise<{ blob?: Blob; filename?: string; error?: string }> {
  const url = `${API_BASE_URL}/api/v1/transcripts/${encodeURIComponent(
    transcriptId
  )}/export?format=${encodeURIComponent(format)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      signal,
    });

    if (!response.ok) {
      const isJSON = response.headers.get("Content-Type")?.includes("application/json");
      const payload = isJSON
        ? ((await response.json().catch(() => null)) as ErrorResponse | null)
        : null;
      const message =
        payload?.error ??
        payload?.message ??
        `Export failed with status ${response.status}. Please try again.`;
      return { error: message };
    }

    const disposition = response.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch?.[1];
    const blob = await response.blob();

    return { blob, filename };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to reach backend: ${error.message}`
        : "Failed to reach backend: unknown error.";
    return { error: message };
  }
}

export async function requestTranscriptById(
  transcriptId: string
): Promise<{ data?: TranscriptResponse; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/transcripts/${encodeURIComponent(transcriptId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ErrorResponse
        | null;
      const message =
        payload?.error ??
        payload?.message ??
        `Unexpected error while fetching cached transcript (status ${response.status})`;
      return { error: message };
    }

    const payload = (await response.json()) as TranscriptResponse;
    return { data: payload };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to reach backend: ${error.message}`
        : "Failed to reach backend: unknown error";
    return { error: message };
  }
}
