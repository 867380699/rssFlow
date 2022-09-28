import { useWindowSize } from '@vueuse/core';

const { width: windowWidth, height: windowHeight } = useWindowSize();

export const useMinHeight = () => {
  const minHeight = computed(() => {
    const height =
      Math.max(
        windowHeight.value / 3,
        Math.min(windowWidth.value, 800) / 2,
        200
      ) || 200;
    console.log(height, 'wh');
    return height;
  });
  return {
    minHeight,
  };
};
