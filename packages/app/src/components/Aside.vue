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
    <div>
      <div
        :key="0"
        class="flex items-center p-2 h-12 cursor-pointer"
        @click="selectItem()"
      >
        <div class="flex-1 cursor-pointer">All</div>
        <ion-badge>
          {{ itemCounts && itemCounts[0] }}
        </ion-badge>
      </div>
      <feed-list :parent-id="0" :reorder-toggle="reorderToggle" />
    </div>
  </ion-content>
</template>
<script lang="ts" setup>
import { modalController } from '@ionic/vue';
import {
  add,
  ellipsisHorizontal,
  folder,
  logoRss,
  reorderFour,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';

import FeedList from '@/components/FeedList.vue';
import router from '@/router';
import { useFeedStore } from '@/store';

import AddFeedModal from './modals/AddFeedModal.vue';
import AddGroupModal from './modals/AddGroupModal.vue';

const emit = defineEmits(['itemSelected']);

const reorderToggle = ref(false);

const feedStore = useFeedStore();
const { feedItemCounts: itemCounts } = storeToRefs(feedStore);

const selectItem = (id?: number) => {
  feedStore.setFeedId(id || 0);
  emit('itemSelected', id);
  router.replace({
    name: 'home',
    query: { ...router.currentRoute.value.query, id },
  });
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
  const modal = await modalController.create({
    component: AddGroupModal,
    componentProps: {
      onClose: () => modal.dismiss(),
    },
  });
  modal.present();
};

const toggleReorder = () => {
  reorderToggle.value = !reorderToggle.value;
};
</script>
<style lang="less">
.sortable-ghost {
  opacity: 0;
}
.sortable-chosen {
  font-weight: bold;
}
.sortable-drag {
  opacity: 1 !important;
}
</style>
