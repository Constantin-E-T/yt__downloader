import { createMemo } from 'solid-js';

import { cn } from '@/utils/cn';

interface ProgressBarProps {
  progress: number;
  label?: string;
  class?: string;
}

export const ProgressBar = (props: ProgressBarProps) => {
  const value = createMemo(() => Math.min(100, Math.max(0, props.progress)));
  return (
    <div class={cn('space-y-1', props.class)} aria-live="polite">
      {props.label && (
        <p class="text-xs font-medium text-slate-200 dark:text-slate-300">{props.label}</p>
      )}
      <div class="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-primary-500 transition-all duration-500 ease-out"
          style={{ width: `${value()}%` }}
        />
        {/* Shimmer effect while loading */}
        <div
          class="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ 'animation-duration': '2s' }}
        />
      </div>
      <span class="text-[10px] font-medium text-white/60 dark:text-white/50">{value()}%</span>
    </div>
  );
};

export default ProgressBar;
