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
      class="feed-item h-[80px]"
      :style="{ '--inner-padding-end': '0' }"
      @click="($event)=>toDetail(item.id!, $event)"
    >
      <ion-thumbnail
        v-show="item.image || item.video"
        slot="end"
        class="relative m-1 h-[64px] w-[64px]"
        :class="{ 'opacity-25': item.isRead }"
      >
        <LazyImage :src="imageSrc" crossorigin="anonymous" />
        <div
          v-if="item.meta?.videoCount || item.meta?.audioCount"
          class="media-badge absolute bottom-0 right-0 rounded-tl bg-black px-1 py-0.5 text-white opacity-60"
        >
          <ion-icon
            v-if="item.meta.videoCount"
            :icon="videocamOutline"
            class="block text-xs"
          ></ion-icon>
          <ion-icon
            v-else-if="item.meta.audioCount"
            :icon="musicalNotesOutline"
            class="block text-xs"
          ></ion-icon>
        </div>
      </ion-thumbnail>
      <ion-label
        class="m-0 h-[80px] py-1"
        :class="{ 'opacity-25': item.isRead }"
      >
        <div
          class="line absolute left-[5.5px] block h-[72px] w-[1px] rounded bg-slate-400 opacity-20"
        ></div>
        <h2 class="line-clamp-2 whitespace-normal pl-5 !text-base">
          {{ item.title }}
        </h2>
        <p class="pl-5 !text-sm font-light">
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

const imageSrc = computed(() => {
  const src = props.item.video?.poster || props.item.image;
  if (src) {
    return `${src}?thumbnail=1#thumbnail`;
  } else {
    return src;
  }
});

const toDetail = (id: number, $event: Event) => {
  const itemEl = ($event.target as HTMLElement).closest('ion-item');
  const { top, bottom } = itemEl!.getBoundingClientRect();
  updateFeedItem(id, { isRead: 1, readTime: Date.now() });
  router.push(`/detail/${id}`, (baseEl, opts) => {
    const isForward = opts.direction === 'forward';
    const enteringAnimation: Animation = createAnimation()
      .addElement(isForward ? opts.enteringEl : opts.leavingEl)
      .keyframes([
        {
          offset: 0,
          opacity: 1,
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
