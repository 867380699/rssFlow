import { useEventListener } from '@vueuse/core';

export const useOriention = () => {
  const oriention = ref(window.screen.orientation.type);

  useEventListener(screen.orientation, 'change', () => {
    oriention.value = window.screen.orientation.type;
  });

  const isLandscape = computed(() => /landscape/.test(oriention.value));

  const isPortrait = computed(() => !isLandscape.value);

  const rotate = () => {
    const rotation = isLandscape.value ? 'portrait' : 'landscape';
    window.screen.orientation.unlock();
    window.screen.orientation.lock(rotation);
  };

  const reset = () => {
    window.screen.orientation.unlock();
  };

  return {
    oriention,
    isLandscape,
    isPortrait,
    rotate,
    reset,
  };
};
