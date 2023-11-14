export const waitForRefChange = <T>(ref: Ref<T>): Promise<void> => {
  return new Promise((resolve) => {
    const unwatch = watch(ref, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        resolve();
        unwatch();
      }
    });
  });
};

export const range = (length: number, start = 0, step = 1) => {
  const result: number[] = [];
  let i = start;
  do {
    result.push(i);
    i += step;
  } while (--length);
  return result;
};
