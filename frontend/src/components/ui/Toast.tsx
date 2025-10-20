import {
  createContext,
  createSignal,
  For,
  ParentComponent,
  Show,
  useContext,
  onCleanup,
} from 'solid-js';

import { cn } from '@/utils/cn';

type ToastType = 'success' | 'error' | 'info';

export interface ToastDescriptor {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastStore {
  toasts: () => ToastDescriptor[];
  addToast: (toast: Omit<ToastDescriptor, 'id'> & { id?: string }) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastStore>();
const DEFAULT_DURATION = 5000;

const typeStyles: Record<ToastType, string> = {
  success:
    'border-emerald-400/40 bg-emerald-500/10 text-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100',
  error:
    'border-rose-400/40 bg-rose-500/10 text-rose-100 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-100',
  info: 'border-sky-400/40 bg-sky-500/10 text-sky-100 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-100',
};

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const timers = new Map<string, number>();

export const ToastProvider: ParentComponent = (props) => {
  const [toasts, setToasts] = createSignal<ToastDescriptor[]>([]);

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  };

  const addToast: ToastStore['addToast'] = ({ id, duration, ...rest }) => {
    const toastId =
      id ??
      (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    const toast: ToastDescriptor = {
      id: toastId,
      duration: duration ?? DEFAULT_DURATION,
      ...rest,
    };
    setToasts((current) => [toast, ...current]);

    if (toast.duration && typeof window !== 'undefined') {
      const timeout = window.setTimeout(() => removeToast(toastId), toast.duration);
      timers.set(toastId, timeout);
    }

    return toastId;
  };

  onCleanup(() => {
    timers.forEach((timeout) => clearTimeout(timeout));
    timers.clear();
  });

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {props.children}
      <div class="pointer-events-none fixed inset-x-0 top-4 z-[1200] flex flex-col items-end gap-3 px-4 sm:right-4 sm:items-end sm:px-0">
        <For each={toasts()}>
          {(toast) => (
            <div
              class={cn(
                'pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-md dark:shadow-black/40 sm:px-5',
                'transform transition-all duration-300 ease-out',
                'animate-slide-in-right',
                typeStyles[toast.type]
              )}
              role="status"
              aria-live="polite"
            >
              <div class="flex items-start gap-3">
                <span aria-hidden="true" class="text-lg font-semibold">
                  {iconMap[toast.type]}
                </span>
                <div class="flex-1 space-y-1">
                  <p class="text-sm font-semibold text-white dark:text-slate-100">{toast.title}</p>
                  <Show when={toast.description}>
                    <p class="text-xs/relaxed text-white/80 dark:text-slate-200">
                      {toast.description}
                    </p>
                  </Show>
                </div>
                <button
                  type="button"
                  class="ml-2 rounded-full border border-white/20 p-1 text-xs font-semibold uppercase text-white/80 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </For>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
