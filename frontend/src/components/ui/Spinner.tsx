import { createMemo } from 'solid-js';

import { cn } from '@/utils/cn';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
  class?: string;
};

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-10 w-10 border-4',
};

export const Spinner = (props: SpinnerProps) => {
  const classes = createMemo(() =>
    cn(
      'inline-block animate-spin rounded-full border-current border-r-transparent align-middle text-white',
      sizeMap[props.size ?? 'md'],
      props.colorClass,
      props.class
    )
  );
  return <span class={classes()} aria-hidden="true" />;
};

export default Spinner;
