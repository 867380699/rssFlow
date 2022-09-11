<template>
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
      @click="toDetail(item.id!)"
    >
      <ion-thumbnail slot="start">
        <LazyImage
          :key="item.id"
          :src="item.image"
          class="rounded"
          crossorigin="anonymous"
        />
      </ion-thumbnail>
      <ion-label>
        <h2>{{ item.title }}</h2>
        <p class="text-sm">{{ item.shortDescription }}</p>
        <p class="text-xs">{{ pubDate }}</p>
      </ion-label>
    </ion-item>
  </ion-item-sliding>
</template>

<script setup lang="ts">
import { formatRelative } from 'date-fns';
import { trashOutline } from 'ionicons/icons';

import { deleteFeedItem, updateFeedItem } from '@/service/dbService';
import { FeedItem } from '@/types';
import { useAlertConfirm } from '@/utils/alert';

const router = useRouter();
const { t } = useI18n();
const { alertConfirm } = useAlertConfirm();

const props = defineProps<{
  item: FeedItem;
}>();

const pubDate = computed(() =>
  props.item.pubDate ? formatRelative(props.item.pubDate, new Date()) : ''
);

const toDetail = (id: number) => {
  updateFeedItem(id, { isRead: 1, readTime: new Date().getTime() }).then(() => {
    router.push(`/detail/${id}`);
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
