import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import type { HistoryItem } from '@/types/api';
import { formatDuration, formatRelativeTime } from '@/utils/format';

type HistoryItemCardProps = {
  item: HistoryItem;
  onView: () => void;
  onExport: () => void;
  onDelete: () => void;
};

export const HistoryItemCard = (props: HistoryItemCardProps) => (
  <Card variant="elevated" hoverable padding="lg" class="flex h-full flex-col gap-5">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1.5">
        <h3 class="text-lg font-semibold text-white dark:text-slate-100">
          {props.item.video.title}
        </h3>
        <p class="text-sm text-white/60 dark:text-slate-400">{props.item.video.channel}</p>
        <p class="text-xs text-white/50 dark:text-slate-500">
          {formatDuration(props.item.video.duration)} •{' '}
          {props.item.transcript.language.toUpperCase()} •{' '}
          {formatRelativeTime(props.item.downloadedAt)}
        </p>
      </div>
      <Dropdown
        placement="bottom-end"
        items={[
          {
            label: 'Export JSON',
            value: 'export',
            icon: <span aria-hidden="true">⤓</span>,
            onClick: props.onExport,
          },
          {
            label: 'Delete transcript',
            value: 'delete',
            icon: <span aria-hidden="true">🗑️</span>,
            onClick: props.onDelete,
          },
        ]}
        renderTrigger={({ isOpen, toggle, ref, ariaAttrs }) => (
          <Button
            ref={ref}
            variant="ghost"
            size="sm"
            class="px-2"
            aria-label="Open actions menu"
            onClick={toggle}
            {...ariaAttrs}
          >
            <span aria-hidden="true">⋯</span>
            <svg
              class={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
    </div>
    <div class="flex flex-wrap gap-2">
      <Button size="sm" variant="primary" onClick={props.onView}>
        View transcript
      </Button>
      <Button size="sm" variant="secondary" onClick={props.onExport}>
        Quick export
      </Button>
    </div>
  </Card>
);

export default HistoryItemCard;
