<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>RSS</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-fab slot="fixed" vertical="top" horizontal="end" edge>
      <ion-fab-button size="small">
        <ion-icon :icon="add" />
      </ion-fab-button>
      <ion-fab-list side="start">
        <ion-fab-button @click="showModal">
          <ion-icon :icon="logoRss" />
        </ion-fab-button>
        <ion-fab-button>
          <ion-icon :icon="folder" />
        </ion-fab-button>
      </ion-fab-list>
      <ion-modal :is-open="modalIsOpen" @did-dismiss="closeModal()">
        <add-feed-modal @close="closeModal" />
      </ion-modal>
    </ion-fab>
    <ion-list>
      <ion-item :key="0" @click="selectItem()"> All </ion-item>
      <template v-for="feed in feeds" :key="feed.id">
        <ion-item
          :id="`aside-item-${feed.id}`"
          @click="selectItem(feed.id)"
          @contextmenu.prevent="(e: any) => showContextMenu(e, feed)"
        >
          {{ feed.title }}
          <ion-badge slot="end">
            {{ itemCounts && itemCounts[feed.id || 0] }}
          </ion-badge>
        </ion-item>
      </template>
    </ion-list>
  </ion-content>
</template>
<script lang="ts" setup>
import { popoverController } from '@ionic/vue';
import { add, folder, logoRss } from 'ionicons/icons';
import { ref } from 'vue';

import { useAllFeeds, useFeedItemCounts } from '@/composables';
import router from '@/router';
import { useFeedStore } from '@/store';
import { Feed } from '@/types';

import AsideItemModal from './modals/AsideItemModal.vue';

const emit = defineEmits(['itemSelected']);

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

const showContextMenu = async (event: any, feed: Feed) => {
  console.log('context-menu', feed);
  const popover = await popoverController.create({
    component: AsideItemModal,
    componentProps: { feed },
    event,
  });
  await popover.present();
};
</script>
