import type { ExtractionType } from "@/lib/api/extractions";

export const SUMMARY_OPTIONS = [
    {
        value: "brief",
        label: "Brief overview",
        description: "High-level recap in a few sentences.",
    },
    {
        value: "detailed",
        label: "Detailed synopsis",
        description: "Narrative summary covering major sections.",
    },
    {
        value: "key_points",
        label: "Key takeaways",
        description: "Bullet points for quick scanning.",
    },
] as const;

export type SummaryType = (typeof SUMMARY_OPTIONS)[number]["value"];

export const SUMMARY_VALUES = new Set<SummaryType>(
    SUMMARY_OPTIONS.map((option) => option.value)
);

export const EXTRACTION_OPTIONS: Array<{
    value: ExtractionType;
    label: string;
    description: string;
}> = [
        {
            value: "code",
            label: "Extract Code",
            description: "Find relevant code snippets with context.",
        },
        {
            value: "quotes",
            label: "Extract Quotes",
            description: "Highlight impactful quotes and speakers.",
        },
        {
            value: "action_items",
            label: "Extract Action Items",
            description: "Summarise next steps and responsibilities.",
        },
    ];

export const EXTRACTION_VALUES = new Set<ExtractionType>(
    EXTRACTION_OPTIONS.map((option) => option.value)
);

export const extractionLoadingText: Record<ExtractionType, string> = {
    code: "Extracting code snippets...",
    quotes: "Extracting key quotes...",
    action_items: "Extracting action items...",
};
