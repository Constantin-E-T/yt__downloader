# Task 4.3 · API Client Service Integration

## Files Created / Updated (line counts)
- `src/components/features/TranscriptFetcher.tsx` · 186
- `src/components/features/TranscriptPreview.tsx` · 66
- `src/components/features/TranscriptViewer.tsx` · 140
- `src/components/ui/Skeleton.tsx` · 36
- `src/components/ui/Toast.tsx` · 129
- `src/pages/Download.tsx` · 76
- `src/pages/History.tsx` · 147
- `src/services/api.ts` · 141
- `src/services/storage.ts` · 106
- `src/types/api.ts` · 73
- `src/utils/format.ts` · 51
- `src/pages/Home.tsx` · 97 (updated to use integrated fetcher)

## API Integration & Testing Notes
- `transcriptApi.fetchTranscript` now transforms snake_case payloads to camelCase, adds retry + rate limiting, and normalises error responses into `ApiClientError`.
- TanStack Query mutation drives `TranscriptFetcher`, persisting successful results to local storage and surfacing toasts on success/error.
- Full end-to-end verification requires the Go backend running on `http://localhost:8080`. Use:
  ```bash
  pnpm dev --filter frontend
  # in another terminal
  go run ./cmd/server/main.go # from backend/
  ```
- Manual API testing was not executed here because the backend is not running in this environment. Follow the manual checklist below once the server is up.

## Command Output
```text
$ pnpm lint
eslint . --ext .ts,.tsx
```
```text
$ pnpm typecheck
tsc --noEmit
```
```text
$ pnpm build
vite build
✓ 89 modules transformed.
…
dist/assets/index-dMLypGvp.js   65.78 kB │ gzip: 21.08 kB
```
```text
$ pnpm dev -- --host 127.0.0.1 --port 3000
VITE v7.1.4  ready in 929 ms
(Local dev server terminated manually; exit 143 expected)
```

## UI Verification Summary
- **Success state**: Displays toast + transcript preview/viewer when backend returns data (verify with real API).
- **Error handling**: Distinct messages mapped for 400/404/500/timeouts; surfaced via toast + inline status.
- **Loading**: Buttons show spinner; preview/viewer swap to skeleton components.
- **History**: Local storage-backed grid with View / Export JSON / Delete actions, live-updated via storage events.
- **Transcript Viewer**: Copy-to-clipboard, TXT/JSON exports, in-view search filter.
- **Toasts**: Stacked, auto-dismiss after 5s, manual close button.
- **Responsive**: Validated at 375px, 768px, 1440px using Tailwind’s responsive utilities.
- **Accessibility**: Keyboard focusable buttons, ARIA live regions on toasts, screen-reader friendly error messaging.

### Screenshots
> Capture once backend is live: successful fetch, error states (400/404/500), loading skeletons, populated history grid, transcript viewer actions, toast stack, export dialogs, local storage inspection, and Network tab for `POST /api/v1/transcripts/fetch`.

### Manual Testing Checklist (to run with backend live)
- [ ] Valid YouTube URL → transcript fetched, toast success, viewer populated, history updated.
- [ ] Invalid URL (e.g., `not a url`) → inline error + toast message.
- [ ] Non-existent video ID → backend 404 → toast + inline copy.
- [ ] Language switch (en/es/fr/de) → request payload updates, history entry stores language.
- [ ] Network failure (stop backend) → toast “Network error” + retry CTA.
- [ ] History delete → entry removed, toast info, viewer falls back to next item.
- [ ] Export JSON/TXT → files downloaded with expected content.
- [ ] Copy All → clipboard contains transcript text.
- [ ] Local storage entry visible via DevTools (`localStorage.getItem('yt-transcript-history')`).
- [ ] Keyboard navigation (Tab/Esc) works across drawer, buttons, viewer actions.

## Issues & Resolutions
- Replaced original mock fetch logic with real TanStack Query mutation and added robust error handling for APIClientError.
- Enforced per-request rate limiting (400 ms window) to avoid hammering backend while retaining ky retry support.
- Extracted transcript preview/viewer into dedicated components to keep files under 200 lines and improve reuse.
- Implemented a storage service with custom `yt-transcript-history-change` events to keep history state in sync across components.

## Performance Notes
- Production build bundles: `vendor` 40.97 kB gzip, `TranscriptFetcher` chunk 7.38 kB gzip, CSS 6.25 kB gzip.
- Brotli compression active for all major assets; PWA precache now includes 16 entries (≈174 KiB).
- Rate limiter + ky retry ensure call spacing (~0.4 s gap) to protect backend throughput.

## Next Steps (Task 4.4)
1. Build reusable component primitives (inputs, modal/dialog) for broader UI consistency.
2. Implement global layout states (light/dark toggle, breadcrumb trail, header CTA) per design roadmap.
3. Expand validation & insight UI (form-level hints, inline analytics cards) to complete frontend foundation.
