import { alertController } from '@ionic/vue';

export const useAlertConfirm = () => {
  const { t } = useI18n();

  const alertConfirm = async ({
    message,
    onConfirm,
  }: {
    message: string;
    onConfirm: () => Promise<void>;
  }) => {
    const alert = await alertController.create({
      message,
      buttons: [
        {
          text: t('cancel'),
          role: 'cancel',
        },
        {
          text: t('confirm'),
          role: 'confirm',
          handler: async () => {
            await onConfirm.call(this);
            return true;
          },
        },
      ],
    });
    await alert.present();
  };
  return { alertConfirm };
};
