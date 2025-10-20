import { Component, Show } from 'solid-js';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: Component<LoadingSpinnerProps> = (props) => {
  const size = () => {
    switch (props.size || 'md') {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      case 'xl': return 'w-16 h-16';
    }
  };

  const color = () => {
    switch (props.variant || 'primary') {
      case 'primary': return 'border-primary-500';
      case 'white': return 'border-white';
      case 'gray': return 'border-gray-400';
    }
  };

  return (
    <Show
      when={props.fullScreen}
      fallback={
        <div class="flex flex-col items-center gap-2">
          <div class={cn(
            'animate-spin rounded-full border-4 border-t-transparent',
            size(),
            color()
          )} />
          <Show when={props.text}>
            <p class="text-sm text-gray-600 dark:text-gray-400">{props.text}</p>
          </Show>
        </div>
      }
    >
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-4">
          <div class={cn(
            'animate-spin rounded-full border-4 border-t-transparent',
            size(),
            color()
          )} />
          <Show when={props.text}>
            <p class="text-white text-lg">{props.text}</p>
          </Show>
        </div>
      </div>
    </Show>
  );
};
