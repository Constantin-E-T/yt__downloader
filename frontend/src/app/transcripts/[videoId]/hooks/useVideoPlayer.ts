import { useState, useCallback, useRef } from "react";
import type { YouTubePlayerRef } from "@/components/youtube-player";

export function useVideoPlayer() {
    const playerRef = useRef<YouTubePlayerRef>(null);
    const [currentVideoTime, setCurrentVideoTime] = useState(0);

    const handleSeek = useCallback((time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time);
        }
    }, []);

    return {
        playerRef,
        currentVideoTime,
        setCurrentVideoTime,
        handleSeek,
    };
}
