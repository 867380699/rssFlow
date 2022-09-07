<template>
  <div ref="content" class="p-4" />
</template>

<script setup lang="ts">
import { ComponentPublicInstance } from 'vue';

import { parseFeedContent } from '@/service/feedService';
import { FeedItem } from '@/types';
import Logger from '@/utils/log';

const props = defineProps<{
  feedItem: FeedItem;
}>();

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

onMounted(
  Logger.time(() => {
    if (content.value) {
      content.value.innerHTML = '';
      if (props.feedItem.description) {
        const feedItemContent = parseFeedContent(props.feedItem.description);
        feedItemContent && content.value.append(feedItemContent);
      }
    }
  }, 'parseFeedContent')
);
</script>
