<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <h1 class="p-4 font-bold">{{ feedItem?.title }}</h1>
      <div ref="content" class="p-4" />
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
import { ComponentPublicInstance } from 'vue';

import { useFeedItem } from '@/composables';
import { FeedItem } from '@/types';

import { updateFeedItem } from '../service/dbService';
import { parseFeedContent } from '../service/feedService';

const props = defineProps<{
  id: number;
}>();

const { feedItem } = useFeedItem(props.id);

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

const feedItemContent = computed(() => {
  return (
    feedItem.value?.description && parseFeedContent(feedItem.value?.description)
  );
});

watchEffect(() => {
  if (content.value && feedItemContent.value) {
    console.log(content.value, feedItemContent.value);

    content.value.innerHTML = '';
    content.value.append(feedItemContent.value);
  }
});

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
