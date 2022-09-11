<template>
  <RecycleScroller
    class="h-full"
    :items="items"
    :item-size="76"
    key-field="id"
    :buffer="20"
  >
    <template #default="{ item }">
      <FeedItem :item="item" />
    </template>
  </RecycleScroller>
</template>
<script lang="ts" setup>
import FeedItem from '@/components/FeedItem.vue';
import { FeedItem as FeedItemType } from '@/types';

withDefaults(
  defineProps<{
    items?: FeedItemType[];
  }>(),
  { items: () => [] }
);
</script>
<style>
.feed-item {
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
