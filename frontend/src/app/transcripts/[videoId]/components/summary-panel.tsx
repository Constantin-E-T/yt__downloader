import type { SummaryResponse } from "@/lib/api/summaries";

interface SummaryPanelProps {
  summary: SummaryResponse | null;
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  if (!summary) return null;

  const content = summary.content;

  return (
    <div className="space-y-4 text-sm text-foreground">
      {content.text ? (
        <p className="text-base leading-relaxed text-foreground/90">
          {content.text}
        </p>
      ) : null}

      {content.key_points && content.key_points.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Key points
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-foreground/90">
            {content.key_points.map((point, index) => (
              <li key={`${point}-${index}`}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {content.sections && content.sections.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sections
          </h3>
          <div className="space-y-3">
            {content.sections.map((section, index) => (
              <div
                key={`${section.title}-${index}`}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <p className="text-sm font-semibold text-foreground/90">
                  {section.title || `Section ${index + 1}`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
