<template>
  <div ref="content">
    <iframe
      v-if="showIframe"
      ref="frame"
      :src="feedItem.link"
      class="w-full h-full"
    />
    <div v-else class="p-2">
      <h1 class="font-bold text-xl my-4 mx-auto max-w-[800px]">
        {{ feedItem?.title }}
      </h1>
      <FeedContentComponent />
    </div>
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

const FeedContentComponent = parseFeedContent(props.feedItem.description || '');

scrollState[`detail-${props.feedItem.id}`] = useScroll(content);

onBeforeUnmount(() => {
  delete scrollState[`detail-${props.feedItem.id}`];
});
</script>
