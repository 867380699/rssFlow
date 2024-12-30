<template>
  <ion-content>
    <ion-list>
      <ion-item
        v-for="action in actions"
        :key="action.key"
        :button="true"
        @click="() => handleFeedAction(action)"
      >
        <span class="px-4">
          {{ action.label }}
        </span>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  modalController,
  popoverController,
} from '@ionic/vue';

import AboutModal from './AboutModal.vue';
import SettingsModal from './SettingsModal.vue';

type Action = {
  key: 'settings' | 'about';
  label: string;
};

const { t } = useI18n();

const actions: Action[] = [
  {
    key: 'settings',
    label: t('settings'),
  },
  {
    key: 'about',
    label: t('about'),
  },
];

const handleFeedAction = (action: Action) => {
  switch (action.key) {
    case 'settings':
      showSettingsModal();
      break;
    case 'about':
      showAboutModal();
      break;
  }
  popoverController.dismiss();
};

const showSettingsModal = async () => {
  const modal = await modalController.create({
    component: SettingsModal,
    componentProps: {
      onClose: () => modal.dismiss(),
    },
  });
  modal.present();
};

const showAboutModal = async () => {
  const modal = await modalController.create({
    component: AboutModal,
    componentProps: {
      onClose: () => modal.dismiss(),
    },
  });
  modal.present();
};
</script>

<style scoped></style>
