<template>
  <RecycleScroller
    class="h-full"
    :items="items"
    :item-size="68"
    key-field="id"
    :buffer="20"
  >
    <template #default="{ item, index }">
      <ion-item-sliding>
        <ion-item-options side="end">
          <ion-item-option color="danger">
            <ion-icon
              slot="icon-only"
              :icon="trashOutline"
              @click="deleteItem(item)"
            ></ion-icon>
          </ion-item-option>
        </ion-item-options>

        <ion-item
          lines="none"
          class="feed-item"
          :class="{ 'opacity-50': item.isRead }"
          @click="toDetail(item.id!, index)"
        >
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
      </ion-item-sliding>
    </template>
  </RecycleScroller>
</template>
<script lang="ts" setup>
import { trashOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

import { deleteFeedItem, updateFeedItem } from '@/service/dbService';
import { FeedItem } from '@/types';
import { useAlertConfirm } from '@/utils/alert';

import LazyImage from './LazyImage.vue';

withDefaults(
  defineProps<{
    items?: FeedItem[];
  }>(),
  { items: () => [] }
);

const router = useRouter();
const { t } = useI18n();
const { alertConfirm } = useAlertConfirm();

const toDetail = (id: number, index: number) => {
  updateFeedItem(id, { isRead: 1, readTime: new Date().getTime() }).then(() => {
    router.push(`/detail/${id}?index=${index}`);
  });
};

const deleteItem = async (item: FeedItem) => {
  await alertConfirm({
    message: t('confirmDeleteFeed', { name: item.title }),
    onConfirm: async () => {
      await deleteFeedItem(Number(item.id));
    },
  });
};
</script>
<style>
.feed-item {
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
