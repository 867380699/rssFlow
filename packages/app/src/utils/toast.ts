import { toastController } from '@ionic/vue';

export const toast = async (message: string, duration = 2000) => {
  if (message) {
    const toast = await toastController.create({
      duration,
      message: message,
    });
    await toast.present();
  }
};
