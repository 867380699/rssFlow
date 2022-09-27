<template>
  <ion-header>
    <ion-toolbar color="medium">
      <ion-buttons slot="primary">
        <ion-button>
          <ion-icon slot="icon-only" :icon="ellipsisHorizontal"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>RSS</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button size="small">
        <ion-icon :icon="add" />
      </ion-fab-button>
      <ion-fab-list side="start">
        <ion-fab-button @click="showAddFeedModal">
          <ion-icon :icon="logoRss" />
        </ion-fab-button>
        <ion-fab-button @click="showAddGroupModal">
          <ion-icon :icon="folder" />
        </ion-fab-button>
        <ion-fab-button @click="toggleReorder">
          <ion-icon :icon="reorderFour" />
        </ion-fab-button>
      </ion-fab-list>
    </ion-fab>
    <ion-list ref="listRef">
      <ion-item :key="0" @click="selectItem()"> All </ion-item>

      <ion-item
        v-for="feed in feeds"
        :id="`aside-item-${feed.id}`"
        :key="feed.id"
        @click="selectItem(feed.id)"
        @contextmenu.prevent="(e: any) => showContextMenu(e, feed)"
      >
        {{ feed.title }}
        <ion-icon slot="start" :icon="reorderThree" class="reorder-icon cursor-move" />
        <ion-badge slot="end">
          {{ itemCounts && itemCounts[feed.id || 0] }}
        </ion-badge>
      </ion-item>
    </ion-list>
  </ion-content>
</template>
<script lang="ts" setup>
import { modalController, popoverController } from '@ionic/vue';
import {
  add,
  ellipsisHorizontal,
  folder,
  logoRss,
  reorderFour,
  reorderThree
} from 'ionicons/icons';
import Sortable from 'sortablejs';
import { ComponentPublicInstance } from 'vue';

import { useAllFeeds, useFeedItemCounts } from '@/composables';
import router from '@/router';
import { useFeedStore } from '@/store';
import { Feed } from '@/types';

import AddFeedModal from './modals/AddFeedModal.vue';
import AsideItemModal from './modals/AsideItemModal.vue';

const emit = defineEmits(['itemSelected']);

const { feeds } = useAllFeeds();

const { counts: itemCounts } = useFeedItemCounts();

const listRef = ref<ComponentPublicInstance | null>(null);

onMounted(() => {
  console.log(listRef.value?.$el);
  if (listRef.value?.$el) {
    Sortable.create(listRef.value?.$el, {
      handle: '.reorder-icon'
    });
  }
});

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
  const popover = await popoverController.create({
    component: AsideItemModal,
    componentProps: { feed },
    event,
  });
  await popover.present();
};

const showAddFeedModal = async () => {
  const modal = await modalController.create({
    component: AddFeedModal,
    componentProps: {
      onClose: () => modal.dismiss(),
    },
  });
  modal.present();
};

const showAddGroupModal = async () => {
  //
};

const toggleReorder = () => {
  //
};
</script>
