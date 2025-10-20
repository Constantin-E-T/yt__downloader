import { createSignal } from 'solid-js';

import type { HistoryItem, TranscriptResponse } from '@/types/api';

const STORAGE_KEY = 'yt-transcript-history';
const HISTORY_LIMIT = 50;
const STORAGE_EVENT = 'yt-transcript-history-change';

const readHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read transcript history', error);
    return [];
  }
};

const writeHistory = (items: HistoryItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const trimmed = items.slice(0, HISTORY_LIMIT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: trimmed }));
  } catch (error) {
    console.error('Failed to persist transcript history', error);
  }
};

const createHistoryItem = (response: TranscriptResponse): HistoryItem => ({
  id: response.transcript.id,
  video: response.video,
  transcript: response.transcript,
  downloadedAt: new Date().toISOString(),
});

const [historySignal, setHistorySignal] = createSignal<HistoryItem[]>(readHistory());

if (typeof window !== 'undefined') {
  window.addEventListener(STORAGE_EVENT, (event) => {
    const detail = (event as CustomEvent<HistoryItem[]>).detail;
    if (Array.isArray(detail)) {
      setHistorySignal(detail);
    }
  });
}

export const storage = {
  saveToHistory(response: TranscriptResponse) {
    const current = readHistory();
    const existingIndex = current.findIndex((item) => item.id === response.transcript.id);
    const nextItem = createHistoryItem(response);
    if (existingIndex >= 0) {
      current.splice(existingIndex, 1);
    }
    const nextHistory = [nextItem, ...current];
    writeHistory(nextHistory);
    setHistorySignal(nextHistory);
  },

  getHistory(): HistoryItem[] {
    return historySignal();
  },

  subscribe(callback: (items: HistoryItem[]) => void) {
    const listener = (event: CustomEvent<HistoryItem[]>) => callback(event.detail);
    if (typeof window !== 'undefined') {
      window.addEventListener(STORAGE_EVENT, listener as EventListener);
    }
    callback(historySignal());
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(STORAGE_EVENT, listener as EventListener);
      }
    };
  },

  getHistoryItem(id: string): HistoryItem | null {
    return readHistory().find((item) => item.id === id) ?? null;
  },

  deleteHistoryItem(id: string) {
    const filtered = readHistory().filter((item) => item.id !== id);
    writeHistory(filtered);
    setHistorySignal(filtered);
  },

  clearHistory() {
    writeHistory([]);
    setHistorySignal([]);
  },

  exportHistory(): string {
    const items = readHistory();
    return JSON.stringify(items, null, 2);
  },
};
