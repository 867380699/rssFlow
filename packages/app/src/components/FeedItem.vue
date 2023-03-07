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
      @click="($event)=>toDetail(item.id!, $event)"
    >
      <ion-thumbnail
        v-if="item.image || item.video"
        slot="end"
        class="m-1 w-[64px] h-[64px] relative"
      >
        <LazyImage
          :key="item.id"
          :src="item.video?.poster || item.image"
          class="rounded"
          crossorigin="anonymous"
        />
        <div
          v-if="item.video?.poster || item.audio"
          class="media-badge px-1 py-0.5 absolute right-0 bottom-0 bg-black text-white opacity-60 rounded-tl"
        >
          <ion-icon
            v-if="item.video?.poster"
            :icon="videocamOutline"
            class="text-xs block"
          ></ion-icon>
          <ion-icon
            v-else-if="item.audio"
            :icon="musicalNotesOutline"
            class="text-xs block"
          ></ion-icon>
        </div>
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
        <p class="!text-sm pl-6 font-light">
          {{ item.shortDescription?.slice(0, 100) }}
        </p>
      </ion-label>
    </ion-item>
  </ion-item-sliding>
</template>

<script setup lang="ts">
import type { Animation } from '@ionic/vue';
import {
  createAnimation,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonThumbnail,
  useIonRouter,
} from '@ionic/vue';
import { formatRelative } from 'date-fns';
import {
  musicalNotesOutline,
  trashOutline,
  videocamOutline,
} from 'ionicons/icons';

import { deleteFeedItem, updateFeedItem } from '@/service/dbService';
import { FeedItem } from '@/types';
import { useAlertConfirm } from '@/utils/alert';

const router = useIonRouter();
const { t } = useI18n();
const { alertConfirm } = useAlertConfirm();

const props = defineProps<{
  item: FeedItem;
}>();

const pubDate = computed(() =>
  props.item.pubDate ? formatRelative(props.item.pubDate, new Date()) : ''
);

const toDetail = (id: number, $event: Event) => {
  const itemEl = ($event.target as HTMLElement).closest('ion-item');
  const { top, bottom } = itemEl!.getBoundingClientRect();
  updateFeedItem(id, { isRead: 1, readTime: new Date().getTime() });
  router.push(`/detail/${id}`, (baseEl, opts) => {
    const isForward = opts.direction === 'forward';
    const enteringAnimation: Animation = createAnimation()
      .addElement(isForward ? opts.enteringEl : opts.leavingEl)
      .keyframes([
        {
          offset: 0,
          opacity: 0.2,
          clipPath: `inset(${top}px 0px calc(100vh - ${bottom}px) 0px)`,
        },
        {
          offset: 1,
          opacity: 1,
          clipPath: 'inset(0px 0px 0px 0px)',
        },
      ])
      .direction(isForward ? 'normal' : 'reverse');
    const leavingAnimation = createAnimation()
      .addElement(isForward ? opts.leavingEl : opts.enteringEl)
      .keyframes([
        {
          offset: 0,
          opacity: 1,
        },
        {
          offset: 1,
          opacity: 1,
        },
      ]);
    return createAnimation()
      .addAnimation([enteringAnimation, leavingAnimation])
      .duration(200);
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
