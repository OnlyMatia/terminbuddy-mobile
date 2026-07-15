let scrollToTopFn = null;

export function registerHomeScrollToTop(fn) {
  scrollToTopFn = fn;
}

export function triggerHomeScrollToTop() {
  scrollToTopFn?.();
}
