export interface TranscriptRequest {
  video_url: string;
  language?: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface VideoRaw {
  id: string;
  youtube_id: string;
  title: string;
  channel: string;
  duration: number;
  created_at: string;
}

export interface TranscriptRaw {
  id: string;
  video_id: string;
  language: string;
  content: TranscriptSegment[];
  created_at: string;
}

// Backend actual response (simplified)
export interface TranscriptResponseRaw {
  video_id: string;
  title: string;
  language: string;
  transcript: TranscriptSegment[];
}

export interface ApiErrorResponse {
  error: string;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: number;
  createdAt: string;
}

export interface Transcript {
  id: string;
  videoId: string;
  language: string;
  content: TranscriptSegment[];
  createdAt: string;
}

export interface TranscriptResponse {
  video: Video;
  transcript: Transcript;
}

export interface HistoryItem {
  id: string;
  video: Video;
  transcript: Transcript;
  downloadedAt: string;
}

export type TranscriptHistory = HistoryItem[];

export interface ApiClientErrorShape {
  status?: number;
  message: string;
  details?: ApiErrorResponse | null;
}
