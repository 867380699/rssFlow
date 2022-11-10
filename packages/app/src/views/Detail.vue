<template>
  <ion-page>
    <ion-header>
      <ion-toolbar
        ref="toolbar"
        :style="topToolbarStyle"
        class="transition-all duration-200"
      >
        <ion-buttons slot="start">
          <ion-back-button text="" />
        </ion-buttons>
        <div class="flex items-center">
          <ion-thumbnail
            class="rounded-full overflow-hidden"
            style="--size: 36px"
          >
            <LazyImage :src="feed?.imageUrl" />
          </ion-thumbnail>
          {{ feed?.title }}
        </div>
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
        :slides-per-view="1"
        :space-between="24"
        :virtual="{ enabled: true }"
        @slide-change="onSlideChange"
        @after-init="afterSlideInit"
      >
        <swiper-slide
          v-for="item in feedItems"
          :key="item.id"
          :virtual-index="item.id"
        >
          <FeedItemContent
            :feed-item="item"
            class="content-container overflow-auto h-full"
            :style="{
              'padding-top': `${toolbarHeight}px`,
              'padding-bottom': `${toolbarHeight}px`,
            }"
          />
        </swiper-slide>
      </swiper>
    </ion-content>
    <ion-footer>
      <ion-toolbar
        :style="bottomToolbarStyle"
        class="transition-all duration-200"
      >
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
import LazyImage from '@/components/LazyImage.vue';
import { useFeed } from '@/composables';
import { scrollState } from '@/composables/scroll';
import { FeedItemFilter } from '@/enums';
import { useFeedStore } from '@/store';
import { FeedItem } from '@/types';

import {
  loadFeedItem,
  loadFeedItemsByIndex,
  loadRecentFeedItems,
  updateFeedItem,
} from '../service/dbService';

const props = defineProps<{ id: number }>();

const feedStore = useFeedStore();

feedStore.setFeedItemId(props.id);

const { feedId, feedItem, feedItemFilter } = storeToRefs(feedStore);

const currentFeedId = computed(() => feedItem.value?.feedId || 0);

const { feed } = useFeed(currentFeedId);

const currentFeedItem = await loadFeedItem(props.id);

const feedItems = ref<FeedItem[]>([currentFeedItem!]);

const currentScrollState = computed(
  () => scrollState[`detail-${feedItem.value?.id}`] || {}
);

const showToolbar = ref(true);

const toolbarHeight = ref(44);

const toolbar = ref<ComponentPublicInstance | null>(null);

onMounted(() => {
  setTimeout(() => {
    toolbarHeight.value = toolbar.value?.$el.clientHeight;
    console.log('toolbar height:', toolbarHeight.value);
  });
});

const afterSlideInit = (swiper: SwiperClass) => {
  setTimeout(async () => {
    const feedIds = feedId.value ? [feedId.value] : [];

    const isReadRange =
      feedItemFilter.value === FeedItemFilter.UNREAD ? [0] : [0, 1];

    const isFavoriteRange =
      feedItemFilter.value === FeedItemFilter.FAVORITE ? [1] : [0, 1];
    const allFeedItems = await loadFeedItemsByIndex({
      feedIds,
      isReadRange,
      isFavoriteRange,
    });
    const recentFeedItems = await loadRecentFeedItems(feedId.value);

    feedItems.value = (allFeedItems || [])
      .concat(recentFeedItems)
      .sort((a: any, b: any) => a.id - b.id);

    const index = feedItems.value.findIndex((feed) => feed.id === props.id);
    feedItems.value.unshift(currentFeedItem!);
    setTimeout(() => {
      feedItems.value.shift();
      swiper.slideTo(index, 0);
      swiper.update();
    });
  }, 200);
};

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

const onSlideChange = async (swiper: SwiperClass) => {
  const newFeedItem = feedItems.value[swiper.activeIndex];
  if (newFeedItem && newFeedItem.id) {
    const newId = newFeedItem.id;
    await updateFeedItem(newId, {
      isRead: 1,
      readTime: new Date().getTime(),
    });
    feedStore.setFeedItemId(newId);
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
    img {
      @apply mb-2;
    }
    small {
      @apply opacity-70;
    }
    hr {
      @apply opacity-70 mr-4;
    }
    code[lang] {
      @apply block rounded p-1 overflow-auto whitespace-pre;
    }
  }
}
</style>
