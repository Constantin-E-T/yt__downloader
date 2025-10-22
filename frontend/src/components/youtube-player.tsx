"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export type YouTubePlayerRef = {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number | null;
};

type YouTubePlayerProps = {
  videoId: string;
  onTimeUpdate?: (seconds: number) => void;
  onReady?: () => void;
};

type YouTubePlayerInstance = {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
};

type YouTubePlayerEvent = {
  target: YouTubePlayerInstance;
  data: number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YouTubePlayerInstance }) => void;
            onStateChange?: (event: YouTubePlayerEvent) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YouTubePlayerInstance;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SCRIPT_SRC = "https://www.youtube.com/iframe_api";

let apiReadyPromise: Promise<void> | null = null;

const loadYouTubeIframeAPI = () => {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("YouTube player can only be used in the browser")
    );
  }

  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (apiReadyPromise) {
    return apiReadyPromise;
  }

  apiReadyPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    const handleReady = () => {
      resolve();
    };

    const handleError = () => {
      reject(new Error("Failed to load YouTube API"));
    };

    if (window.onYouTubeIframeAPIReady) {
      const originalCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        originalCallback?.();
        handleReady();
      };
    } else {
      window.onYouTubeIframeAPIReady = handleReady;
    }

    if (existingScript) {
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onerror = handleError;
    document.body.appendChild(script);
  });

  return apiReadyPromise;
};

// Use a stable ID that's the same on server and client
// useId from React 18+ is hydration-safe
const usePlayerContainerId = () => {
  const id = useId();
  // Replace colons with dashes (useId returns format like :r1:)
  return `youtube-player-${id.replace(/:/g, "-")}`;
};

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ videoId, onTimeUpdate, onReady }, ref) => {
    const playerInstanceRef = useRef<YouTubePlayerInstance | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerId = usePlayerContainerId();
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const onTimeUpdateRef = useRef<
      YouTubePlayerProps["onTimeUpdate"] | undefined
    >(undefined);
    const onReadyRef = useRef<YouTubePlayerProps["onReady"] | undefined>(
      undefined
    );

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    useEffect(() => {
      onReadyRef.current = onReady;
    }, [onReady]);

    const clearTrackingInterval = useCallback(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, []);

    const startTrackingInterval = useCallback(() => {
      clearTrackingInterval();
      const callback = onTimeUpdateRef.current;
      if (!callback) return;

      intervalRef.current = setInterval(() => {
        const currentTime = playerInstanceRef.current?.getCurrentTime();
        if (typeof currentTime === "number") {
          callback(Math.max(0, Math.floor(currentTime)));
        }
      }, 1000);
    }, [clearTrackingInterval]);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (!playerInstanceRef.current) return;
        playerInstanceRef.current.seekTo(seconds, true);
        const callback = onTimeUpdateRef.current;
        if (callback) {
          callback(seconds);
        }
      },
      getCurrentTime: () => {
        return playerInstanceRef.current?.getCurrentTime() ?? null;
      },
    }));

    useEffect(() => {
      let isCancelled = false;

      const setupPlayer = async () => {
        try {
          setIsLoading(true);
          setIsReady(false);
          setError(null);
          await loadYouTubeIframeAPI();
          if (isCancelled) return;
          if (!window.YT?.Player) {
            throw new Error("YouTube API not available");
          }

          const containerElement = document.getElementById(containerId);
          if (!containerElement) {
            throw new Error("YouTube player container is missing");
          }

          containerElement.innerHTML = "";

          playerInstanceRef.current = new window.YT.Player(containerId, {
            videoId,
            playerVars: {
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
            },
            events: {
              onReady: (event) => {
                if (isCancelled) {
                  return;
                }

                setIsLoading(false);
                setIsReady(true);
                onReadyRef.current?.();
                const callback = onTimeUpdateRef.current;
                if (callback) {
                  const initialTime = event.target.getCurrentTime();
                  callback(Math.max(0, Math.floor(initialTime)));
                }
              },
              onStateChange: (event) => {
                if (!window.YT?.PlayerState) {
                  return;
                }
                if (event.data === window.YT.PlayerState.PLAYING) {
                  startTrackingInterval();
                } else if (
                  event.data === window.YT.PlayerState.PAUSED ||
                  event.data === window.YT.PlayerState.ENDED
                ) {
                  clearTrackingInterval();
                  if (event.data === window.YT.PlayerState.ENDED) {
                    const time = event.target.getCurrentTime();
                    onTimeUpdateRef.current?.(Math.max(0, Math.floor(time)));
                  }
                }
              },
              onError: () => {
                setError("Unable to load the embedded YouTube video.");
                setIsLoading(false);
              },
            },
          });
        } catch (err) {
          if (isCancelled) return;
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the YouTube player."
          );
          setIsLoading(false);
        }
      };

      setupPlayer();

      return () => {
        isCancelled = true;
        clearTrackingInterval();
        playerInstanceRef.current?.destroy();
        playerInstanceRef.current = null;
      };
    }, [videoId, containerId, clearTrackingInterval, startTrackingInterval]);

    useEffect(() => {
      if (!isReady || !playerInstanceRef.current) return;
      if (
        playerInstanceRef.current.getPlayerState() ===
        window.YT?.PlayerState?.PLAYING
      ) {
        startTrackingInterval();
      }

      return () => {
        clearTrackingInterval();
      };
    }, [clearTrackingInterval, isReady, startTrackingInterval]);

    return (
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{ paddingTop: "56.25%" }}
      >
        <div
          id={containerId}
          className="absolute inset-0 h-full w-full overflow-hidden rounded-lg bg-black"
          aria-label="YouTube video player"
          role="group"
        />
        {isLoading && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="w-3/4 max-w-sm space-y-3 text-center">
              <Skeleton className="mx-auto h-40 w-full rounded-md" />
              <Skeleton className="mx-auto h-4 w-3/4" />
              <Skeleton className="mx-auto h-4 w-1/2" />
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/90 p-6 text-center">
            <p className="text-sm font-medium text-destructive">
              Failed to load the video.
            </p>
            <p className="text-xs text-muted-foreground">
              You can open the video directly on YouTube if this error persists.
            </p>
            <Button variant="outline" asChild>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on YouTube
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";
