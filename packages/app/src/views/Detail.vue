<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="false">
      <swiper
        :grab-cursor="true"
        class="h-full"
        :modules="[Virtual]"
        :initial-slide="index"
        :slides-per-view="1"
        :space-between="50"
        :virtual="{ enabled: true, cache: false }"
        @slideChange="onSlideChange"
      >
        <swiper-slide
          v-for="feed in feedItems"
          :key="feed.id"
          :virtual-index="feed.id"
        >
          <div class="content-container overflow-auto h-full">
            <h1 class="p-4 font-bold">{{ feed?.title }}</h1>
            <FeedItemContent :feed-item="feed"></FeedItemContent>
          </div>
        </swiper-slide>
      </swiper>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <div class="flex justify-around">
          <ion-icon :icon="openOutline" @click="openLink(feedItem)" />
          <ion-icon
            :icon="feedItem?.isRead ? ellipseOutline : ellipse"
            @click="toggleRead()"
          />
          <ion-icon
            :icon="feedItem?.isFavorite ? star : starOutline"
            @click="toggleFavorite()"
          />
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  ellipse,
  ellipseOutline,
  openOutline,
  star,
  starOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';

import FeedItemContent from '@/components/FeedItemContent.vue';
import { useFeedStore } from '@/store';
import { FeedItem } from '@/types';

import { updateFeedItem } from '../service/dbService';

withDefaults(defineProps<{ index?: number }>(), {
  index: 0,
});

const feedStore = useFeedStore();

const { feedItem, feedItems } = storeToRefs(feedStore);

const onSlideChange = (swiper) => {
  // console.log(swiper);
  const newFeedItem = feedItems.value[swiper.activeIndex];
  if (newFeedItem && newFeedItem.id) {
    updateFeedItem(newFeedItem.id, {
      isRead: 1,
      readTime: new Date().getTime(),
    });
    feedItem.value = newFeedItem;
    // feedStore.setFeedId(feedItem.id);
  }
};

const toggleRead = () => {
  if (feedItem.value && feedItem.value.id) {
    updateFeedItem(feedItem.value.id, {
      isRead: feedItem.value.isRead ? 0 : 1,
    });
  }
};

const toggleFavorite = () => {
  if (feedItem.value && feedItem.value.id) {
    updateFeedItem(feedItem.value.id, {
      isFavorite: feedItem.value.isFavorite ? 0 : 1,
    });
  }
};

const openLink = (feedItem?: FeedItem) => {
  if (feedItem) {
    window.open(feedItem.link);
  }
};
</script>
<style>
.content-container {
  background-color: var(--ion-background-color, #fff);
}
</style>
