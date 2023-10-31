<template>
  <div ref="content" :class="{ 'p-2': !showIframe }">
    <iframe
      v-if="showIframe"
      ref="frame"
      :src="feedItem.link"
      class="w-full h-full"
      @load="iframeLoad"
      @error="iframeError"
    />
    <template v-else>
      <h1
        ref="feedItemTitle"
        class="font-bold text-xl my-4 mx-auto max-w-[800px]"
      >
        {{ feedItem?.title }}
      </h1>
      <div
        class="meta flex justify-between py-1 border-b border-opacity-10 border-slate-400 mb-3"
      >
        <div class="flex items-center">
          <template v-for="(info, i) in metaInfo" :key="i">
            <div class="flex items-center mr-2">
              <ion-icon :icon="info.icon" class="text-sm"></ion-icon>
              <span class="ml-1 text-sm">{{ info.text }}</span>
            </div>
          </template>
        </div>

        <div v-if="feedItem.pubDate" class="flex items-center text-sm">
          <ion-icon :icon="calendarOutline" class="text-sm pr-1"></ion-icon>
          {{ format(feedItem.pubDate, 'yyyy-MM-dd HH:mm') }}
        </div>
      </div>
      <FeedContentComponent />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import format from 'date-fns/format';
import {
  browsersOutline,
  calendarOutline,
  filmOutline,
  imagesOutline,
  musicalNotesOutline,
  textOutline,
} from 'ionicons/icons';
import { ComponentPublicInstance } from 'vue';

import { scrollState } from '@/composables/scroll';
import { parseFeedContent } from '@/service/feedService';
import { FeedItem } from '@/types';

const props = defineProps<{
  feedItem: FeedItem;
  showIframe?: boolean;
}>();

type MetaInfo = { icon: string; text: string | number };

const metaInfo = computed<MetaInfo[]>(() => {
  const info: MetaInfo[] = [];
  const meta = props.feedItem.meta;
  if (meta) {
    if (meta.contentLength) {
      info.push({
        icon: textOutline,
        text: meta.contentLength,
      });
    }
    if (meta.audioCount) {
      info.push({
        icon: musicalNotesOutline,
        text: meta.audioCount,
      });
    }
    if (meta.frameCount) {
      info.push({
        icon: browsersOutline,
        text: meta.frameCount,
      });
    }
    if (meta.videoCount) {
      info.push({
        icon: filmOutline,
        text: meta.videoCount,
      });
    }
    if (meta.imageCount) {
      info.push({
        icon: imagesOutline,
        text: meta.imageCount,
      });
    }
  }
  return info;
});

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

const FeedContentComponent = parseFeedContent(props.feedItem);

const useScroll = (
  element: Ref<ComponentPublicInstance<HTMLElement> | null>
) => {
  const x = ref(0);
  const y = ref(0);
  const progressX = ref(0);
  const progressY = ref(0);
  const totalX = ref(0);
  const totalY = ref(0);
  const onScroll = (e: Event) => {
    const el = e.target as HTMLElement;
    const {
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    } = el;
    x.value = scrollLeft;
    y.value = scrollTop;
    progressX.value = x.value ? (scrollLeft + clientWidth) / scrollWidth : 0;
    progressY.value = y.value ? (scrollTop + clientHeight) / scrollHeight : 0;
    totalX.value = scrollWidth;
    totalY.value = scrollHeight;
    // console.log(x.value, y.value, progressX.value, progressY.value);
  };

  useEventListener(element, 'scroll', onScroll);
  useEventListener(element, 'scrollend', onScroll);

  return reactive({
    x,
    y,
    progressX,
    progressY,
    totalX,
    totalY,
  });
};

scrollState[`detail-${props.feedItem.id}`] = useScroll(content);

const feedItemTitle = ref<HTMLElement | null>(null);
const titleBottom = ref(0);

watch(
  () => scrollState[`detail-${props.feedItem.id}`].y,
  (y) => {
    scrollState[`detail-${props.feedItem.id}`].isTitleInvisible =
      y > titleBottom.value;
  }
);

setTimeout(() => {
  if (feedItemTitle.value) {
    titleBottom.value =
      feedItemTitle.value.offsetTop + feedItemTitle.value.offsetHeight - 48;
  }
});

onBeforeUnmount(() => {
  delete scrollState[`detail-${props.feedItem.id}`];
});

const iframeLoad = ($event: Event) => {
  console.log('iframe load', $event);
};
const iframeError = ($event: Event) => {
  // won't call when the 'X-Frame-Options' set to 'sameorigin'
  console.log('iframe error', $event);
};
</script>
