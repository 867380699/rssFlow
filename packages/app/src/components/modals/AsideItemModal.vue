<template>
  <ion-content>
    <ion-list v-for="action in actions" :key="action.key">
      <ion-item @click="handleFeedAction(action, feed)">
        {{ action.label }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { alertController, popoverController } from '@ionic/vue';

import { deleteFeed, updateFeed } from '@/service/dbService';
import { Feed } from '@/types';
import { useAlertConfirm } from '@/utils/alert';

const props = defineProps<{ feed: Feed }>();

type Action = {
  key: 'edit' | 'delete';
  label: string;
};

const { t } = useI18n();

const actions: Action[] = [
  {
    key: 'edit',
    label: t('edit'),
  },
  {
    key: 'delete',
    label: t('delete'),
  },
];

const handleFeedAction = (action: Action, feed: Feed) => {
  console.log(action, feed);
  switch (action.key) {
    case 'edit':
      alertEditFeed(feed);
      break;
    case 'delete':
      alertDeleteFeed(feed);
      break;
  }
  popoverController.dismiss();
};

const { alertConfirm } = useAlertConfirm();

const alertDeleteFeed = async (feed: Feed) => {
  await alertConfirm({
    message: t('confirmDeleteFeed', { name: feed.title }),
    onConfirm: async () => {
      await deleteFeed(Number(feed.id));
    },
  });
};

const alertEditFeed = async (feed: Feed) => {
  const alert = await alertController.create({
    header: t('edit'),
    inputs: [
      {
        name: 'title',
        value: feed.title,
      },
      {
        value: feed.source,
        disabled: true,
      },
    ],
    buttons: [
      {
        text: t('cancel'),
        role: 'cancel',
      },
      {
        text: t('confirm'),
        role: 'confirm',
        handler: async (value) => {
          if (feed.id && value.title) {
            await updateFeed(feed.id, { title: value.title });
          }
          return true;
        },
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped></style>
