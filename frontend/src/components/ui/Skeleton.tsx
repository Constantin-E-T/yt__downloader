import { cn } from '@/utils/cn';

type SkeletonProps = {
  class?: string;
};

export const Skeleton = (props: SkeletonProps) => (
  <div
    class={cn(
      'rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
      'dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
      'bg-[length:200%_100%]',
      'animate-shimmer',
      props.class
    )}
  />
);

export const HistoryCardSkeleton = () => (
  <div class="space-y-3 rounded-2xl border border-white/10 bg-surface-900/70 p-6">
    <Skeleton class="h-5 w-3/4" />
    <Skeleton class="h-4 w-1/2" />
    <Skeleton class="h-3 w-1/3" />
    <div class="flex gap-3 pt-2">
      <Skeleton class="h-9 w-24" />
      <Skeleton class="h-9 w-20" />
    </div>
  </div>
);

export const TranscriptSkeleton = () => (
  <div class="space-y-4 rounded-2xl border border-white/10 bg-surface-900/70 p-6">
    <Skeleton class="h-4 w-32" />
    <Skeleton class="h-9 w-full" />
    <div class="space-y-2">
      <Skeleton class="h-3 w-full" />
      <Skeleton class="h-3 w-5/6" />
      <Skeleton class="h-3 w-4/6" />
      <Skeleton class="h-3 w-2/3" />
    </div>
  </div>
);

export default Skeleton;
