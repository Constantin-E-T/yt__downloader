import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { requestSummary, type SummaryResponse } from "@/lib/api/summaries";
import {
    requestExtraction,
    type ExtractionResponse,
    type ExtractionType,
} from "@/lib/api/extractions";
import { requestQA, type QAResponse } from "@/lib/api/qa";
import type { SummaryType, AITab } from "../types";

interface UseAIFeaturesProps {
    transcriptId: string | undefined;
    summaryParam: SummaryType | undefined;
    extractionParam: ExtractionType | undefined;
    qaParams: string[];
    setActiveTab: (tab: "transcript" | "ai" | "search" | "export") => void;
    setActiveAITab: (tab: AITab) => void;
    updateSearchParams: (updater: (params: URLSearchParams) => void) => void;
}

export function useAIFeatures({
    transcriptId,
    summaryParam,
    extractionParam,
    qaParams,
    setActiveTab,
    setActiveAITab,
    updateSearchParams,
}: UseAIFeaturesProps) {
    // Summary state
    const [summaryCache, setSummaryCache] = useState<Record<string, SummaryResponse>>({});
    const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    // Extraction state
    const [extractionCache, setExtractionCache] = useState<Record<string, ExtractionResponse>>({});
    const [activeExtraction, setActiveExtraction] = useState<ExtractionResponse | null>(null);
    const [extractionLoadingType, setExtractionLoadingType] = useState<ExtractionType | null>(null);
    const [extractionError, setExtractionError] = useState<string | null>(null);

    // Q&A state
    const [qaHistory, setQaHistory] = useState<QAResponse[]>([]);
    const qaHistoryRef = useRef<QAResponse[]>([]);
    const [qaLoading, setQaLoading] = useState(false);
    const [qaBootstrapping, setQaBootstrapping] = useState(false);
    const [qaError, setQaError] = useState<string | null>(null);

    const qaParamsKey = useMemo(() => qaParams.join("|"), [qaParams]);

    // Sync qaHistory ref
    useEffect(() => {
        qaHistoryRef.current = qaHistory;
    }, [qaHistory]);

    // Reset all AI features when transcript changes
    useEffect(() => {
        if (!transcriptId) return;

        setSummaryCache({});
        setSummaryData(null);
        setSummaryError(null);
        setExtractionCache({});
        setActiveExtraction(null);
        setExtractionError(null);
        setQaHistory([]);
        setQaError(null);
        setQaBootstrapping(false);
    }, [transcriptId]);

    // Summary fetching
    const cachedSummary = summaryParam ? summaryCache[summaryParam] : undefined;

    useEffect(() => {
        if (!transcriptId || !summaryParam) {
            setSummaryData(null);
            setSummaryLoading(false);
            setSummaryError(null);
            return;
        }

        if (cachedSummary && cachedSummary.transcript_id === transcriptId) {
            setSummaryData(cachedSummary);
            setSummaryLoading(false);
            setSummaryError(null);
            return;
        }

        let cancelled = false;
        setSummaryLoading(true);
        setSummaryError(null);

        requestSummary({ transcriptId, summaryType: summaryParam })
            .then(({ data, error }) => {
                if (cancelled) return;
                if (data) {
                    setSummaryData(data);
                    setSummaryCache((prev) => ({ ...prev, [summaryParam]: data }));
                    setSummaryError(null);
                } else if (error) {
                    setSummaryError(error);
                    setSummaryData(null);
                } else {
                    setSummaryError("Failed to generate summary.");
                    setSummaryData(null);
                }
            })
            .finally(() => {
                if (!cancelled) setSummaryLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [summaryParam, transcriptId, cachedSummary]);

    // Extraction fetching
    const cachedExtraction = extractionParam ? extractionCache[extractionParam] : undefined;

    useEffect(() => {
        if (!transcriptId || !extractionParam) {
            setActiveExtraction(null);
            setExtractionLoadingType(null);
            setExtractionError(null);
            return;
        }

        if (cachedExtraction && cachedExtraction.transcript_id === transcriptId) {
            setActiveExtraction(cachedExtraction);
            setExtractionLoadingType(null);
            setExtractionError(null);
            return;
        }

        let cancelled = false;
        setExtractionLoadingType(extractionParam);
        setExtractionError(null);

        requestExtraction({ transcriptId, extractionType: extractionParam })
            .then(({ data, error }) => {
                if (cancelled) return;
                if (data) {
                    setExtractionCache((prev) => ({ ...prev, [extractionParam]: data }));
                    setActiveExtraction(data);
                    setExtractionError(null);
                } else if (error) {
                    setExtractionError(error);
                    setActiveExtraction(null);
                } else {
                    setExtractionError("Failed to generate extraction.");
                    setActiveExtraction(null);
                }
            })
            .finally(() => {
                if (!cancelled) setExtractionLoadingType(null);
            });

        return () => {
            cancelled = true;
        };
    }, [extractionParam, transcriptId, cachedExtraction]);

    // Q&A history filtering
    useEffect(() => {
        if (qaParams.length === 0) {
            setQaHistory([]);
            return;
        }

        setQaHistory((prev) => {
            const filtered = prev.filter((qa) => qaParams.includes(qa.question));
            if (
                filtered.length === prev.length &&
                filtered.every((item, index) => item === prev[index])
            ) {
                return prev;
            }
            return filtered;
        });
    }, [qaParamsKey, qaParams]);

    // Q&A bootstrapping
    useEffect(() => {
        if (!transcriptId || qaParams.length === 0) {
            setQaBootstrapping(false);
            return;
        }

        const existingQuestions = new Set(
            qaHistoryRef.current
                .filter((qa) => qa.transcript_id === transcriptId)
                .map((qa) => qa.question)
        );

        const missing = qaParams.filter((q) => !existingQuestions.has(q));

        if (missing.length === 0) {
            setQaBootstrapping(false);
            return;
        }

        let cancelled = false;
        setQaBootstrapping(true);
        setQaError(null);

        (async () => {
            for (const question of missing) {
                const { data, error } = await requestQA({ transcriptId, question });
                if (cancelled) return;

                if (data) {
                    setQaHistory((prev) => {
                        if (prev.some((item) => item.question === data.question)) {
                            return prev;
                        }
                        return [...prev, data];
                    });
                } else if (error) {
                    setQaError(error);
                }
            }
            if (!cancelled) setQaBootstrapping(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [qaParamsKey, qaParams, transcriptId]);

    // Handlers
    const handleSelectSummary = useCallback(
        (type: SummaryType) => {
            setActiveTab("ai");
            setActiveAITab("summary");
            updateSearchParams((params) => {
                params.set("tab", "ai");
                params.set("aiTab", "summary");
                params.set("summary", type);
            });
        },
        [setActiveTab, setActiveAITab, updateSearchParams]
    );

    const handleClearSummary = useCallback(() => {
        updateSearchParams((params) => {
            params.delete("summary");
        });
    }, [updateSearchParams]);

    const handleSelectExtraction = useCallback(
        (type: ExtractionType) => {
            setActiveTab("ai");
            setActiveAITab("extract");
            updateSearchParams((params) => {
                params.set("tab", "ai");
                params.set("aiTab", "extract");
                params.set("extract", type);
            });
        },
        [setActiveTab, setActiveAITab, updateSearchParams]
    );

    const handleClearExtraction = useCallback(() => {
        updateSearchParams((params) => {
            params.delete("extract");
        });
    }, [updateSearchParams]);

    const handleAskQuestion = useCallback(
        async (question: string) => {
            if (!transcriptId) {
                throw new Error("Transcript not ready yet. Please wait.");
            }

            if (qaHistoryRef.current.some((entry) => entry.question === question)) {
                return;
            }

            setActiveTab("ai");
            setActiveAITab("qa");
            setQaLoading(true);
            setQaError(null);

            try {
                const { data, error } = await requestQA({ transcriptId, question });

                if (!data || error) {
                    const message = error ?? "Failed to generate answer.";
                    setQaError(message);
                    throw new Error(message);
                }

                setQaHistory((prev) => [...prev, data]);
                updateSearchParams((params) => {
                    params.set("tab", "ai");
                    params.set("aiTab", "qa");
                    const existing = params.getAll("qa");
                    if (!existing.includes(question)) {
                        params.append("qa", question);
                    }
                });
            } finally {
                setQaLoading(false);
            }
        },
        [transcriptId, setActiveTab, setActiveAITab, updateSearchParams]
    );

    const handleClearQAHistory = useCallback(() => {
        setQaHistory([]);
        setQaError(null);
        updateSearchParams((params) => {
            params.delete("qa");
        });
    }, [updateSearchParams]);

    return {
        // Summary
        summaryData,
        summaryLoading,
        summaryError,
        handleSelectSummary,
        handleClearSummary,
        // Extraction
        activeExtraction,
        extractionLoadingType,
        extractionError,
        handleSelectExtraction,
        handleClearExtraction,
        // Q&A
        qaHistory,
        qaLoading,
        qaBootstrapping,
        qaError,
        handleAskQuestion,
        handleClearQAHistory,
    };
}
