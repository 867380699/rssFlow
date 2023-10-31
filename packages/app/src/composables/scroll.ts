export type ScrollState = {
  x: number;
  y: number;
  progressX: number;
  progressY: number;
  totalX: number;
  totalY: number;
  isTitleInvisible?: boolean;
};
export const scrollState = reactive<Record<string, ScrollState>>({});
