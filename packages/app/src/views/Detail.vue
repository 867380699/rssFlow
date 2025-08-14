<template>
  <ion-page>
    <ion-header class="transition-all duration-200" :style="topToolbarStyle">
      <ion-toolbar ref="toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" mode="md" />
        </ion-buttons>
        <div class="ml-1 flex items-center">
          <ion-thumbnail class="shrink-0 overflow-hidden rounded-full" style="--size: 32px">
            <LazyImage :src="feed?.imageUrl" loading="eager">
              <template v-if="feed?.title" #error-icon>
                <div class="uppercase">
                  {{ feed.title.slice(0, 1) }}
                </div>
              </template>
            </LazyImage>
          </ion-thumbnail>
          <div class="relative h-12 flex-1" @dblclick="scrollToTop">
            <div class="absolute top-1/2 -translate-y-1/2 transition-all" :class="{
              'line-clamp-1': isTitleInvisible,
              '!top-4': isTitleInvisible,
            }">
              {{ feed?.title }}
            </div>
            <Transition :name="titleTransition">
              <div v-show="isTitleInvisible" class="absolute bottom-1 line-clamp-1 text-xs opacity-75">
                {{ feedItem?.title }}
              </div>
            </Transition>
          </div>
        </div>
        <ion-buttons slot="end">
          <Transition name="fade">
            <ion-button v-if="currentOutline.length" @click.stop="toggleOutline">
              <i-ion-list class="text-lg"/>
            </ion-button>
          </Transition>
        </ion-buttons>
        <progress-bar v-show="showProgress" class="absolute inset-x-0 bottom-0 transition-none"
          :class="{ 'opacity-50': !showToolbar }" position="left" :progress="progress"></progress-bar>
      </ion-toolbar>
    </ion-header>
    <ion-content class="relative" :fullscreen="true" :scroll-y="false" :style="{
      '--padding-top': `-${toolbarHeight}px`,
      '--padding-bottom': `calc(${-toolbarHeight}px - var(--safe-area-inset-bottom))`,
    }">
      <swiper class="detail-swiper h-full overflow-auto" style="background-color: var(--ion-background-color)"
        :slides-per-view="1" :space-between="24" :resize-observer="resizeObserverEnable" @transition-end="transitionEnd"
        @after-init="afterSlideInit">
        <swiper-slide v-for="item in feedItems" :key="item && item.id">
          <FeedItemContent ref="feedContent" :feed-item="item" :custom-style="feed?.config?.customStyle"
            class="content-container h-full overflow-auto" :style="{
              'padding-top': `${toolbarHeight}px`,
              'padding-bottom': `${toolbarHeight}px`,
            }" />
        </swiper-slide>
      </swiper>
    </ion-content>
    <ion-footer :style="bottomToolbarStyle" class="transition-all duration-200"
      :class="{ 'shadow-none': !showToolbar }">
      <ion-toolbar>
        <div class="flex justify-around">
          <i-ion-open-outline @click="openLink(feedItem)" />
          <i-ion-ellipse-outline v-if="feedItem?.isRead" @click="toggleRead()" />
          <i-ion-ellipse v-else @click="toggleRead()" />

          <i-ion-star v-if="feedItem?.isFavorite" @click="toggleFavorite()" />
          <i-ion-star-outline v-else @click="toggleFavorite()" />
        </div>
      </ion-toolbar>
    </ion-footer>
    <Transition name="slide-right">
      <div v-if="showOutline" class="absolute right-0 top-0 overflow-hidden z-[20] h-full w-full flex justify-end"
        :style="{ 'paddingTop': `${toolbarHeight}px`, 'paddingBottom': `calc(${toolbarHeight}px` }">
        <div class="h-full max-w-[320px] w-2/3 overflow-auto p-2 border-l-2 border-t-2 border-b-2"
          :style="{ 'background-color': 'var(--ion-background-color)' }" v-on-click-outside="() => toggleOutline()">
          <component :is="`h${header.level}`" v-for="(header, index) in currentOutline" :key="index" class="py-1"
            @click="scrollToHeader(header)">
            <span class="text-gray-500 text-xs">{{ '#'.repeat(header.level) }}</span> {{ header.text }}
          </component>
        </div>
      </div>
    </Transition>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  DefaultSystemBrowserOptions,
  InAppBrowser,
} from '@capacitor/inappbrowser';
import { from } from '@vueuse/rxjs';
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
import { Feed, FeedItem } from '@/types';

