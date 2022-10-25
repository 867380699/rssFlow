<template>
  <RecycleScroller
    ref="scroller"
    class="h-full scroll-smooth"
    :items="items"
    :item-size="96"
    key-field="id"
    :buffer="20"
  >
    <template #default="{ item }">
      <FeedItem :item="item" />
    </template>
  </RecycleScroller>
</template>
<script lang="ts" setup>
import { ComponentPublicInstance } from 'vue';

import FeedItem from '@/components/FeedItem.vue';
import { FeedItem as FeedItemType } from '@/types';

const props = withDefaults(
  defineProps<{
    feedId?: number;
    items?: FeedItemType[];
  }>(),
  { feedId: 0, items: () => [] }
);

const scroller = ref<ComponentPublicInstance | null>(null);

watch(
  () => props.feedId,
  () => {
    (scroller.value?.$el as HTMLElement).scrollTop = 0;
  }
);
</script>
<style>
.feed-item {
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
