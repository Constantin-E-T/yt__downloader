import { useState, useEffect } from "react";
import {
    requestTranscript,
    requestTranscriptById,
    type TranscriptResponse,
} from "@/lib/api/transcripts";

interface UseTranscriptDataProps {
    videoId: string | undefined;
    transcriptParam: string | undefined;
    languageParam: string | undefined;
    updateSearchParams: (updater: (params: URLSearchParams) => void) => void;
}

export function useTranscriptData({
    videoId,
    transcriptParam,
    languageParam,
    updateSearchParams,
}: UseTranscriptDataProps) {
    const [transcriptData, setTranscriptData] = useState<TranscriptResponse | null>(null);
    const [transcriptLoading, setTranscriptLoading] = useState(true);
    const [transcriptError, setTranscriptError] = useState<string | null>(null);

    const transcriptId = transcriptData?.transcript_id;
    const transcriptVideoId = transcriptData?.video_id;

    useEffect(() => {
        if (!videoId) {
            setTranscriptError("Invalid video identifier.");
            setTranscriptLoading(false);
            return;
        }

        const reuseExisting =
            (transcriptId && transcriptParam && transcriptId === transcriptParam) ||
            (!transcriptParam && transcriptVideoId === videoId);

        if (reuseExisting) {
            setTranscriptLoading(false);
            return;
        }

        let cancelled = false;

        async function loadTranscript() {
            setTranscriptLoading(true);
            setTranscriptError(null);

            let cachedError: string | undefined;

            if (transcriptParam) {
                const { data, error } = await requestTranscriptById(transcriptParam);
                if (cancelled) return;
                if (data) {
                    setTranscriptData(data);
                    setTranscriptLoading(false);
                    return;
                }
                cachedError = error;
            }

            const { data, error } = await requestTranscript({
                video_url: `https://youtube.com/watch?v=${videoId}`,
                language: languageParam,
            });
            if (cancelled) return;

            if (data) {
                setTranscriptData(data);
                setTranscriptError(null);
                if (!transcriptParam || transcriptParam !== data.transcript_id) {
                    updateSearchParams((params) => {
                        params.set("transcript", data.transcript_id);
                    });
                }
            } else {
                setTranscriptError(
                    error ??
                    cachedError ??
                    "The transcript could not be retrieved. Please try again from the homepage."
                );
            }

            setTranscriptLoading(false);
        }

        loadTranscript();

        return () => {
            cancelled = true;
        };
    }, [videoId, transcriptParam, languageParam, updateSearchParams, transcriptId, transcriptVideoId]);

    return {
        transcriptData,
        transcriptLoading,
        transcriptError,
        transcriptId,
        transcriptVideoId,
    };
}
