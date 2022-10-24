import { createAnimation, modalController } from '@ionic/vue';

import GalleryModal from '@/components/GalleryModal.vue';

export const useGallery = () => {
  const openGalleryModal = async (
    imgs: string[],
    index: number,
    element: HTMLImageElement
  ) => {
    const enterAnimation = (baseEl: HTMLElement) => {
      const root = baseEl.shadowRoot!;

      let translate = '';
      let scale = 'scale(0)';
      if (element) {
        console.log(element);
        const { naturalWidth, naturalHeight, clientWidth, clientHeight } =
          element;
        const { innerWidth, innerHeight } = window;
        const imageMaxWidth = Math.min(innerWidth, naturalWidth);
        const imageMaxHeight = Math.min(innerHeight, naturalHeight);

        const imageScaleX = imageMaxWidth / naturalWidth;
        const imageScaleY = imageMaxHeight / naturalHeight;

        const scaleXY =
          imageScaleX > imageScaleY
            ? clientHeight / imageMaxHeight
            : clientWidth / imageMaxWidth;

        const { left, top, width, height } = element.getBoundingClientRect();
        const translateX = innerWidth / 2 - (left + width / 2);
        const translateY = innerHeight / 2 - (top + height / 2);
        translate = `translate(${-translateX}px, ${-translateY}px)`;
        scale = `scale(${scaleXY}, ${scaleXY})`;
        console.log(translate, scale);
      }

      const backdropAnimation = createAnimation()
        .addElement(root.querySelector('ion-backdrop')!)
        .keyframes([
          { offset: 0, opacity: '0.01', transform: `` },
          {
            offset: 1,
            opacity: 'var(--backdrop-opacity)',
            transform: 'translate(0,0) scale(1)',
          },
        ]);

      const wrapperAnimation = createAnimation()
        .addElement(root.querySelector('.modal-wrapper')!)
        .beforeStyles({ transform: 'none' })
        .keyframes([
          { offset: 0, opacity: '1', transform: ` ${translate} ${scale}` },
          { offset: 1, opacity: '1', transform: `translate(0,0) scale(1)` },
        ]);

      const imageAnimation = createAnimation()
        .addElement(element)
        .beforeStyles({ visibility: 'hidden' })
        .afterClearStyles(['visibility'])
        .keyframes([
          { offset: 0, opacity: '1' },
          { offset: 1, opacity: '1' },
        ]);

      return createAnimation()
        .addElement(baseEl)
        .duration(200)
        .addAnimation([backdropAnimation, wrapperAnimation, imageAnimation]);
    };

    const leaveAnimation = (baseEl: HTMLElement) => {
      return enterAnimation(baseEl).direction('reverse');
    };

    const modal = await modalController.create({
      component: GalleryModal,
      componentProps: { imgs: imgs, index },
      cssClass: 'gallery-modal',
      enterAnimation,
      leaveAnimation,
    });
    modal.present();
  };
  return { openGalleryModal };
};
