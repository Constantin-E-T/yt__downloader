import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ExtractionType } from "@/lib/api/extractions";
import type { SummaryType, AITab } from "../types";

interface TabParams {
    tabParam: string | null;
    aiTabParam: string | null;
    summaryParam: string | null;
    extractionParam: string | null;
    qaParams: string[];
    queryParam: string | undefined;
}

export function useTabNavigation(tabParams: TabParams, updateSearchParams: (updater: (params: URLSearchParams) => void) => void) {
    const { tabParam, aiTabParam, summaryParam, extractionParam, qaParams, queryParam } = tabParams;

    // Tab state
    const [activeTab, setActiveTab] = useState<"transcript" | "ai" | "search" | "export">("transcript");
    const [activeAITab, setActiveAITab] = useState<AITab>("summary");

    // Search state
    const [searchValue, setSearchValue] = useState(queryParam || "");

    // Sync URL params to state
    useEffect(() => {
        if (tabParam === "ai" || tabParam === "search" || tabParam === "export") {
            setActiveTab(tabParam);
        } else {
            setActiveTab("transcript");
        }

        if (aiTabParam === "extract" || aiTabParam === "qa") {
            setActiveAITab(aiTabParam);
        } else if (aiTabParam === "summary" || summaryParam) {
            setActiveAITab("summary");
        }
    }, [tabParam, aiTabParam, summaryParam]);

    useEffect(() => {
        setSearchValue(queryParam || "");
    }, [queryParam]);

    return {
        activeTab,
        setActiveTab,
        activeAITab,
        setActiveAITab,
        summaryParam: summaryParam as SummaryType | undefined,
        extractionParam: extractionParam as ExtractionType | undefined,
        qaParams,
        queryParam,
        searchValue,
        setSearchValue,
        updateSearchParams,
    };
}
