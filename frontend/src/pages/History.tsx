import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';

import HistoryEmptyState from '@/components/history/HistoryEmptyState';
import HistoryItemCard from '@/components/history/HistoryItemCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { HistoryCardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { TranscriptViewer } from '@/components/features/TranscriptViewer';
import { storage } from '@/services/storage';
import type { HistoryItem } from '@/types/api';

const History = () => {
  const toast = useToast();
  const [history, setHistory] = createSignal<HistoryItem[]>([]);
  const [selected, setSelected] = createSignal<HistoryItem | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [deleteTarget, setDeleteTarget] = createSignal<HistoryItem | null>(null);

  const refresh = (items: HistoryItem[]) => {
    setHistory(items);
    setSelected((prev) =>
      prev ? (items.find((item) => item.id === prev.id) ?? items[0] ?? null) : (items[0] ?? null)
    );
    setLoading(false);
  };

  onMount(() => {
    refresh(storage.getHistory());
    const unsubscribe = storage.subscribe(refresh);
    onCleanup(unsubscribe);
  });

  const exportItem = (item: HistoryItem) => {
    const blob = new Blob([JSON.stringify(item.transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${item.video.youtubeId || item.video.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.addToast({
      type: 'success',
      title: 'Exported',
      description: 'Transcript saved as JSON.',
    });
  };

  const confirmDelete = () => {
    const target = deleteTarget();
    if (!target) return;
    storage.deleteHistoryItem(target.id);
    setDeleteTarget(null);
    toast.addToast({ type: 'info', title: 'Transcript removed', description: 'Entry deleted.' });
  };

  return (
    <section class="space-y-10">
      <header class="space-y-3">
        <p class="text-primary-200 text-sm uppercase tracking-[0.3em]">History</p>
        <h1 class="text-4xl font-bold text-white dark:text-slate-100 md:text-5xl">
          Your transcript timeline
        </h1>
        <p class="max-w-2xl text-lg text-white/70 dark:text-slate-300">
          Every transcript you fetch is saved locally. Revisit videos, export transcripts, and keep
          your workflow in sync across sessions.
        </p>
      </header>

      <Show
        when={!loading()}
        fallback={
          <div class="grid gap-6 md:grid-cols-3">
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
          </div>
        }
      >
        <Show when={history().length > 0} fallback={<HistoryEmptyState />}>
          <div class="grid gap-6 md:grid-cols-2">
            <For each={history()}>
              {(item) => (
                <HistoryItemCard
                  item={item}
                  onView={() => setSelected(item)}
                  onExport={() => exportItem(item)}
                  onDelete={() => setDeleteTarget(item)}
                />
              )}
            </For>
          </div>

          <Show when={selected()}>
            {(active) => (
              <TranscriptViewer video={active().video} transcript={active().transcript} />
            )}
          </Show>
        </Show>
      </Show>

      <Modal
        isOpen={Boolean(deleteTarget())}
        onClose={() => setDeleteTarget(null)}
        title="Delete transcript?"
      >
        <p class="text-sm text-white/70 dark:text-slate-200">
          This will remove
          <strong class="ml-1 text-white dark:text-slate-100">{deleteTarget()?.video.title}</strong>
          from local history. You can always refetch it later.
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </section>
  );
};

export default History;
