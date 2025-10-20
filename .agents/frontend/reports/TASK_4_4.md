# Task 4.4 · Basic Components & Polish

## Files Created / Updated
- `tailwind.config.js` · enable `darkMode: 'class'`, extend palette
- `src/utils/theme.ts` · 72 lines · theme persistence + subscription helpers
- `src/hooks/useProgress.ts` · 22 lines · reusable indeterminate progress hook
- `src/data/languages.ts` · 18 lines · shared language metadata for selectors
- `src/components/layout/ThemeToggle.tsx` · 105 lines · reusable light/dark/system dropdown toggle
- `src/components/layout/Header.tsx` · 170 lines · consumes `ThemeToggle`, mobile drawer polish
- `src/components/layout/Footer.tsx` · 43 lines · dark-mode aware styling
- `src/components/layout/Layout.tsx` · 39 lines · gradient tweaks + transitions
- `src/components/ui/Button.tsx` · 81 lines · variants (primary/secondary/danger/ghost/link), loading state, icons
- `src/components/ui/Card.tsx` · 49 lines · variants (`default|outlined|elevated`), hoverable support
- `src/components/ui/Dropdown.tsx` · 185 lines · accessible dropdown with focus loop & outside click handling
- `src/components/ui/Modal.tsx` · 142 lines · overlay, scroll lock, focus trap, ESC/overlay close
- `src/components/ui/Spinner.tsx` · 29 lines · size-configurable spinner
- `src/components/ui/ProgressBar.tsx` · 29 lines · progress indicator with optional label
- `src/components/ui/Toast.tsx` · 133 lines · dark-mode aware toasts, stacked notifications
- `src/components/ui/Navigation.tsx` · 49 lines · dark-mode link styling
- `src/components/features/LanguageSelect.tsx` · 57 lines · dropdown-powered language selector
- `src/components/features/TranscriptFetcher.tsx` · 198 lines · integrated dropdown, progress, success state
- `src/components/history/HistoryEmptyState.tsx` · 28 lines · reusable empty-state card
- `src/components/history/HistoryItemCard.tsx` · 79 lines · card with dropdown actions
- `src/pages/Download.tsx` · 82 lines · wraps fetcher in card + updated empty state
- `src/pages/History.tsx` · 125 lines · uses new cards, modal confirmation, history dropdown
- `src/components/README.md` · component usage / props reference
- `frontend/README.md` · dark-mode & accessibility guidance

## Component Notes
- **Button** – variants (`primary`, `secondary`, `danger`, `ghost`, `link`), sizes (`sm`, `md`, `lg`), `loading`, `leftIcon`, `rightIcon`.
- **Card** – variants (`default`, `outlined`, `elevated`), padding (`none`, `sm`, `md`, `lg`), optional `hoverable` shadow.
- **Dropdown** – accepts `items: DropdownItem[]`, `placement`, `renderTrigger(ctx)` with `{ ref, toggle, isOpen, ariaAttrs }`; keyboard support (Up/Down/Enter/ESC) + click outside.
- **Modal** – props `isOpen`, `onClose`, `title`, optional `closeOnOverlayClick`, `showCloseButton`; traps focus and locks body scroll.
- **Spinner** – props `size` (`sm|md|lg`), `colorClass`, `class`.
- **ProgressBar** – props `progress` (0–100), optional `label`, `class`; polite `aria-live` updates.
- **ToastProvider / useToast** – `addToast({ type: 'success'|'error'|'info', title, description?, duration? })`, stacked toasts with dark-mode palettes.
- **LanguageSelect** – uses Dropdown to pick language; props `value`, `onChange`.
- **ThemeToggle** – dropdown for `light | dark | system`, persists via `theme` utility.
- **HistoryItemCard** – props `{ item, onView, onExport, onDelete }`, renders actions dropdown + buttons.
- **HistoryEmptyState** – decorative empty state card for history grid.

Component usage examples live in `src/components/README.md` and the Home/Download/History pages.

## Screenshots to Capture (manual)
- Desktop/light: Home, Download, History, About
- Desktop/dark: same pages after toggling theme
- Modal open/closed (History delete confirmation)
- Dropdown states: Theme toggle, Language selector, History card actions
- Button variants (primary/secondary/danger/ghost/link)
- Card variants (default, outlined, elevated)
- Loading indicators (Button spinner, TranscriptFetcher progress bar)
- Toast stack (success + error)
- Accessibility cues (focus ring on nav links, modal focus trap)

## Terminal Output
```
pnpm format
pnpm lint
pnpm typecheck
pnpm build
```

## Manual Testing Checklist *(execute with backend running)*
- [ ] Fetch transcript with valid YouTube URL (verify toast, preview, history entry)
- [ ] Invalid URL error messaging (inline + toast)
- [ ] Non-existent video (backend 404) handled gracefully
- [ ] Language dropdown updates request payload & preview label
- [ ] Theme toggle cycles Light/Dark/System and persists across reloads
- [ ] History card “View”, “Export JSON”, “Delete” flows (modal confirmation + toast)
- [ ] Download page viewer renders latest transcript; empty state before fetch
- [ ] Dropdown keyboard navigation (Arrow keys, Enter, ESC) for Theme & Language menus
- [ ] Modal focus trap + ESC/overlay close
- [ ] Toast auto-dismiss + manual dismiss button
- [ ] Responsive layouts at 375px, 768px, 1920px (hamburger menu, history grid)
- [ ] Lighthouse Accessibility ≥ 95 (Chrome DevTools)

## Issues & Resolutions
- **Dropdown reactivity**: Implemented custom focus management, outside click handling, and avoided prop destructuring to keep Solid reactivity intact.
- **Theme management**: Added `theme` utility with subscription + media listener so desktop dropdown + mobile drawer stay in sync.
- **History delete UX**: Replaced `confirm()` with accessible `Modal` including focus trap and keyboard support.
- **Loading visuals**: Added `useIndeterminateProgress` hook feeding the new `ProgressBar`, plus button-integrated spinners.

## Performance Notes
- Production build now yields ~75 kB main chunk (gzip 24 kB) + 41 kB vendor chunk (gzip 15.6 kB).
- Brotli compression active for all major assets; PWA precache updated to 16 entries (~196 KiB).
- Rate limiting + waiting in API service retained; UI progress capped at 88% until completion to keep perceived responsiveness smooth.

## Next Steps (Phase 5 Preview)
1. Introduce shared form primitives (inputs, textareas, validation messaging) for upcoming user flows.
2. Build analytics/dashboard views leveraging new card variants and dropdown actions.
3. Prepare integration tests (Playwright/Vitest) covering dropdown keyboard support, modal interactions, and theme persistence.
