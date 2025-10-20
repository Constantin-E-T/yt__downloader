import ky, { HTTPError, TimeoutError } from 'ky';

import type {
  ApiClientErrorShape,
  ApiErrorResponse,
  TranscriptRequest,
  TranscriptResponse,
  TranscriptResponseRaw,
  Video,
  Transcript,
} from '@/types/api';

const rawBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const prefixUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

const RATE_LIMIT_INTERVAL_MS = 400;
let lastRequestAt = 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRateLimiting = async () => {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < RATE_LIMIT_INTERVAL_MS) {
    await wait(RATE_LIMIT_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();
};

export class ApiClientError extends Error {
  status?: number;
  data?: ApiErrorResponse | null;

  constructor({ status, message, details }: ApiClientErrorShape) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = details ?? null;
  }
}

// Transform the simplified backend response into the frontend format
const transformResponse = (payload: TranscriptResponseRaw): TranscriptResponse => {
  const now = new Date().toISOString();
  const videoId = crypto.randomUUID();
  const transcriptId = crypto.randomUUID();

  return {
    video: {
      id: videoId,
      youtubeId: payload.video_id,
      title: payload.title,
      channel: '', // Not provided by backend
      duration: 0, // Not provided by backend
      createdAt: now,
    },
    transcript: {
      id: transcriptId,
      videoId: videoId,
      language: payload.language,
      content: payload.transcript,
      createdAt: now,
    },
  };
};

export const apiClient = ky.create({
  prefixUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  retry: {
    limit: 2,
    methods: ['get', 'post'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 2000,
  },
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set('Accept', 'application/json');
      },
    ],
  },
});

const parseError = async (error: unknown): Promise<ApiClientErrorShape> => {
  if (error instanceof ApiClientError) {
    return { status: error.status, message: error.message, details: error.data };
  }

  if (error instanceof TimeoutError) {
    return {
      status: 408,
      message: 'Request timed out. Please try again.',
      details: null,
    };
  }

  if (error instanceof HTTPError) {
    const status = error.response.status;
    let details: ApiErrorResponse | null = null;
    try {
      details = (await error.response.clone().json()) as ApiErrorResponse;
    } catch {
      details = null;
    }
    const fallback =
      status === 400
        ? 'Invalid request. Please check the video URL and try again.'
        : status === 404
          ? 'Transcript not available for this video.'
          : 'Server error. Please try again later.';
    return {
      status,
      message: details?.error ?? fallback,
      details,
    };
  }

  return {
    status: undefined,
    message: 'Network error. Check your connection and try again.',
    details: null,
  };
};

export const fetchTranscript = async (payload: TranscriptRequest): Promise<TranscriptResponse> => {
  await withRateLimiting();
  try {
    const response = await apiClient
      .post('v1/transcripts/fetch', { json: payload })
      .json<TranscriptResponseRaw>();
    return transformResponse(response);
  } catch (error) {
    const shape = await parseError(error);
    throw new ApiClientError(shape);
  }
};

export const transcriptApi = {
  fetchTranscript,
};
