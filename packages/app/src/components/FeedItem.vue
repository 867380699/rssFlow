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
import { createFadeInAnimation, createNoAnimation } from '@/utils/animation';

const router = useIonRouter();
const { t } = useI18n();
const { alertConfirm } = useAlertConfirm();

const props = defineProps<{
  item: FeedItem;
}>();

const emit = defineEmits<{
  (event: 'itemChanged', item: FeedItem, oldItem: FeedItem | null): void;
}>();

watch(
  () => props.item,
  (item, oldItem) => {
    emit('itemChanged', item, oldItem);
  }
);

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
  const itemTitleEl = itemEl?.querySelector('h2');
  let titleTop: number, paddingLeft: string, titleFontSize: string;
  if (itemTitleEl) {
    ({ top: titleTop } = itemTitleEl.getBoundingClientRect());
    ({ paddingLeft, fontSize: titleFontSize } = getComputedStyle(itemTitleEl));
  }

  updateFeedItem(id, { isRead: 1, readTime: Date.now() });
  router.push(`/detail/${id}`, (baseEl, opts) => {
    const detailTitleEl = baseEl.querySelector(
      `h1.detail-title-${props.item.id}`
    );
    let detailTitleTop;
    let detailTitleFontSize = '';
    if (detailTitleEl) {
      ({ top: detailTitleTop } = detailTitleEl.getBoundingClientRect());
      ({ fontSize: detailTitleFontSize } = getComputedStyle(detailTitleEl));
    }
    // console.log('push', baseEl, paddingLeft, titleTop, detailTitleTop, top);
    const isForward = opts.direction === 'forward';

    const titleScale = parseInt(titleFontSize) / parseInt(detailTitleFontSize);

    const titleAnimation = createAnimation()
      .addElement(baseEl.querySelector(`h1.detail-title-${props.item.id}`))
      .beforeStyles({ 'transform-origin': 'top left' })
      .beforeRemoveClass(isForward ? [] : ['font-bold'])
      .beforeAddClass(isForward ? [] : ['line-clamp-2'])
      .keyframes([
        {
          offset: 0,
          opacity: props.item.isRead ? 0.25 : 1,
          transform: `translate3d(${paddingLeft},${
            titleTop - detailTitleTop
          }px,0) scale3d(${titleScale},${titleScale},1)`,
        },
        {
          offset: 1,
          opacity: 1,
          transform: `translate3d(0,0,0) scale3d(1,1,1)`,
        },
      ]);

    const detailMetaEl = baseEl.querySelector(`.detail-meta-${props.item.id}`);
    const metaAnimation = createFadeInAnimation(detailMetaEl)
      .delay(isForward ? 250 : 0)
      .duration(isForward ? 200 : 0);

    const detailContenEl = baseEl.querySelector(
      `.detail-content-${props.item.id}`
    );
    const contentAnimation = createFadeInAnimation(detailContenEl)
      .delay(isForward ? 300 : 0)
      .duration(isForward ? 200 : 0);

    const backgroundAnimation = createAnimation()
      .addElement(baseEl.querySelector(`.detail-swiper`))
      .keyframes([
        {
          offset: 0,
          background: `var(--ion-item-background, #fff)`,
        },
        {
          offset: 1,
          background: 'var(--ion-background-color, #fff)',
        },
      ]);
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
      .addAnimation(titleAnimation)
      .addAnimation(metaAnimation)
      .addAnimation(contentAnimation)
      .addAnimation(backgroundAnimation)
      .direction(isForward ? 'normal' : 'reverse');

    const leavingAnimation = createNoAnimation(
      isForward ? opts.leavingEl : opts.enteringEl
    );

    return createAnimation()
      .addAnimation([enteringAnimation, leavingAnimation])
      .duration(250);
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
