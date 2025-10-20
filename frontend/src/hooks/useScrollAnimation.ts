import { createSignal, onCleanup } from 'solid-js';

export function useScrollAnimation(threshold = 0.1) {
  const [isVisible, setIsVisible] = createSignal(false);
  let elementRef: HTMLElement | null = null;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    },
    { threshold }
  );

  const ref = (el: HTMLElement) => {
    elementRef = el;
    observer.observe(el);
  };

  onCleanup(() => {
    if (elementRef) observer.unobserve(elementRef);
  });

  return { ref, isVisible };
}