import { vOnClickOutside } from '@vueuse/components';
import { useRouteQuery } from '@vueuse/router'

import { loadFeedItem, updateFeedItem } from '../service/dbService';

const router = useRouter();
const feedStore = useFeedStore();

const feedContent = useTemplateRef<typeof FeedItemContent>('feedContent');

const itemId = useRouteQuery('id', '0', { transform: Number })

const currentOutline = computed(() => {
  const currentFeecContent = feedContent.value?.find(
    (item: typeof FeedItemContent) => item.feedItem.id === itemId.value
  )
  return currentFeecContent?.headers || []
})

const showOutline = ref(false)
const toggleOutline = () => {
  showOutline.value = !showOutline.value
}
const scrollToHeader = (header: any) => {
  header.scrollIntoView?.();
  showOutline.value = false
}
const { homeFeedItems: cacheFeedItems, homeNextPage } = storeToRefs(feedStore);

let { feedItem } = useFeedItem(itemId); // live query

// feedItem initial value before the live query returns
if (cacheFeedItems.value) {
  const cachedFeedItem = cacheFeedItems.value.find(
    (item) => item.id === itemId.value
  );
  if (cachedFeedItem) {
    feedItem.value = cachedFeedItem;
  } else {
    feedItem.value = await loadFeedItem(itemId.value);
  }
}

const currentFeedId = computed(() => feedItem.value?.feedId || 0);

const { feed } = useFeed(currentFeedId);

const feedItems = ref<FeedItem[]>([feedItem.value!]);

const resizeObserverEnable = ref(false);

onBeforeRouteLeave(() => {
  resizeObserverEnable.value = false;
});

const isSlideInit = ref(false);
const afterSlideInit = (swiper: SwiperClass) => {
  setTimeout(() => {
    updateSlide(itemId.value, swiper);
    isSlideInit.value = true;
    resizeObserverEnable.value = true;
  }, 400);
};

const updateSlide = async (itemId: number, swiper: SwiperClass) => {
  if (cacheFeedItems.value?.length) {
    const index = cacheFeedItems.value.findIndex(({ id = 0 }) => id === itemId);
    const start = Math.max(0, index - 1);
    const end = start + 3;
    feedItems.value = cacheFeedItems.value.slice(start, end);

    const newIndex = feedItems.value.findIndex(({ id }) => id === itemId);
    swiper.activeIndex = newIndex;

    if (index + 3 > cacheFeedItems.value.length) {
      if (homeNextPage.value) {
        homeNextPage.value();
      }
    }
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
      if (isSlideInit.value) {
        router.replace({ query: { id: newId } });
      }
    }
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
  top: `${showToolbar.value ? 0 : -toolbarHeight.value + (showProgress.value ? 2 : 1)
    }px`,
}));

const bottomToolbarStyle = computed(() => ({
  opacity: `${showToolbar.value ? 1 : 0}`,
  bottom: showToolbar.value
    ? 0
    : `calc(${-toolbarHeight.value}px - var(--safe-area-inset-bottom))`,
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
    const replacementConfig = feed.value?.config?.replaceLink;
    let link: string;
    if (replacementConfig) {
      link = feedItem.link.replace(
        new RegExp(replacementConfig.from || ''),
        replacementConfig.to || ''
      );
    } else {
      link = feedItem.link;
    }

    InAppBrowser.openInSystemBrowser({
      url: link,
      options: DefaultSystemBrowserOptions,
    }).catch((e) => {
      console.log(e);
      window.open(link);
    });
  }
};

const scrollToTop = () => {
  currentScrollState.value.y = 0;
};
</script>
<style lang="less" scoped>
.content-container {
  &>h1 {
    max-width: 800px;
    margin: auto;
  }
}
</style>
