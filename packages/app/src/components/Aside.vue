<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>RSS</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-fab slot="fixed" vertical="top" horizontal="end" edge>
      <ion-fab-button @click="showModal">
        <ion-icon :icon="add" />
      </ion-fab-button>
      <ion-modal :is-open="modalIsOpen" @did-dismiss="closeModal()">
        <add-feed-modal @close="closeModal" />
      </ion-modal>
    </ion-fab>
    <ion-list>
      <ion-item :key="0" @click="selectItem()"> All </ion-item>
      <template v-for="feed in feeds" :key="feed.id">
        <ion-item :id="`aside-item-${feed.id}`" @click="selectItem(feed.id)">
          {{ feed.title }}
          <ion-badge slot="end">
            {{ itemCounts && itemCounts[feed.id || 0] }}
          </ion-badge>
        </ion-item>
        <ion-popover
          :trigger="`aside-item-${feed.id}`"
          :arrow="false"
          trigger-action="context-menu"
          :dismiss-on-select="true"
        >
          <ion-content>
            <ion-list v-for="action in actions" :key="action.key">
              <ion-item @click="handleFeedAction(action, feed)">
                {{ action.label }}
              </ion-item>
            </ion-list>
          </ion-content>
        </ion-popover>
      </template>
    </ion-list>
  </ion-content>
</template>
<script lang="ts" setup>
import { alertController } from '@ionic/vue';
import { add } from 'ionicons/icons';
import { ref } from 'vue';

import { useAllFeeds, useFeedItemCounts } from '@/composables';
import router from '@/router';
import { deleteFeed, updateFeed } from '@/service/dbService';
import { useFeedStore } from '@/store';
import { Feed } from '@/types';

const emit = defineEmits(['itemSelected']);

const { t } = useI18n();

const modalIsOpen = ref(false);

const showModal = () => {
  modalIsOpen.value = true;
};

const closeModal = () => {
  modalIsOpen.value = false;
};

const { feeds } = useAllFeeds();

const { counts: itemCounts } = useFeedItemCounts();

const { setFeedId } = useFeedStore();

const selectItem = (id?: number) => {
  setFeedId(id || 0);
  emit('itemSelected', id);
  router.replace({
    name: 'home',
    query: { ...router.currentRoute.value.query, id },
  });
};

type Action = {
  key: 'edit' | 'delete';
  label: string;
};

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
};

const alertDeleteFeed = async (feed: Feed) => {
  const alert = await alertController.create({
    message: t('confirmDeleteFeed', { name: feed.title }),
    buttons: [
      {
        text: t('cancel'),
        role: 'cancel',
      },
      {
        text: t('confirm'),
        role: 'confirm',
        handler: async () => {
          await deleteFeed(Number(feed.id));
          return true;
        },
      },
    ],
  });
  await alert.present();
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
        value: feed.link,
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
