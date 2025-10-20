import { createMemo } from 'solid-js';

import Button from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { LANGUAGES, type LanguageOption } from '@/data/languages';
import { cn } from '@/utils/cn';

type LanguageSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export const LanguageSelect = (props: LanguageSelectProps) => {
  const current = createMemo<LanguageOption>(
    () => LANGUAGES.find((item) => item.value === props.value) ?? LANGUAGES[0]
  );

  return (
    <Dropdown
      placement="bottom-start"
      items={LANGUAGES.map((option) => ({
        label: `${option.flag} ${option.label}`,
        value: option.value,
        icon: <span class="text-lg">{option.flag}</span>,
        onClick: () => props.onChange(option.value),
      }))}
      renderTrigger={(ctx) => (
        <Button
          ref={ctx.ref}
          variant="secondary"
          size="sm"
          class="w-full justify-between"
          onClick={ctx.toggle}
          {...ctx.ariaAttrs}
        >
          <span class="flex items-center gap-2 text-white/90 dark:text-slate-100">
            <span class="text-lg" aria-hidden="true">
              {current().flag}
            </span>
            {current().label}
          </span>
          <svg
            class={cn('h-3 w-3 transition-transform', ctx.isOpen && 'rotate-180')}
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

export default LanguageSelect;
