<template>
  <RecycleScroller
    class="h-full"
    :items="items"
    :item-size="72"
    key-field="id"
    :buffer="50"
  >
    <template #default="{ item }">
      <ion-item @click="toDetail(item.id!)">
        <ion-thumbnail slot="start">
          <img
            v-if="item.image"
            :key="item.id"
            :src="'/img/' + item.image"
            crossorigin="anonymous"
          />
        </ion-thumbnail>
        <ion-label>
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
        </ion-label>
      </ion-item>
    </template>
  </RecycleScroller>
</template>
<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { updateFeedItem } from '@/service/dbService';
import { FeedItem } from '@/types';

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
