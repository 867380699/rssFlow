import { modalController } from '@ionic/vue';

import GalleryModal from '@/components/GalleryModal.vue';

export const useGallery = () => {
  const openGalleryModal = async (imgs: string[], index: number) => {
    const modal = await modalController.create({
      component: GalleryModal,
      componentProps: { imgs: imgs, index },
      cssClass: 'gallery-modal',
    });
    modal.present();
  };
  return { openGalleryModal };
};
