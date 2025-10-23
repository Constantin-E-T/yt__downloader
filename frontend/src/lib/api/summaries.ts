import { API_BASE_PATH } from "@/lib/api/transcripts";

type SummaryContent = {
  text: string;
  key_points?: string[];
  sections?: Array<{ title: string; content: string }>;
};

export type SummaryResponse = {
  id: string;
  transcript_id: string;
  summary_type: string;
  content: SummaryContent;
  model: string;
  tokens_used: number;
  created_at: string;
};

type ErrorResponse = {
  error: string;
  message?: string;
  status_code?: number;
};

export async function requestSummary(params: {
  transcriptId: string;
  summaryType: string;
}): Promise<{ data?: SummaryResponse; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_PATH}/${encodeURIComponent(params.transcriptId)}/summarize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary_type: params.summaryType }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
      const message =
        payload?.error ??
        payload?.message ??
        `Unexpected error while generating summary (status ${response.status})`;
      return { error: message };
    }

    const payload = (await response.json()) as SummaryResponse;
    return { data: payload };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to reach backend: ${error.message}`
        : "Failed to reach backend: unknown error";
    return { error: message };
  }
}
