import { API_BASE_PATH } from "@/lib/api/transcripts";

export type ExtractionType = "code" | "quotes" | "action_items";

export type CodeSnippet = {
  code: string;
  language: string;
  context: string;
  line_numbers?: { start: number; end: number };
};

export type Quote = {
  quote: string;
  speaker: string;
  context: string;
  importance: "high" | "medium" | "low";
};

export type ActionItem = {
  task: string;
  priority: "high" | "medium" | "low";
  category?: string;
  context: string;
};

export type ExtractionResponse = {
  id: string;
  transcript_id: string;
  extraction_type: ExtractionType;
  items: CodeSnippet[] | Quote[] | ActionItem[];
  model: string;
  tokens_used: number;
  created_at: string;
};

type ErrorResponse = {
  error: string;
  message?: string;
  status_code?: number;
};

type RawExtractionResponse = {
  id: string;
  transcript_id: string;
  extraction_type: string;
  items: Array<Record<string, unknown>>;
  model: string;
  tokens_used: number;
  created_at: string;
};

function isExtractionType(value: string): value is ExtractionType {
  return value === "code" || value === "quotes" || value === "action_items";
}

function normaliseExtractionItems(
  extractionType: ExtractionType,
  items: Array<Record<string, unknown>>
): CodeSnippet[] | Quote[] | ActionItem[] {
  switch (extractionType) {
  case "code":
    return items.map((item) => ({
      code: String(item.code ?? item.Code ?? ""),
      language: String(item.language ?? item.Language ?? "plaintext"),
      context: String(item.context ?? item.Context ?? ""),
      line_numbers:
        typeof item.line_numbers === "object" && item.line_numbers !== null
          ? {
            start: Number(
              (item.line_numbers as Record<string, unknown>).start ?? 0
            ),
            end: Number(
              (item.line_numbers as Record<string, unknown>).end ?? 0
            ),
          }
          : undefined,
    }));
  case "quotes":
    return items.map((item) => ({
      quote: String(item.quote ?? item.Quote ?? ""),
      speaker: String(item.speaker ?? item.Speaker ?? "Unknown"),
      context: String(item.context ?? item.Context ?? ""),
      importance: ((): Quote["importance"] => {
        const raw = String(
          item.importance ?? item.Importance ?? "medium"
        ).toLowerCase();
        if (raw === "high" || raw === "medium" || raw === "low") {
          return raw;
        }
        return "medium";
      })(),
    }));
  case "action_items":
    return items.map((item) => ({
      task: String(item.task ?? item.Task ?? item.action ?? item.Action ?? ""),
      priority: ((): ActionItem["priority"] => {
        const raw = String(
          item.priority ?? item.Priority ?? "medium"
        ).toLowerCase();
        if (raw === "high" || raw === "medium" || raw === "low") {
          return raw;
        }
        return "medium";
      })(),
      category: item.category ? String(item.category) : undefined,
      context: String(item.context ?? item.Context ?? ""),
    }));
  default:
    return [];
  }
}

export async function requestExtraction(params: {
  transcriptId: string;
  extractionType: ExtractionType;
}): Promise<{ data?: ExtractionResponse; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_PATH}/${encodeURIComponent(params.transcriptId)}/extract`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ extraction_type: params.extractionType }),
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
        `Unexpected error while generating extraction (status ${response.status})`;
      return { error: message };
    }

    const payload = (await response.json()) as RawExtractionResponse;
    const extractionType = isExtractionType(payload.extraction_type)
      ? payload.extraction_type
      : params.extractionType;

    const data: ExtractionResponse = {
      id: payload.id,
      transcript_id: payload.transcript_id,
      extraction_type: extractionType,
      items: normaliseExtractionItems(extractionType, payload.items ?? []),
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
