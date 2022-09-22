<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button @click="$emit('close')">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>Add feed</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item>
      <ion-label position="floating"> Feed URL </ion-label>
      <ion-input v-model="rssUrl" />
    </ion-item>
    <ion-button @click="searchFeed"> Search </ion-button>
    <ion-card v-if="feedRef">
      <img :src="feedRef.imageUrl" referrerpolicy="no-referrer" />
      <ion-card-header>
        <ion-card-title>{{ feedRef.title }}</ion-card-title>
        <ion-card-subtitle>{{ feedRef.link }}</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>{{ feedRef.description }}</ion-card-content>
      <ion-button @click="subscribeFeed"> Subscribe </ion-button>
    </ion-card>
  </ion-content>
</template>

<script lang="ts" setup>
import { toastController } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';

import { getFeeds } from '@/service/apiService';
import { storeFeed } from '@/service/dbService';
import { parseFeed } from '@/service/feedService';
import { Feed } from '@/types';

const emit = defineEmits(['close']);

const rssUrl = ref('');

const feedRef = ref<Feed>();

const searchFeed = async () => {
  try {
    const feedText = await getFeeds(rssUrl.value);
    feedRef.value = parseFeed(feedText, rssUrl.value);
  } catch (e) {
    const toast = await toastController.create({
      duration: 2000,
      message: `${e}`,
    });
    await toast.present();
    console.log(e);
  }
};

const subscribeFeed = async () => {
  if (feedRef.value) {
    await storeFeed(feedRef.value, rssUrl.value);
    emit('close');
  }
};
</script>
