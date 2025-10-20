import { A, useLocation } from '@solidjs/router';
import {
  For,
  createEffect,
  createSignal,
  onCleanup,
  Show,
  type Component,
  type JSX,
} from 'solid-js';

import ThemeToggle from '@/components/layout/ThemeToggle';
import { Navigation, NAV_ITEMS } from '@/components/ui/Navigation';
import { cn } from '@/utils/cn';

const focusableSelector =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const Header: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const location = useLocation();
  let drawerRef: HTMLDivElement | undefined;

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen((open) => !open);

  createEffect(() => {
    const pathname = location.pathname;
    closeMenu();
    return pathname;
  });

  createEffect(() => {
    if (!isOpen()) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusable = drawerRef?.querySelectorAll<HTMLElement>(focusableSelector) ?? [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key === 'Tab' && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    queueMicrotask(() => first?.focus());

    onCleanup(() => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  onCleanup(() => {
    document.body.style.overflow = '';
  });

  const renderMobileItem = (item: (typeof NAV_ITEMS)[number]): JSX.Element => (
    <A
      href={item.path}
      class="focus-visible:outline-primary-300 rounded-lg px-4 py-3 text-lg font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-slate-100 dark:hover:bg-slate-800"
      activeClass="bg-white/10 text-white dark:bg-slate-800/70"
      onClick={closeMenu}
    >
      {item.label}
    </A>
  );

  return (
    <header class="sticky top-0 z-40 border-b border-white/10 bg-surface-900/75 backdrop-blur supports-[backdrop-filter]:bg-surface-900/70 dark:border-slate-800 dark:bg-slate-900/70">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <A
          href="/"
          class="hover:text-primary-200 focus-visible:outline-primary-300 text-lg font-bold tracking-tight text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-slate-100"
        >
          YouTube Transcript Downloader
        </A>

        <div class="hidden items-center gap-4 md:flex">
          <Navigation />
          <ThemeToggle />
        </div>

        <button
          type="button"
          class="focus-visible:outline-primary-300 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden"
          aria-label={isOpen() ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen()}
          onClick={toggleMenu}
        >
          <Show
            when={!isOpen()}
            fallback={
              <span class="flex h-5 w-5 items-center justify-center text-lg font-semibold leading-none">
                ×
              </span>
            }
          >
            <span class="flex flex-col gap-1.5">
              <span class="h-0.5 w-6 rounded bg-white" />
              <span class="h-0.5 w-6 rounded bg-white" />
              <span class="h-0.5 w-6 rounded bg-white" />
            </span>
          </Show>
        </button>
      </div>

      <div
        class={cn(
          'transition-opacity duration-200 ease-out md:hidden',
          isOpen() ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div
          class="fixed inset-0 z-30 bg-surface-900/60 backdrop-blur dark:bg-slate-900/70"
          role="presentation"
          onClick={closeMenu}
        />
        <div
          ref={(el) => {
            drawerRef = el;
          }}
          class={cn(
            'fixed inset-y-0 right-0 z-40 flex w-72 flex-col gap-4 overflow-y-auto border-l border-white/10 bg-surface-900/95 p-6 shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900/95',
            isOpen() ? 'translate-x-0' : 'translate-x-full'
          )}
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium uppercase tracking-[0.25em] text-white/60">Navigate</p>
            <button
              type="button"
              class="focus-visible:outline-primary-300 rounded-full border border-white/10 p-2 text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-700 dark:text-slate-200"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <div class="flex flex-col gap-2">
            <For each={NAV_ITEMS}>{renderMobileItem}</For>
          </div>

          <div class="mt-8 border-t border-white/10 pt-4 dark:border-slate-800">
            <p class="text-xs uppercase tracking-[0.3em] text-white/40">Theme</p>
            <div class="mt-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
