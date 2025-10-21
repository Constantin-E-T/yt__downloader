'use client';

import { useId, useState } from "react";
import clsx from "clsx";
import { Check, Clipboard } from "lucide-react";

import type {
  ActionItem,
  CodeSnippet,
  ExtractionResponse,
  ExtractionType,
  Quote,
} from "@/lib/api/extractions";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy snippet", error);
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-primary" />
          Copied
        </>
      ) : (
        <>
          <Clipboard className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

function CodeSnippetCard({ snippet }: { snippet: CodeSnippet }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase text-muted-foreground">
          {snippet.language || "plaintext"}
        </span>
        <CopyButton text={snippet.code} />
      </div>
      <pre className="max-h-[320px] overflow-x-auto rounded-md bg-black/90 p-3 text-xs text-foreground">
        <code className={clsx(`language-${snippet.language || "plaintext"}`)}>
          {snippet.code}
        </code>
      </pre>
      {snippet.context ? (
        <p className="text-sm text-muted-foreground">{snippet.context}</p>
      ) : null}
      {snippet.line_numbers ? (
        <p className="text-xs text-muted-foreground/80">
          Lines {snippet.line_numbers.start}–{snippet.line_numbers.end}
        </p>
      ) : null}
    </div>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  const badgeClass = clsx(
    "text-xs px-2 py-0.5 rounded capitalize",
    quote.importance === "high" && "bg-red-500/20 text-red-700",
    quote.importance === "medium" && "bg-yellow-500/20 text-yellow-700",
    quote.importance === "low" && "bg-blue-500/20 text-blue-700"
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {quote.speaker || "Unknown speaker"}
        </span>
        <span className={badgeClass}>{quote.importance}</span>
      </div>
      <blockquote className="border-l-4 border-primary/60 pl-4 text-sm italic text-foreground/90">
        “{quote.quote}”
      </blockquote>
      {quote.context ? (
        <p className="text-sm text-muted-foreground">{quote.context}</p>
      ) : null}
    </div>
  );
}

function ActionItemCard({ item }: { item: ActionItem }) {
  const checkboxId = useId();
  const badgeClass = clsx(
    "text-xs px-2 py-0.5 rounded capitalize",
    item.priority === "high" && "bg-red-500/20 text-red-700",
    item.priority === "medium" && "bg-yellow-500/20 text-yellow-700",
    item.priority === "low" && "bg-green-500/20 text-green-700"
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className={badgeClass}>{item.priority}</span>
      </div>
      <label htmlFor={checkboxId} className="text-sm font-medium text-foreground">
        {item.task}
      </label>
      {item.category ? (
        <p className="text-xs text-muted-foreground">Category: {item.category}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">{item.context}</p>
    </div>
  );
}

function renderExtractionItems(
  extractionType: ExtractionType,
  items: ExtractionResponse["items"]
) {
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return (
      <div className="rounded-md border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No items were returned for this extraction.
      </div>
    );
  }

  switch (extractionType) {
  case "code":
    return (items as CodeSnippet[]).map((snippet, index) => (
      <CodeSnippetCard
        key={`${snippet.language}-${index}`}
        snippet={snippet}
      />
    ));
  case "quotes":
    return (items as Quote[]).map((quote, index) => (
      <QuoteCard key={`${quote.quote}-${index}`} quote={quote} />
    ));
  case "action_items":
    return (items as ActionItem[]).map((item, index) => (
      <ActionItemCard key={`${item.task}-${index}`} item={item} />
    ));
  default:
    return null;
  }
}

export function ExtractionPanel({ data }: { data: ExtractionResponse }) {
  const generatedAt = new Date(data.created_at);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {renderExtractionItems(data.extraction_type, data.items)}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
        <span>
          Model:{" "}
          <span className="font-medium text-foreground/80">{data.model}</span>
        </span>
        <span className="text-foreground/30">•</span>
        <span>
          Tokens:{" "}
          <span className="font-medium text-foreground/80">
            {data.tokens_used.toLocaleString()}
          </span>
        </span>
        <span className="text-foreground/30">•</span>
        <span>{generatedAt.toLocaleString()}</span>
      </div>
    </div>
  );
}

