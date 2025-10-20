import { Show, splitProps, For, createSignal, type ComponentProps, type JSX } from 'solid-js';

import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
} & ComponentProps<'button'>;

const baseClasses =
  'relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 focus-visible:ring-offset-surface-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400',
  secondary:
    'bg-white/10 text-white hover:bg-white/20 border border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700',
  danger:
    'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30 dark:bg-rose-500 dark:hover:bg-rose-400',
  ghost: 'bg-transparent text-white hover:bg-white/10 dark:text-slate-200 dark:hover:bg-slate-800',
  link: 'bg-transparent px-0 py-0 text-primary-300 underline-offset-4 hover:text-primary-200 hover:underline dark:text-primary-200',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
};

export const Button = (props: ButtonProps): JSX.Element => {
  const [local, rest] = splitProps(props, [
    'class',
    'children',
    'variant',
    'size',
    'type',
    'loading',
    'disabled',
    'leftIcon',
    'rightIcon',
    'onClick',
  ]);

  const variant = () => local.variant ?? 'primary';
  const size = () => local.size ?? 'md';
  const type = () => local.type ?? 'button';
  const isLink = () => variant() === 'link';

  const [ripples, setRipples] = createSignal<Ripple[]>([]);

  const createRipple = (e: MouseEvent) => {
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple: Ripple = { id: Date.now(), x, y };
    setRipples([...ripples(), newRipple]);

    setTimeout(() => {
      setRipples(ripples().filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (e: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
    if (!local.disabled && !local.loading) {
      createRipple(e);
      if (typeof local.onClick === 'function') {
        local.onClick(e);
      }
    }
  };

  return (
    <button
      type={type()}
      class={cn(
        baseClasses,
        variantClasses[variant()],
        !isLink() && sizeClasses[size()],
        local.class
      )}
      disabled={local.disabled || local.loading}
      onClick={handleClick}
      {...rest}
    >
      {/* Ripple effect */}
      <For each={ripples()}>
        {(ripple) => (
          <span
            class="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              width: '20px',
              height: '20px',
              'margin-left': '-10px',
              'margin-top': '-10px',
            }}
          />
        )}
      </For>

      <Show when={local.loading}>
        <Spinner size={size() === 'lg' ? 'md' : 'sm'} class="text-current" />
      </Show>
      <Show when={!local.loading && local.leftIcon}>
        {(icon) => <span aria-hidden="true">{icon()}</span>}
      </Show>
      <span class={cn('whitespace-nowrap', isLink() && 'font-semibold')}>{local.children}</span>
      <Show when={!local.loading && local.rightIcon}>
        {(icon) => <span aria-hidden="true">{icon()}</span>}
      </Show>
    </button>
  );
};

export default Button;
