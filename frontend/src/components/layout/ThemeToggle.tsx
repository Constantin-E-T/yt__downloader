import { createSignal, onCleanup, onMount, type JSX } from 'solid-js';

import Button from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { theme, type Theme } from '@/utils/theme';

const SunIcon = () => (
  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="12" cy="12" r="4" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.071-7.071l-1.414 1.414M6.343 17.657l-1.414 1.414m0-14.142l1.414 1.414M17.657 17.657l1.414 1.414"
    />
  </svg>
);

const MoonIcon = () => (
  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
    />
  </svg>
);

const SystemIcon = () => (
  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 3v1.5M12 19.5V21m9-9h-1.5M4.5 12H3m15.364-6.364l-1.06 1.06M7.697 16.303l-1.06 1.06m0-11.424l1.06 1.06m9.607 9.607l1.06 1.06M17 12a5 5 0 11-5-5"
    />
  </svg>
);

const iconMap = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
} as const;

const themeOptions: Array<{ value: Theme; label: string; Icon: () => JSX.Element }> = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: SystemIcon },
];

const themeLabel = (current: Theme) =>
  current === 'system' ? 'System' : current === 'dark' ? 'Dark' : 'Light';

export const ThemeToggle = () => {
  const [activeTheme, setActiveTheme] = createSignal<Theme>(theme.get());

  onMount(() => {
    const unsubscribe = theme.subscribe(setActiveTheme);
    onCleanup(unsubscribe);
  });

  const ThemeIcon = () => {
    const Icon = iconMap[activeTheme()];
    return <Icon />;
  };

  return (
    <Dropdown
      items={themeOptions.map((option) => {
        const Icon = option.Icon;
        return {
          label: option.label,
          value: option.value,
          icon: <Icon />,
          onClick: () => theme.set(option.value),
        };
      })}
      renderTrigger={(ctx) => (
        <Button
          ref={ctx.ref}
          variant="ghost"
          size="sm"
          onClick={ctx.toggle}
          aria-label="Toggle theme"
          {...ctx.ariaAttrs}
        >
          <ThemeIcon />
          <span class="text-xs uppercase text-white/80 dark:text-slate-200">
            {themeLabel(activeTheme())}
          </span>
          <svg
            class={`h-3 w-3 transition-transform ${ctx.isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </Button>
      )}
    />
  );
};

export default ThemeToggle;
