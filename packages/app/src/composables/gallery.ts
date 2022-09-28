import { createAnimation, modalController } from '@ionic/vue';

import GalleryModal from '@/components/GalleryModal.vue';

export const useGallery = () => {
  const openGalleryModal = async (
    imgs: string[],
    index: number,
    element?: HTMLImageElement
  ) => {
    const enterAnimation = (baseEl: HTMLElement) => {
      const root = baseEl.shadowRoot!;

      let translate = '';
      let scale = 'scale(0)';
      if (element) {
        const { top, bottom, left, right } = element.getBoundingClientRect();
        const translateX = (-window.innerWidth + left + right) / 2;
        const translateY = (window.innerHeight - top - bottom) / 2;
        const scaleX = (right - left) / window.innerWidth;
        const scaleY = (bottom - top) / window.innerHeight;
        translate = `translate(${translateX}px, ${-translateY}px)`;
        scale = `scale(${scaleX}, ${scaleY})`;
        console.log(translate, scale);
      }

      const backdropAnimation = createAnimation()
        .addElement(root.querySelector('ion-backdrop')!)
        .keyframes([
          { offset: 0, opacity: '0.01', transform: `${translate} ${scale}` },
          {
            offset: 1,
            opacity: 'var(--backdrop-opacity)',
            transform: 'translate(0,0) scale(1)',
          },
        ]);

      const wrapperAnimation = createAnimation()
        .addElement(root.querySelector('.modal-wrapper')!)
        .keyframes([
          { offset: 0, opacity: '0', transform: `${translate}` },
          { offset: 1, opacity: '1', transform: 'translate(0,0) scale(1)' },
        ]);

      return createAnimation()
        .addElement(baseEl)
        .easing('ease-out')
        .duration(200)
        .addAnimation([backdropAnimation, wrapperAnimation]);
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
