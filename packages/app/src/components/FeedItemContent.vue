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
      <h1 class="font-bold text-xl my-4 mx-auto max-w-[800px]">
        {{ feedItem?.title }}
      </h1>
      <FeedContentComponent />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useScroll } from '@vueuse/core';
import { ComponentPublicInstance } from 'vue';

import { scrollState } from '@/composables/scroll';
import { parseFeedContent } from '@/service/feedService';
import { FeedItem } from '@/types';

const props = defineProps<{
  feedItem: FeedItem;
  showIframe?: boolean;
}>();

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

const FeedContentComponent = parseFeedContent(props.feedItem);

scrollState[`detail-${props.feedItem.id}`] = useScroll(content);

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
