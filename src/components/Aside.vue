<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>RSS</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-fab vertical="top" horizontal="end" slot="fixed" edge>
      <ion-fab-button @click="showModal">
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>
      <ion-modal :is-open="modalIsOpen" @didDismiss="closeModal()">
        <add-feed-modal @onClose="closeModal" />
      </ion-modal>
    </ion-fab>
    <ion-list>
      <ion-item v-for="feed in feeds" :key="feed.id">{{feed.title}}</ion-item>
    </ion-list>
  </ion-content>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { add } from 'ionicons/icons'
import { liveQuery } from "dexie";
import { feedDB } from "../service/dbService";
import { Feed } from "../types";

const modalIsOpen = ref(false);
const showModal = () => {
  modalIsOpen.value = true;
};

const closeModal = () => {
  modalIsOpen.value = false;
};

const feeds = ref<Feed[]>();

liveQuery(() => feedDB.feeds.toArray()).subscribe({
  next: result => {
    feeds.value = result;
  },
  error: error => console.error(error)
})

</script>