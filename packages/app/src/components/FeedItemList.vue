<template>
  <RecycleScroller
    class="h-full"
    :items="items"
    :item-size="72"
    key-field="id"
    :buffer="50"
  >
    <template #default="{ item }">
      <ion-item lines="none" @click="toDetail(item.id!)">
        <ion-thumbnail slot="start">
          <LazyImage
            :key="item.id"
            v-model:src="item.image"
            class="rounded"
            crossorigin="anonymous"
          />
        </ion-thumbnail>
        <ion-label>
          <h2>{{ item.title }}</h2>
          <p>{{ item.shortDescription }}</p>
        </ion-label>
      </ion-item>
    </template>
  </RecycleScroller>
</template>
<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { updateFeedItem } from '@/service/dbService';
import { FeedItem } from '@/types';

import LazyImage from './LazyImage.vue';

withDefaults(
  defineProps<{
    items?: FeedItem[];
  }>(),
  { items: () => [] }
);

const router = useRouter();

const toDetail = (id: number) => {
  router.push(`/detail/${id}`).then(() => {
    updateFeedItem(id, { isRead: 1 });
  });
};
</script>
