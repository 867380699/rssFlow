<template>
  <ion-page>
    <ion-header>
      <ion-toolbar
        ref="toolbar"
        :style="topToolbarStyle"
        class="transition-all"
      >
        <ion-buttons slot="start">
          <ion-back-button text="" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content
      :fullscreen="true"
      :scroll-y="false"
      :style="{
        '--padding-top': `-${toolbarHeight}px`,
        '--padding-bottom': `-${toolbarHeight}px`,
      }"
    >
      <swiper
        class="h-full overflow-auto"
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
          <FeedItemContent
            :ref="`feedItemContent-${feed.id}`"
            :feed-item="feed"
            class="content-container overflow-auto h-full py-11"
          ></FeedItemContent>
        </swiper-slide>
      </swiper>
    </ion-content>
    <ion-footer>
      <ion-toolbar :style="bottomToolbarStyle" class="transition-all">
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
import { from } from '@vueuse/rxjs';
import {
  ellipse,
  ellipseOutline,
  openOutline,
  star,
  starOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { bufferCount, map, throttleTime } from 'rxjs';
import { Swiper as SwiperClass, Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { ComponentPublicInstance } from 'vue';

import FeedItemContent from '@/components/FeedItemContent.vue';
import { useFeedItems } from '@/composables';
import { scrollState } from '@/composables/scroll';
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

const currentScrollState = computed(
  () => scrollState[`detail-${feedItem.value?.id}`] || {}
);

const showToolbar = ref(true);

const toolbarHeight = ref(44);

const toolbar = ref<ComponentPublicInstance | null>(null);

onMounted(() => {
  setTimeout(() => {
    toolbarHeight.value = toolbar.value?.$el.clientHeight;
  });
});

from(currentScrollState, { deep: true })
  .pipe(
    map((e) => e.y),
    throttleTime(50),
    bufferCount(2)
  )
  .subscribe(([first, last]) => {
    // console.log(first - last);
    const result = first - last;
    if (Number.isNaN(result)) {
      showToolbar.value = true;
    } else if (Math.abs(first - last) > toolbarHeight.value) {
      showToolbar.value = first - last > toolbarHeight.value;
    }
  });

const topToolbarStyle = computed(() => ({
  opacity: `${showToolbar.value ? 1 : 0}`,
  top: `${showToolbar.value ? 0 : -toolbarHeight.value}px`,
}));

const bottomToolbarStyle = computed(() => ({
  opacity: `${showToolbar.value ? 1 : 0}`,
  bottom: `${showToolbar.value ? 0 : -toolbarHeight.value}px`,
}));

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
