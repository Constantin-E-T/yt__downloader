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

function ActionItemCard({ item, index }: { item: ActionItem; index: number }) {
  const checkboxId = useId();
  const [isChecked, setIsChecked] = useState(false);
  
  const badgeClass = clsx(
    "text-xs px-2 py-0.5 rounded capitalize",
    item.priority === "high" && "bg-red-500/20 text-red-700 dark:text-red-400",
    item.priority === "medium" && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    item.priority === "low" && "bg-green-500/20 text-green-700 dark:text-green-400"
  );

  // Smart detection: Is this actually actionable or just informational?
  const isActionable = isTaskActionable(item.task);
  
  return (
    <div className={clsx(
      "group relative space-y-3 rounded-lg border border-border p-4 transition-all",
      isActionable && "bg-card hover:shadow-md",
      !isActionable && "bg-muted/20",
      isChecked && isActionable && "opacity-60"
    )}>
      <div className="flex items-center gap-3">
        {isActionable ? (
          // Checkbox for actionable tasks
          <input
            id={checkboxId}
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-2 border-input bg-background text-primary transition-all checked:border-primary checked:bg-primary hover:border-primary/60 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            title="Mark as complete"
          />
        ) : (
          // Informational indicator for non-actionable items
          <div 
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
            title="Information point"
          >
            {index + 1}
          </div>
        )}
        <span className={badgeClass}>{item.priority}</span>
      </div>
      
      <label 
        htmlFor={isActionable ? checkboxId : undefined}
        className={clsx(
          "block text-sm font-medium transition-all",
          isActionable && "cursor-pointer",
          isChecked && isActionable ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {item.task}
      </label>
      
      {item.category ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">📁 {item.category}</span>
        </div>
      ) : null}
      
      <p className={clsx(
        "text-sm leading-relaxed",
        isChecked && isActionable ? "text-muted-foreground/60" : "text-muted-foreground"
      )}>
        {item.context}
      </p>
    </div>
  );
}

// Smart function to detect if a task is actionable or informational
function isTaskActionable(task: string): boolean {
  const taskLower = task.toLowerCase();
  
  // Action verbs that indicate a task to do
  const actionVerbs = [
    'install', 'setup', 'configure', 'create', 'build', 'learn', 'practice',
    'implement', 'write', 'code', 'develop', 'deploy', 'test', 'run',
    'clone', 'fork', 'commit', 'push', 'pull', 'download', 'upgrade',
    'read', 'study', 'review', 'check', 'verify', 'validate', 'ensure',
    'set up', 'sign up', 'register', 'subscribe', 'follow', 'watch',
    'try', 'experiment', 'explore', 'research', 'investigate'
  ];
  
  // Check if task starts with or contains action verbs
  const hasActionVerb = actionVerbs.some(verb => 
    taskLower.startsWith(verb) || 
    taskLower.includes(` ${verb} `) ||
    taskLower.includes(`${verb} `)
  );
  
  // Informational patterns (these are NOT actionable)
  const informationalPatterns = [
    /^(understanding|knowing|awareness|importance)/i,
    /^(the |a |an )/i, // Starts with article (usually informational)
    /is important/i,
    /should be/i,
    /need to know/i
  ];
  
  const isInformational = informationalPatterns.some(pattern => pattern.test(task));
  
  // If it has action verbs and is not informational, it's actionable
  return hasActionVerb && !isInformational;
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
      <ActionItemCard key={`${item.task}-${index}`} item={item} index={index} />
    ));
  default:
    return null;
  }
}

export function ExtractionPanel({ data }: { data: ExtractionResponse }) {
  const generatedAt = new Date(data.created_at);
  const isActionItems = data.extraction_type === "action_items";
  
  // Smart detection: Count actionable vs informational items
  let actionableCount = 0;
  let informationalCount = 0;
  
  if (isActionItems && data.items) {
    (data.items as ActionItem[]).forEach(item => {
      if (isTaskActionable(item.task)) {
        actionableCount++;
      } else {
        informationalCount++;
      }
    });
  }

  const hasActionable = actionableCount > 0;
  const hasInformational = informationalCount > 0;
  const isMixed = hasActionable && hasInformational;

  return (
    <div className="space-y-4">
      {isActionItems && (data.items as ActionItem[]).length > 0 && (
        <div className="rounded-md border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div className="flex-1 space-y-1">
              {isMixed ? (
                <>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    Mixed Content Detected
                  </p>
                  <p className="text-blue-600/90 dark:text-blue-400/90">
                    Found {actionableCount} actionable task{actionableCount !== 1 ? 's' : ''} (with checkboxes) 
                    and {informationalCount} key point{informationalCount !== 1 ? 's' : ''} (numbered). 
                    Check off tasks as you complete them!
                  </p>
                </>
              ) : hasActionable ? (
                <>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    To-Do List from Video
                  </p>
                  <p className="text-blue-600/90 dark:text-blue-400/90">
                    {actionableCount} actionable task{actionableCount !== 1 ? 's' : ''} extracted. 
                    Check them off as you complete them in real life. Status is saved for this session.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    Key Points & Recommendations
                  </p>
                  <p className="text-blue-600/90 dark:text-blue-400/90">
                    These are important points and recommendations mentioned in the video for your reference.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
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

