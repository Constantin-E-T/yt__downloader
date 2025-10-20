import { Accessor, createEffect, createSignal, onCleanup } from 'solid-js';

export const useIndeterminateProgress = (isActive: Accessor<boolean>) => {
  const [progress, setProgress] = createSignal(0);

  createEffect(() => {
    if (!isActive()) {
      setProgress(0);
      return;
    }
    setProgress(12);
    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 88 ? 88 : value + 8));
    }, 120);
    onCleanup(() => {
      window.clearInterval(timer);
      setProgress(0);
    });
  });

  return progress;
};
