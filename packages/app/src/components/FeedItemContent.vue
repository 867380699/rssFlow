<template>
  <div ref="content" class="p-2">
    <h1 class="font-bold text-xl">{{ feedItem?.title }}</h1>
    <FeedContentComponent />
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
}>();

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

const FeedContentComponent = parseFeedContent(props.feedItem.description || '');

scrollState[`detail-${props.feedItem.id}`] = useScroll(content);

onBeforeUnmount(() => {
  delete scrollState[`detail-${props.feedItem.id}`];
});
</script>
