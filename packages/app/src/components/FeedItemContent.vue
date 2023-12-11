<template>
  <div ref="content" class="scroll-smooth" :class="{ 'p-2': !showIframe }">
    <iframe
      v-if="showIframe"
      ref="frame"
      :src="feedItem.link"
      class="h-full w-full"
      @load="iframeLoad"
      @error="iframeError"
    />
    <template v-else>
      <h1
        ref="feedItemTitle"
        class="mx-auto my-4 max-w-[800px] text-xl font-bold"
        :class="`detail-title-${feedItem.id}`"
      >
        {{ feedItem?.title }}
      </h1>
      <div
        class="meta mx-auto mb-3 flex max-w-[800px] justify-between border-b border-slate-400/10 py-1"
        :class="`detail-meta-${feedItem.id}`"
      >
        <div class="flex items-center">
          <template v-for="(info, i) in metaInfo" :key="i">
            <div class="mr-2 flex items-center">
              <ion-icon :icon="info.icon" class="text-sm"></ion-icon>
              <span class="ml-1 text-sm">{{ info.text }}</span>
            </div>
          </template>
        </div>

        <div v-if="feedItem.pubDate" class="flex items-center text-sm">
          <ion-icon :icon="calendarOutline" class="pr-1 text-sm"></ion-icon>
          {{ format(feedItem.pubDate, 'yyyy-MM-dd HH:mm') }}
        </div>
      </div>
      <ShadowHost
        ref="shadowHost"
        :class="`detail-content-${feedItem.id}`"
        :custom-style="customStyle"
      >
        <FeedContentComponent />
      </ShadowHost>
    </template>
  </div>
</template>

<script setup lang="ts">
import { cssom, observe, twind } from '@twind/core';
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
import { ComponentExposed } from 'vue-component-type-helpers';

import { scrollState } from '@/composables/scroll';
import { parseFeedContent } from '@/service/feedService';
import { twindConfig } from '@/service/twindService';
import { FeedItem } from '@/types';

import detailCSS from '../theme/detail.less?inline';
import ShadowHost from './ShadowHost.vue';

const props = defineProps<{
  feedItem: FeedItem;
  showIframe?: boolean;
  customStyle?: string;
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

  const wrappedX = computed<number>({
    get() {
      return x.value;
    },
    set(x) {
      if (element.value) {
        element.value.scrollLeft = x;
      }
    },
  });

  const wrappedY = computed<number>({
    get() {
      return y.value;
    },
    set(x) {
      if (element.value) {
        element.value.scrollTop = x;
      }
    },
  });

  return reactive({
    x: wrappedX,
    y: wrappedY,
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

const detaillStyleSheet = new CSSStyleSheet();
detaillStyleSheet.replaceSync(detailCSS);

const customStyleSheet = computed(() => {
  const styleSheet = new CSSStyleSheet();
  if (props.customStyle) {
    styleSheet.replaceSync(props.customStyle);
  }
  return styleSheet;
});

const tailwindStyleSheet = new CSSStyleSheet();

const shadowHost = ref<ComponentExposed<typeof ShadowHost> | null>(null);

onMounted(() => {
  if (shadowHost.value) {
    const sheet = cssom(tailwindStyleSheet);
    const tw = twind(twindConfig, sheet);
    observe(tw, shadowHost.value.shadowRoot);
  }
});

const customStyle = computed(() => [
  detaillStyleSheet,
  tailwindStyleSheet,
  customStyleSheet.value,
]);
</script>
