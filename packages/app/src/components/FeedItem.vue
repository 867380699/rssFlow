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
      class="feed-item flex h-[96px]"
      :class="{ 'opacity-50': item.isRead }"
      :style="{ '--inner-padding-end': '0' }"
      @click="toDetail(item.id!)"
    >
      <ion-thumbnail v-if="item.image" slot="end" class="m-1 w-[64px] h-[64px]">
        <LazyImage
          :key="item.id"
          :src="item.image"
          class="rounded"
          crossorigin="anonymous"
        />
      </ion-thumbnail>
      <ion-label class="m-0 py-1 h-[96px]">
        <div
          class="line block absolute h-[72px] w-[1px] bg-slate-400 top-6 left-[5.5px] rounded opacity-20"
        ></div>
        <div class="flex items-center">
          <div
            class="rounded-full w-3 h-3 bg-slate-400 bg-opacity-60 mr-3 opacity-40"
          />
          <p class="!text-xs opacity-70">{{ pubDate }}</p>
        </div>
        <h2 class="!text-base line-clamp-2 whitespace-normal pl-6">
          {{ item.title }}
        </h2>
        <p class="!text-sm pl-6">{{ item.shortDescription?.slice(0, 100) }}</p>
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