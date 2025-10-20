import { For, JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';

import { cn } from '@/utils/cn';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: JSX.Element;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  renderTrigger: (ctx: {
    isOpen: boolean;
    toggle: () => void;
    ref: (el: HTMLButtonElement) => void;
    ariaAttrs: Record<string, string | boolean>;
  }) => JSX.Element;
  placement?: 'bottom-start' | 'bottom-end';
  class?: string;
}

export const Dropdown = (props: DropdownProps) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [highlightedIndex, setHighlightedIndex] = createSignal(0);
  let triggerRef: HTMLButtonElement | undefined;
  let menuRef: HTMLDivElement | undefined;
  const menuId =
    typeof crypto !== 'undefined'
      ? `dropdown-${crypto.randomUUID()}`
      : `dropdown-${Math.random().toString(36).slice(2)}`;

  const close = () => setIsOpen(false);

  const focusItem = (index: number) => {
    const items = menuRef?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]');
    items?.[index]?.focus();
  };

  const handleDocumentClick = (event: MouseEvent) => {
    if (!isOpen()) {
      return;
    }
    if (!menuRef?.contains(event.target as Node) && !triggerRef?.contains(event.target as Node)) {
      close();
    }
  };

  const findNextIndex = (start: number, direction: 1 | -1) => {
    const count = props.items.length;
    let index = start;
    for (let i = 0; i < count; i += 1) {
      index = (index + direction + count) % count;
      if (!props.items[index]?.disabled) {
        return index;
      }
    }
    return start;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen()) {
      return;
    }
    const itemCount = props.items.length;
    if (itemCount === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = findNextIndex(highlightedIndex(), 1);
      setHighlightedIndex(next);
      focusItem(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = findNextIndex(highlightedIndex(), -1);
      setHighlightedIndex(prev);
      focusItem(prev);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
      triggerRef?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const item = props.items[highlightedIndex()];
      if (item && !item.disabled) {
        item.onClick();
        close();
        triggerRef?.focus();
      }
    }
  };

  const initialIndex = () => {
    const idx = props.items.findIndex((item) => !item.disabled);
    return idx === -1 ? 0 : idx;
  };

  createEffect(() => {
    if (isOpen()) {
      const first = initialIndex();
      setHighlightedIndex(first);
      const openListener = (event: KeyboardEvent) => handleKeyDown(event);
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', openListener);
      const focusTimer = window.setTimeout(() => focusItem(first), 10);
      onCleanup(() => {
        window.clearTimeout(focusTimer);
        document.removeEventListener('mousedown', handleDocumentClick);
        document.removeEventListener('keydown', openListener);
      });
    }
  });

  onCleanup(() => {
    document.removeEventListener('mousedown', handleDocumentClick);
  });

  return (
    <div class={cn('relative inline-block text-left', props.class)}>
      {props.renderTrigger({
        isOpen: isOpen(),
        toggle: () => {
          if (isOpen()) {
            close();
          } else {
            setIsOpen(true);
          }
        },
        ref: (el) => {
          triggerRef = el;
        },
        ariaAttrs: {
          'aria-haspopup': 'menu',
          'aria-expanded': String(isOpen()),
          'aria-controls': menuId,
        },
      })}
      <Show when={isOpen()}>
        <div
          ref={(el) => {
            menuRef = el;
          }}
          id={menuId}
          role="menu"
          class={cn(
            'absolute z-[1050] mt-2 min-w-[12rem] origin-top-right rounded-xl border border-white/10 bg-surface-900/95 p-2 text-sm text-white shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800',
            props.placement === 'bottom-end' ? 'right-0' : 'left-0'
          )}
        >
          <For each={props.items}>
            {(item, index) => (
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                class={cn(
                  'focus-visible:ring-primary-400 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50',
                  highlightedIndex() === index()
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/10',
                  item.disabled && 'cursor-not-allowed'
                )}
                onMouseEnter={() => setHighlightedIndex(index())}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    close();
                  }
                }}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Dropdown;
