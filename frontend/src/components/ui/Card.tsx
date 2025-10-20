import { splitProps, type ComponentProps, type JSX } from 'solid-js';

import { cn } from '@/utils/cn';

type CardVariant = 'default' | 'outlined' | 'elevated';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

type CardProps = ComponentProps<'div'> & {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
};

const variantClasses: Record<CardVariant, string> = {
  default: 'border border-white/10 bg-surface-900/80 dark:border-slate-800 dark:bg-slate-900/80',
  outlined: 'border border-white/20 bg-transparent dark:border-slate-700 dark:bg-transparent',
  elevated:
    'border border-white/5 bg-white/10 shadow-xl shadow-primary-500/10 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90',
};

const paddingMap: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = (props: CardProps): JSX.Element => {
  const [local, rest] = splitProps(props, ['class', 'children', 'variant', 'padding', 'hoverable']);
  const variant = () => local.variant ?? 'default';
  const padding = () => local.padding ?? 'md';

  return (
    <div
      class={cn(
        'rounded-2xl transition-shadow duration-150',
        variantClasses[variant()],
        paddingMap[padding()],
        local.hoverable && 'hover:shadow-2xl hover:shadow-primary-500/10',
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export default Card;
