<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button @click="$emit('onClose')">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>Add feed</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item>
      <ion-label position="floating">Feed URL</ion-label>
      <ion-input v-model="rssUrl"></ion-input>
    </ion-item>
    <ion-button @click="searchFeed">
      Search
    </ion-button>
    <ion-card v-if="feedRef">
      <img :src="feedRef.imageUrl" referrerpolicy="no-referrer">
      <ion-card-header>
        <ion-card-title>{{feedRef.title}}</ion-card-title>
        <ion-card-subtitle>{{feedRef.link}}</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>{{feedRef.description}}</ion-card-content>
    </ion-card>
  </ion-content>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { closeOutline } from 'ionicons/icons';
import { Feed, parseFeed } from "../service/feedService";
import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';

defineEmits(['onClose'])

const rssUrl = ref('');

const feedRef = ref<Feed>();

const searchFeed = async () => {
  const url = rssUrl.value;
  console.log(url);
  const match = /(https?:\/\/)?(.*)/.exec(url);
  if (match) {
    try {
      if (Capacitor.getPlatform() === 'web') {
        const resp = await fetch('/rss/' + match[2]);
        const feedText = await resp.text();
        feedRef.value = parseFeed(feedText);
      } else {
        const scheme = match[1] || 'http://'
        const resp = await Http.get({url: scheme + match[2]});
        feedRef.value = parseFeed(resp.data);
      }
      console.log(feedRef.value);
    } catch (e) {
      console.log(e);
    }
  } else {
    console.log('invalid url:', url);
  }
}
</script>

