# Task 4.2 · Layout & Routing

## Files Touched
- `src/components/layout/Layout.tsx` · 39 lines — Global shell with skip link, responsive container, scroll reset.
- `src/components/layout/Header.tsx` · 167 lines — Sticky header, desktop/mobile nav, focus-trapped drawer.
- `src/components/layout/Footer.tsx` · 43 lines — Footer links and attribution.
- `src/components/ui/Navigation.tsx` · 49 lines — Shared navigation list with active styling.
- `src/components/features/Hero.tsx` · 68 lines — CTA buttons now route to `/download` and `/about`.
- `src/components/features/TranscriptFetcher.tsx` · 152 lines — Download form + preview logic (extracted from Home).
- `src/pages/Home.tsx` · 97 lines — Composed landing page using new feature + callout sections.
- `src/pages/Download.tsx` · 151 lines — Transcript workspace placeholder with states.
- `src/pages/History.tsx` · 67 lines — Empty state with roadmap highlights.
- `src/pages/About.tsx` · 81 lines — Project overview and stack badges.
- `src/routes.tsx` · 20 lines — Lazy route graph.
- `src/App.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/Header.tsx` — integrated layout & suspense fallback.

## Route Structure
```
/ (Layout)
├── /              → Home (Hero · TranscriptFetcher · Features)
├── /download      → Download workspace
├── /history       → Transcript history (placeholder)
├── /about         → About & tech stack
└── *              → NotFound
```

## Navigation & Layout Highlights
- Desktop nav: horizontal links with active state via `activeClass`.
- Mobile nav: hamburger trigger, sliding drawer, focus trap, ESC + overlay close, body scroll lock.
- Skip link added (`Skip to main content`) and scroll-to-top `createEffect` for route transitions.
- Layout ensures min-height flex column so footer pins to bottom.
- `Navigation` component reused across header/drawer.

## Accessibility & Responsiveness
- Semantic landmarks (`header`, `nav`, `main`, `footer`), ARIA labels on drawer/menu controls.
- Keyboard checks: Tab/Shift+Tab cycles within mobile drawer; `Esc` closes; skip link focusable.
- Focus-visible styling for all interactive elements.
- Responsive checks (Chrome DevTools): 375px mobile (drawer, stacked layouts), 768px tablet (two-column grids), 1920px desktop (max-width container).
- `prefers-reduced-motion` respected through Tailwind `motion-safe` helpers and gradient transitions only.

## Testing & Verification
```text
$ pnpm lint
eslint . --ext .ts,.tsx
(no issues)

$ pnpm typecheck
tsc --noEmit
(0 errors)

$ pnpm build
vite build
dist/assets/index-DWpTUjfc.css    25.17 kB │ gzip: 5.90 kB
dist/assets/Home-*.js             22.02 kB │ gzip: 8.05 kB
dist/assets/vendor-*.js           40.93 kB │ gzip: 15.59 kB

$ pnpm dev -- --host 127.0.0.1 --port 3000
VITE v7.1.4 ready in ~0.8s
Local: http://localhost:3000/  (terminated manually → exit 143)
```

## UX Validation
- Lazy routes verified via network tab (chunks: `Home-*.js`, `Download-*.js`, etc.).
- Active route highlighting matches URL for both desktop and drawer.
- Mobile drawer closes on navigation changes (`useLocation` watcher).
- Scroll resets smoothly on route change.
- Download page shows idle/loading/success/error states; hooking to backend reserved for Task 4.3.

## Screenshot Checklist
- Desktop nav (header, active link).
- Mobile menu: closed/open states (hamburger, drawer).
- Page renders: `/`, `/download`, `/history`, `/about`, `/404`.
- Active link highlight demonstration.
- Responsive snaps at 375px / 768px / 1920px.
- Accessibility audit (Lighthouse or axe) summary.

## Issues & Resolutions
- ESLint `no-unused-expressions` warnings triggered by bare `location.pathname` access — resolved by storing value before reacting.
- To keep files <200 lines, extracted transcript form logic into `TranscriptFetcher` feature component.
- Removed `optimizeDeps.exclude` entry in Task 4.1 earlier to allow Vite dev server to start (carried forward).

## Next Steps (Task 4.3 · API Client Service)
1. Wire `TranscriptFetcher` and `Download` pages to backend POST `/api/v1/transcripts/fetch`, handling loading/error/success states with TanStack Query mutations.
2. Persist history (local storage prototype) to populate `/history` cards and support filtering UX.
3. Introduce toast notifications + route breadcrumbs (per roadmap) and refine skeleton loaders.
