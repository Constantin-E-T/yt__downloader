import { API_BASE_URL } from "@/lib/api/transcripts";

export type QAResponse = {
  id: string;
  transcript_id: string;
  question: string;
  answer: string;
  confidence: "high" | "medium" | "low" | "not_found";
  sources: Array<{
    quote: string;
    timestamp?: string;
  }>;
  model: string;
  tokens_used: number;
  created_at: string;
};

type ErrorResponse = {
  error: string;
  message?: string;
  status_code?: number;
};

type RawQAResponse = {
  id: string;
  transcript_id: string;
  question: string;
  answer: string;
  confidence: string;
  sources: Array<{ quote: string; timestamp?: string }> | string[];
  not_found?: boolean;
  model: string;
  tokens_used: number;
  created_at: string;
};

function normaliseSources(
  sources: RawQAResponse["sources"]
): QAResponse["sources"] {
  if (!Array.isArray(sources)) {
    return [];
  }

  if (sources.length === 0) {
    return [];
  }

  if (typeof sources[0] === "string") {
    return (sources as string[]).map((quote) => ({
      quote,
    }));
  }

  return (sources as Array<{ quote: string; timestamp?: string }>).map(
    (source) => ({
      quote: source.quote,
      timestamp: source.timestamp,
    })
  );
}

function normaliseConfidence(
  confidence: string,
  notFound?: boolean
): QAResponse["confidence"] {
  if (notFound) {
    return "not_found";
  }

  const lowered = confidence.toLowerCase();
  if (lowered === "high" || lowered === "medium" || lowered === "low") {
    return lowered;
  }

  return "low";
}

export async function requestQA(params: {
  transcriptId: string;
  question: string;
}): Promise<{ data?: QAResponse; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/transcripts/${encodeURIComponent(
        params.transcriptId
      )}/qa`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: params.question }),
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
        `Unexpected error while generating answer (status ${response.status})`;
      return { error: message };
    }

    const payload = (await response.json()) as RawQAResponse;
    const data: QAResponse = {
      id: payload.id,
      transcript_id: payload.transcript_id,
      question: payload.question,
      answer: payload.answer,
      confidence: normaliseConfidence(payload.confidence, payload.not_found),
      sources: normaliseSources(payload.sources),
      model: payload.model,
      tokens_used: payload.tokens_used,
      created_at: payload.created_at,
    };

    return { data };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to reach backend: ${error.message}`
        : "Failed to reach backend: unknown error";
    return { error: message };
  }
}

