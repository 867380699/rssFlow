<template>
  <ion-header>
    <ion-toolbar color="medium" class="electron:pt-4">
      <div
        class="absolute inset-x-0 -top-6 hidden h-6 electron:!block"
        style="-webkit-app-region: drag"
      ></div>
      <ion-buttons slot="primary">
        <ion-button id="more-trigger">
          <ion-icon slot="icon-only" :icon="ellipsisHorizontal"></ion-icon>
        </ion-button>
        <ion-popover
          trigger="more-trigger"
          trigger-action="click"
          alignment="end"
          css-class="more-menu-popover"
        >
          <MoreMenuModal></MoreMenuModal>
        </ion-popover>
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
      <ion-fab-list side="top">
        <ion-fab-button @click="importOPML">
          <ion-icon :icon="enterOutline" />
        </ion-fab-button>
        <ion-fab-button @click="exportOPML">
          <ion-icon :icon="exitOutline" />
        </ion-fab-button>
      </ion-fab-list>
    </ion-fab>
    <div>
      <div
        :key="0"
        class="flex h-12 cursor-pointer items-center p-2"
        @click="selectItem()"
      >
        <div class="flex-1 cursor-pointer">All</div>
        <ion-badge class="bg-gradient-to-tr from-primary from-40% to-secondary">
          {{ itemCounts && itemCounts[0] }}
        </ion-badge>
      </div>
      <feed-list
        :parent-id="0"
        :reorder-toggle="reorderToggle"
        @item-selected="(id) => emit('itemSelected', id)"
      />
    </div>
  </ion-content>
</template>
<script lang="ts" setup>
import { modalController } from '@ionic/vue';
import {
  add,
  ellipsisHorizontal,
  enterOutline,
  exitOutline,
  folder,
  logoRss,
  reorderFour,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';

import FeedList from '@/components/FeedList.vue';
import router from '@/router';
import { useFeedStore } from '@/store';
import { exportOPML, importOPML } from '@/utils/ompl';

import AddFeedModal from './modals/AddFeedModal.vue';
import AddGroupModal from './modals/AddGroupModal.vue';
import MoreMenuModal from './modals/MoreMenuModal.vue';

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
.more-menu-popover {
  --width: auto;
}
</style>
<style lang="less" scoped>
ion-fab-button {
  --border-radius: 8px;
}
</style>
