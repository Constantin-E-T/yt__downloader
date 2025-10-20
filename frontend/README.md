## Frontend — YouTube Transcript Downloader

Modern Solid.js application built with pnpm, Vite, Tailwind CSS, and TanStack Query. This project powers the Phase 4 frontend foundation with responsive, accessible, and SEO-friendly defaults for 2025.

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Getting Started

```bash
pnpm install
pnpm dev
```

The development server runs on [http://localhost:3000](http://localhost:3000) with the backend proxied through `/api`.

### Core Scripts

- `pnpm dev` – Start the Vite development server
- `pnpm build` – Produce an optimized production bundle
- `pnpm preview` – Preview the production build locally
- `pnpm typecheck` – Run TypeScript in `--noEmit` mode
- `pnpm lint` – Execute ESLint with Solid + TypeScript rules
- `pnpm format` – Format source files using Prettier

### Project Structure

```
src/
  components/    # Reusable UI + feature components
  pages/         # Route-level components
  services/      # API integrations and data helpers
  types/         # Shared TypeScript contracts
  utils/         # Utility helpers (e.g., class merging)
  styles/        # Global Tailwind entrypoint
  data/          # Static data (languages, etc.)
  hooks/         # Shared Solid hooks
```

### Theme & Dark Mode

- The theme helper in `src/utils/theme.ts` manages a persisted `light | dark | system` preference (stored in `localStorage`).
- The header exposes a theme dropdown that cycles between Light, Dark, and System modes.
- All primitives (`Button`, `Card`, `Modal`, etc.) include matching `dark:` Tailwind variants, so the experience remains consistent across themes.

### Environment Variables

Copy `.env.example` to `.env.local` and adjust as needed:

```
VITE_API_URL=http://localhost:8080/api
```

### Quality Targets

- Lighthouse scores ≥ 90 across Performance, Accessibility, SEO
- TypeScript strict mode with zero errors
- ESLint + Prettier clean
- Responsive layout verified at 375px, 768px, 1440px
- Keyboard-only navigation verified (Tab, Shift+Tab, Arrow keys)
- Lighthouse Accessibility score ≥ 95 (Chrome DevTools > Lighthouse)

### Deployment

1. `pnpm build`
2. Serve the `dist/` directory via your hosting provider (Netlify, Vercel, Cloudflare Pages, etc.)
3. Ensure environment variables are set (e.g., `VITE_API_URL`)

### Additional Resources

- [Solid.js Documentation](https://docs.solidjs.com/)
- [TanStack Query for Solid](https://tanstack.com/query/v5/docs/solid/overview)
- [Tailwind CSS](https://tailwindcss.com/)
- [Component Reference](./src/components/README.md)
