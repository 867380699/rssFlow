<template>
  <div ref="content" class="p-2">
    <FeedContentComponent />
  </div>
</template>

<script setup lang="ts">
import { ComponentPublicInstance } from 'vue';

import { parseFeedContent } from '@/service/feedService';
import { FeedItem } from '@/types';

const props = defineProps<{
  feedItem: FeedItem;
}>();

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

const FeedContentComponent = parseFeedContent(props.feedItem.description || '');
</script>
