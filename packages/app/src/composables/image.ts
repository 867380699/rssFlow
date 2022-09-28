import { useWindowSize } from '@vueuse/core';

const { width: windowWidth, height: windowHeight } = useWindowSize();

export const useMinHeight = () => {
  const minHeight = computed(() => {
    const height =
      Math.max(
        windowHeight.value / 4,
        Math.min(windowWidth.value, 800) / 3,
        200
      ) || 200;
    return height;
  });
  return {
    minHeight,
  };
};
