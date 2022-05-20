<template>
  <ion-list>
    <ion-item v-for="item in items" :key="item.id" @click="toDetail(item.id!)">
      <ion-avatar slot="start" />
      <ion-label>
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      </ion-label>
    </ion-item>
  </ion-list>
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
