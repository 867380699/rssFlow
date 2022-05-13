<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>RSS</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-fab
      slot="fixed"
      vertical="top"
      horizontal="end"
      edge
    >
      <ion-fab-button @click="showModal">
        <ion-icon :icon="add" />
      </ion-fab-button>
      <ion-modal
        :is-open="modalIsOpen"
        @did-dismiss="closeModal()"
      >
        <add-feed-modal @on-close="closeModal" />
      </ion-modal>
    </ion-fab>
    <ion-list>
      <ion-item
        :key="0"
        @click="selectItem()"
      >
        All
      </ion-item>
      <ion-item
        v-for="feed in feeds"
        :key="feed.id"
        @click="selectItem(feed.id)"
      >
        {{ feed.title }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { add } from 'ionicons/icons'
import { liveQuery } from "dexie";
import { feedDB } from "../service/dbService";
import { Feed } from "../types";
import { useStore } from "../store";

const emit = defineEmits(['itemSelected'])

const store = useStore();

const modalIsOpen = ref(false);
const showModal = () => {
  modalIsOpen.value = true;
};

const closeModal = () => {
  modalIsOpen.value = false;
};

const selectItem = (id?: number) => {
  store.setFeedId(id||0)
  emit('itemSelected', id)
}

const feeds = ref<Feed[]>();

liveQuery(() => feedDB.feeds.toArray()).subscribe({
  next: result => {
    feeds.value = result;
  },
  error: error => console.error(error)
})

</script>