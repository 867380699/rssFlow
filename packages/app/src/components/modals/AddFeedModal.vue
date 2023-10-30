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
      <ion-input
        v-model="rssUrl"
        inputmode="url"
        label="Feed URL"
        label-placement="floating"
      />
    </ion-item>
    <div class="p-2">
      <ion-button expand="block" @click="searchFeed">
        <ion-spinner v-if="isLoading" name="dots"></ion-spinner>
        <div v-else class="h-7 flex items-center">Search</div>
      </ion-button>
    </div>
    <ion-card v-if="feedRef">
      <ion-card-header>
        <img :src="feedRef.imageUrl" referrerpolicy="no-referrer" />
        <ion-card-title>{{ feedRef.title }}</ion-card-title>
        <ion-card-subtitle>{{ feedRef.link }}</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>{{ feedRef.description }}</ion-card-content>
      <ion-button class="m-2 float-right" fill="clear" @click="subscribeFeed">
        Subscribe
      </ion-button>
    </ion-card>
  </ion-content>
</template>

<script lang="ts" setup>
import { toastController } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';

import { useLoading } from '@/composables';
import { i18n } from '@/i18n';
import { getFeeds } from '@/service/apiService';
import { storeFeed } from '@/service/dbService';
import { parseFeed } from '@/service/feedService';
import { Feed } from '@/types';

const emit = defineEmits(['close']);

const rssUrl = ref('');

const feedRef = ref<Feed>();

const [isLoading, searchFeed] = useLoading(async () => {
  const showError = async (message: string) => {
    const toast = await toastController.create({
      duration: 2000,
      message,
    });
    await toast.present();
  };
  try {
    const feedText = await getFeeds(rssUrl.value);
    const feed = parseFeed(feedText, rssUrl.value);
    if (feed) {
      feedRef.value = feed;
    } else {
      showError(i18n.global.t('unsupportedFormant'));
    }
  } catch (e) {
    await showError(`${e}`);
    console.log(e);
  }
});

const subscribeFeed = async () => {
  if (feedRef.value) {
    await storeFeed(feedRef.value);
    emit('close');
  }
};
</script>
