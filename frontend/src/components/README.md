# Component Library

The frontend ships with a small but cohesive UI toolkit designed for an accessible, themeable Solid.js application. Components live under `src/components` and are authored with Tailwind CSS utility classes.

## Primitives

### `Button`
- **File:** `src/components/ui/Button.tsx`
- **Props:**
  - `variant`: `'primary' | 'secondary' | 'danger' | 'ghost' | 'link'` (default `primary`)
  - `size`: `'sm' | 'md' | 'lg'` (default `md`)
  - `loading`: boolean spinner state
  - `leftIcon` / `rightIcon`: JSX for inline icons
  - Inherits all native `<button>` props
- **Notes:** Applies focus-visible ring, supports dark mode, and disables automatically while loading.

### `Card`
- **File:** `src/components/ui/Card.tsx`
- **Props:**
  - `variant`: `'default' | 'outlined' | 'elevated'`
  - `padding`: `'none' | 'sm' | 'md' | 'lg'`
  - `hoverable`: boolean shadow lift
- **Usage:** Wrap content blocks, analytics, forms.

### `Dropdown`
- **File:** `src/components/ui/Dropdown.tsx`
- **Props:**
  - `items`: array of `{ label, value, icon?, onClick, disabled? }`
  - `renderTrigger`: function returning the trigger element with provided ARIA attrs
  - `placement`: `'bottom-start' | 'bottom-end'`
- **Accessibility:** Focus wraps with Arrow keys, ESC closes, and outside clicks dismiss.

### `Modal`
- **File:** `src/components/ui/Modal.tsx`
- **Props:** `isOpen`, `onClose`, `title`, `children`, `closeOnOverlayClick`, `showCloseButton`
- **Features:** Body scroll lock, ESC and overlay close, focus trap, ARIA `role="dialog"`.

### `Spinner`
- **File:** `src/components/ui/Spinner.tsx`
- **Props:** `size?: 'sm' | 'md' | 'lg'`, `colorClass?`, `class?`
- **Usage:** inline loading indicators (used automatically by `Button` when `loading`).

### `ProgressBar`
- **File:** `src/components/ui/ProgressBar.tsx`
- **Props:** `progress` (0-100), optional `label` and `class`
- **Notes:** Dark-mode aware, polite `aria-live` updates.

### `ToastProvider`
- **File:** `src/components/ui/Toast.tsx`
- **API:**
  - Wrap the app with `<ToastProvider>` (already done in `index.tsx`).
  - Call `useToast().addToast({ type: 'success' | 'error' | 'info', title, description?, duration? })`.

### `Skeleton`
- **File:** `src/components/ui/Skeleton.tsx`
- **Exports:** Generic `Skeleton`, `HistoryCardSkeleton`, `TranscriptSkeleton` helpers.

## Feature Components

- `TranscriptFetcher` – orchestrates fetching + local history (`src/components/features/TranscriptFetcher.tsx`).
- `TranscriptViewer` – renders transcript segments with export actions (`src/components/features/TranscriptViewer.tsx`).
- `LanguageSelect` – language dropdown built atop `Dropdown` (`src/components/features/LanguageSelect.tsx`).
- History helpers: `HistoryEmptyState` and `HistoryItemCard` in `src/components/history/`.

Each feature component relies on the UI primitives above, so extending styling or behavior should start from the shared primitives.

## Dark Mode

The theme utility (`src/utils/theme.ts`) toggles the `dark` class on `<html>` and persists the choice in `localStorage`. Components use Tailwind `dark:` variants to guarantee parity between light and dark themes. The header exposes a `Dropdown` toggle cycling Light/Dark/System modes.

## Accessibility

- Buttons, dropdown triggers, and modal controls expose `aria-label` where icon-only.
- Dropdown and modal manage focus loops and ESC handling.
- Toasts announce via `aria-live="polite"`.
- Error and loading messages propagate through `aria-live` or `role="alert"`.

For component examples, check usage on the Home, Download, and History pages.
