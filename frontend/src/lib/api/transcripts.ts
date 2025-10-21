export const API_BASE_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:8080";

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
