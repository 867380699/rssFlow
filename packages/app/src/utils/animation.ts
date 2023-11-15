import { createAnimation } from '@ionic/vue';

/**
 * @returns An animation with no effect
 */
export const createNoAnimation = (el: HTMLElement) => {
  return createAnimation()
    .addElement(el)
    .keyframes([
      {
        offset: 0,
        opacity: 1,
      },
      {
        offset: 1,
        opacity: 1,
      },
    ]);
};

export const createFadeInAnimation = (el: HTMLElement) => {
  return createAnimation()
    .addElement(el)
    .keyframes([
      {
        offset: 0,
        opacity: 0,
      },
      {
        offset: 1,
        opacity: 1,
      },
    ]);
};
