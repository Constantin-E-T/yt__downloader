import { Component, JSX, splitProps } from 'solid-js';
import { cn } from '@/utils/cn';

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: Component<InputProps> = (props) => {
  const [local, inputProps] = splitProps(props, ['label', 'error', 'helperText', 'class']);

  return (
    <div class="w-full">
      {local.label && (
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {local.label}
        </label>
      )}
      <input
        {...inputProps}
        class={cn(
          'w-full px-4 py-2 rounded-lg border',
          'transition-all duration-200',
          'focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none',
          'placeholder:text-gray-400',
          local.error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-700',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100',
          local.class
        )}
      />
      {local.error && (
        <p class="mt-1 text-sm text-red-500 animate-shake">{local.error}</p>
      )}
      {local.helperText && !local.error && (
        <p class="mt-1 text-sm text-gray-500">{local.helperText}</p>
      )}
    </div>
  );
};
