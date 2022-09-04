<template>
  <div ref="content" class="p-4" />
</template>

<script setup lang="ts">
import { ComponentPublicInstance } from 'vue';

import { parseFeedContent } from '@/service/feedService';
import { FeedItem } from '@/types';

const props = defineProps<{
  feedItem: FeedItem;
}>();

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

watchEffect(() => {
  if (content.value) {
    content.value.innerHTML = '';
    const feedItemContent =
      props.feedItem?.description &&
      parseFeedContent(props.feedItem?.description);
    feedItemContent && content.value.append(feedItemContent);
  }
});
</script>
