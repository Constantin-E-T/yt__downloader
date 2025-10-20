import { JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';

import Button from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const focusableSelector =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export const Modal = (props: ModalProps) => {
  let dialogRef: HTMLDivElement | undefined;
  let overlayRef: HTMLDivElement | undefined;
  const [isVisible, setIsVisible] = createSignal(false);

  const restoreBodyOverflow = () => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };

  const lockBodyScroll = () => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!props.isOpen) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      props.onClose();
      return;
    }
    if (event.key === 'Tab' && dialogRef) {
      const focusable = dialogRef.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !active) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const handleOverlayClick = (event: MouseEvent) => {
    if (props.closeOnOverlayClick === false) {
      return;
    }
    if (event.target === overlayRef) {
      props.onClose();
    }
  };

  createEffect(() => {
    if (props.isOpen) {
      setIsVisible(true);
      lockBodyScroll();
      const timer = window.setTimeout(() => {
        const focusable = dialogRef?.querySelectorAll<HTMLElement>(focusableSelector);
        focusable?.[0]?.focus({ preventScroll: true });
      }, 20);
      const keyListener = (event: KeyboardEvent) => handleKeyDown(event);
      document.addEventListener('keydown', keyListener);
      overlayRef?.addEventListener('mousedown', handleOverlayClick);
      onCleanup(() => {
        window.clearTimeout(timer);
        document.removeEventListener('keydown', keyListener);
        overlayRef?.removeEventListener('mousedown', handleOverlayClick);
      });
    } else {
      const timer = window.setTimeout(() => setIsVisible(false), 150);
      restoreBodyOverflow();
      onCleanup(() => window.clearTimeout(timer));
    }
  });

  onCleanup(() => {
    restoreBodyOverflow();
  });

  return (
    <Show when={isVisible()}>
      <div
        ref={(el) => {
          overlayRef = el;
        }}
        class={cn(
          'fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-150',
          props.isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        role="presentation"
      >
        <div
          ref={(el) => {
            dialogRef = el;
          }}
          class={cn(
            'relative w-full max-w-lg translate-y-0 rounded-2xl border border-white/10 bg-surface-800/95 p-6 text-white shadow-2xl transition-all duration-150 ease-out dark:border-slate-700 dark:bg-slate-900',
            props.isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div class="flex items-start justify-between gap-4">
            <h2 id="modal-title" class="text-lg font-semibold text-white dark:text-slate-100">
              {props.title}
            </h2>
            <Show when={props.showCloseButton ?? true}>
              <Button variant="ghost" size="sm" aria-label="Close modal" onClick={props.onClose}>
                ×
              </Button>
            </Show>
          </div>
          <div class="mt-4 text-sm text-white/80 dark:text-slate-200">{props.children}</div>
        </div>
      </div>
    </Show>
  );
};

export default Modal;
