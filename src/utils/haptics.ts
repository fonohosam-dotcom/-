export const triggerHaptic = (pattern: number | number[] = 50) => {
  if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Ignore
    }
  }
};
