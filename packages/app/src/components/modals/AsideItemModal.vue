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
import { AlertInput, modalController, popoverController } from '@ionic/vue';

import { deleteFeed } from '@/service/dbService';
import { Feed } from '@/types';
import { useAlertConfirm } from '@/utils/alert';

import EditFeedModal from './EditFeedModal.vue';

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
      showEditFeedModal(feed);
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

const showEditFeedModal = async (feed: Feed) => {
  const inputs: AlertInput[] = [
    {
      name: 'title',
      value: feed.title,
    },
  ];
  if (feed.type === 'feed') {
    inputs.push({
      value: feed.source,
      disabled: true,
    });
  }
  const modal = await modalController.create({
    component: EditFeedModal,
    componentProps: {
      feed: feed,
      onClose: () => modal.dismiss(),
    },
  });
  modal.present();
};
</script>

<style scoped></style>
