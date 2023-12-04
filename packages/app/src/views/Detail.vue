<template>
  <ion-page>
    <ion-header class="transition-all duration-200" :style="topToolbarStyle">
      <ion-toolbar ref="toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" mode="md" />
        </ion-buttons>
        <div class="ml-1 flex items-center">
          <ion-thumbnail
            class="shrink-0 overflow-hidden rounded-full"
            style="--size: 32px"
          >
            <LazyImage :src="feed?.imageUrl" />
          </ion-thumbnail>
          <div class="relative h-12 flex-1" @dblclick="scrollToTop">
            <div
              class="absolute top-1/2 -translate-y-1/2 transition-all"
              :class="{
                'line-clamp-1': isTitleInvisible,
                '!top-4': isTitleInvisible,
              }"
            >
              {{ feed?.title }}
            </div>
            <Transition :name="titleTransition">
              <div
                v-show="isTitleInvisible"
                class="absolute bottom-1 line-clamp-1 text-xs opacity-75"
              >
                {{ feedItem?.title }}
              </div>
            </Transition>
          </div>
        </div>
        <ion-buttons slot="end">
          <ion-button
            v-bind="{color: isShowIframeMap[feedItem?.id!] ? 'primary':''}"
            @click="toggleIframe"
          >
            <ion-icon slot="icon-only" :icon="swapHorizontalOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <progress-bar
          v-show="showProgress"
          class="absolute inset-x-0 bottom-0 transition-none"
          :class="{ 'opacity-50': !showToolbar }"
          position="left"
          :progress="progress"
        ></progress-bar>
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
        class="detail-swiper h-full overflow-auto"
        style="background-color: var(--ion-background-color)"
        :slides-per-view="1"
        :space-between="24"
        @transition-end="transitionEnd"
        @after-init="afterSlideInit"
      >
        <swiper-slide v-for="item in feedItems" :key="item && item.id">
          <FeedItemContent
            :feed-item="item"
            :show-iframe="isShowIframeMap[item.id!]"
            class="content-container h-full overflow-auto"
            :style="{
              'padding-top': `${toolbarHeight}px`,
              'padding-bottom': `${toolbarHeight}px`,
            }"
          />
        </swiper-slide>
      </swiper>
    </ion-content>
    <ion-footer :class="{ 'shadow-none': !showToolbar }">
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
  swapHorizontalOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { bufferCount, map, throttleTime } from 'rxjs';
import { Swiper as SwiperClass } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { ComponentPublicInstance } from 'vue';

import FeedItemContent from '@/components/FeedItemContent.vue';
import LazyImage from '@/components/LazyImage.vue';
import { useFeed, useFeedItem } from '@/composables';
import { scrollState } from '@/composables/scroll';
import { useFeedStore } from '@/store';
import { FeedItem } from '@/types';

import { loadFeedItem, updateFeedItem } from '../service/dbService';

const props = defineProps<{ id: number }>();

const itemId = ref(props.id);

let { feedItem } = useFeedItem(itemId);

feedItem.value = await loadFeedItem(props.id);

const currentFeedId = computed(() => feedItem.value?.feedId || 0);

const { feed } = useFeed(currentFeedId);

const feedStore = useFeedStore();

const { homeFeedItems: cacheFeedItems, homeNextPage } = storeToRefs(feedStore);

const feedItems = ref<FeedItem[]>([feedItem.value!]);

const afterSlideInit = (swiper: SwiperClass) => {
  setTimeout(() => {
    updateSlide(props.id, swiper);
  }, 400);
};

const updateSlide = async (itemId: number, swiper: SwiperClass) => {
  let index = 0;
  let cacheItems: FeedItem[] = [];
  if (cacheFeedItems.value?.length) {
    cacheItems = cacheFeedItems.value;
  }
  if (cacheItems.length) {
    index = cacheItems.findIndex(({ id = 0 }) => id === itemId);

    if (index + 3 > cacheItems.length) {
      if (homeNextPage.value) {
        homeNextPage.value();
      }
    }

    const start = Math.max(0, index - 1);
    const end = start + 3;

    feedItems.value = cacheItems.slice(start, end);

    const newIndex = feedItems.value.findIndex(({ id }) => id === itemId);

    // nextTick(() => {
    swiper.activeIndex = newIndex;
    // swiper.slideTo(newIndex, 0);
    // swiper.update();
    // });
  }
};

const transitionEnd = async (swiper: SwiperClass) => {
  const newFeedItem = feedItems.value[swiper.activeIndex];
  if (newFeedItem && newFeedItem.id) {
    const newId = newFeedItem.id;
    console.log('slide:transitionEnd', newId, feedItem.value?.id);

    if (newId !== feedItem.value?.id) {
      await updateFeedItem(newId, {
        isRead: 1,
        readTime: Date.now(),
      });
      itemId.value = newId;
      updateSlide(newId, swiper);
    }
  }
};

const isShowIframeMap = ref<Record<number, boolean>>({});

const toggleIframe = () => {
  if (feedItem.value && feedItem.value.id) {
    isShowIframeMap.value[feedItem.value.id] =
      !isShowIframeMap.value[feedItem.value.id];
  }
};

const showToolbar = ref(true);

const toolbarHeight = ref(0);

const toolbar = ref<ComponentPublicInstance | null>(null);

onMounted(() => {
  setTimeout(() => {
    toolbarHeight.value = toolbar.value?.$el.clientHeight;
  }, 300);
});

const currentScrollState = computed(
  () => scrollState[`detail-${feedItem.value?.id}`] || {}
);

const isTitleInvisible = computed(
  () => currentScrollState.value.isTitleInvisible
);

const titleTransition = ref('popup');
let disableTitleTransitionTimeout: ReturnType<typeof setTimeout>;

watch(itemId, (id, oldId) => {
  if (id !== oldId) {
    if (showToolbar.value) {
      clearTimeout(disableTitleTransitionTimeout);
      titleTransition.value = 'popup';
    } else {
      titleTransition.value = '';
      disableTitleTransitionTimeout = setTimeout(() => {
        titleTransition.value = 'popup';
      }, 200);
    }
    showToolbar.value = true;
  }
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
  top: `${
    showToolbar.value ? 0 : -toolbarHeight.value + (showProgress.value ? 1 : 1)
  }px`,
}));

const bottomToolbarStyle = computed(() => ({
  opacity: `${showToolbar.value ? 1 : 0}`,
  bottom: `${showToolbar.value ? 0 : -toolbarHeight.value}px`,
}));

const showProgress = computed(() => {
  return currentScrollState.value.totalY > window.innerHeight * 2;
});

const progress = computed(() => {
  return currentScrollState.value.progressY;
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

const scrollToTop = () => {
  currentScrollState.value.y = 0;
};
</script>
<style lang="less" scoped>
.content-container {
  & > h1 {
    max-width: 800px;
    margin: auto;
  }

  :deep(.feed-content-container) {
    max-width: 800px;
    margin: auto;

    @apply leading-7;

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
      @apply mb-4 leading-7;
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
    iframe {
      height: 56vw;
      @apply w-full mb-2;
    }
    audio {
      @apply m-auto mb-4 w-full;
    }
  }
}
</style>
