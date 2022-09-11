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
        class="h-full"
        :modules="[Virtual]"
        :initial-slide="index"
        :slides-per-view="1"
        :space-between="24"
        :virtual="{ enabled: true }"
        @slide-change="onSlideChange"
      >
        <swiper-slide
          v-for="feed in feedItems"
          :key="feed.id"
          :virtual-index="feed.id"
        >
          <div class="content-container overflow-auto h-full">
            <h1 class="p-2 font-bold">{{ feed?.title }}</h1>
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
import { Swiper as SwiperClass, Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';

import FeedItemContent from '@/components/FeedItemContent.vue';
import { useFeedItems } from '@/composables';
import { useFeedStore } from '@/store';
import { FeedItem } from '@/types';

import { loadFeedItems, updateFeedItem } from '../service/dbService';

const props = defineProps<{ id: number }>();

const feedStore = useFeedStore();

feedStore.setFeedItemId(props.id);

const { feedId, feedItem, feedItemFilter } = storeToRefs(feedStore);

const allFeedItems = await loadFeedItems(feedId.value);

const feedItems = computed(() =>
  useFeedItems(allFeedItems, feedId, feedItemFilter)
);

const index = computed(() =>
  feedItems.value.findIndex((feed) => feed.id === props.id)
);

const onSlideChange = (swiper: SwiperClass) => {
  const newFeedItem = feedItems.value[swiper.activeIndex];
  if (newFeedItem && newFeedItem.id) {
    const newId = newFeedItem.id;
    updateFeedItem(newId, {
      isRead: 1,
      readTime: new Date().getTime(),
    }).then(() => {
      feedStore.setFeedItemId(newId);
    });
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
<style lang="less" scoped>
.content-container {
  background-color: var(--ion-background-color, #fff);

  & > h1 {
    max-width: 800px;
    margin: auto;
  }

  :deep(.feed-content-container) {
    max-width: 800px;
    margin: auto;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      @apply mb-2 font-bold;
    }

    h1 {
      @apply text-lg;
    }
    p {
      @apply mb-4;
    }
    blockquote {
      @apply mb-4 pl-2 border-l-2;
    }
    span,
    strong {
      @apply mx-1;
    }
    a {
      @apply text-slate-500 mx-2;
    }
    ol,
    ul {
      @apply mb-4 list-disc ml-4;

      & > * {
        @apply mr-2;
      }
    }
    figure {
      @apply mb-2;
      figcaption {
        @apply text-sm text-center opacity-70;
      }
    }
    small {
      @apply opacity-70;
    }
    hr {
      @apply opacity-70 mr-4;
    }
  }
}
</style>
