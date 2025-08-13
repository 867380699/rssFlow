<template>
  <ion-item-sliding>
    <ion-item-options side="end">
      <ion-item-option color="danger">
        <i-ion-trash-outline slot="icon-only" @click="deleteItem(item)" />
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
        class="relative m-1 size-[64px]"
        :class="{ 'opacity-25': item.isRead }"
      >
        <LazyImage :src="imageSrc" />
        <div
          v-if="
            item.meta?.videoCount ||
            item.meta?.audioCount ||
            item.meta?.frameCount
          "
          class="media-badge absolute bottom-0 right-0 rounded-tl bg-black px-1 py-0.5 text-white opacity-60"
        >
          <i-ion-videocam-outline
            v-if="item.meta.videoCount"
            class="block text-xs"
          />
          <i-ion-musical-notes-outline
            v-else-if="item.meta.audioCount"
            class="block text-xs"
          />
          <i-ion-browsers-outline
            v-else-if="item.meta.frameCount"
            class="block text-xs"
          />
        </div>
      </ion-thumbnail>
      <ion-label class="m-0 h-20 py-1" :class="{ 'opacity-25': item.isRead }">
        <div
          class="line absolute left-[5.5px] block h-64 w-px rounded bg-slate-400 opacity-20"
        ></div>
        <h2
          class="line-clamp-2 !overflow-hidden whitespace-normal pl-5 leading-[26px]"
        >
          {{ item.title }}
        </h2>
        <p class="line-clamp-2 !overflow-hidden pl-5 !text-sm font-light">
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
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonThumbnail,
  useIonRouter,
} from '@ionic/vue';

import cacheService from '@/service/cacheService';
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
  router.push(`/detail?id=${id}`, (baseEl, opts) => {
    const t0 = Date.now();
    const isForward = opts.direction === 'forward';

    const detailContenEl = baseEl.querySelector(
      `.detail-content-${props.item.id}`
    );
    if (!isForward) {
      detailContenEl.style.maxHeight = '0 !important';
    }

    let detailTitleTop;
    let detailTitleFontSize = '';
    let detailTitleEl;

    if (cacheService.has('detailTitleTop')) {
      detailTitleTop = cacheService.get('detailTitleTop')?.value;
    } else {
      if (!detailTitleEl) {
        detailTitleEl = baseEl.querySelector(
          `h1.detail-title-${props.item.id}`
        );
      }
      detailTitleTop = detailTitleEl.getBoundingClientRect().y; // slow
      if (!isForward) {
        cacheService.set('detailTitleTop', detailTitleTop);
      }
    }

    if (cacheService.has('detailTitleFontSize')) {
      detailTitleFontSize = cacheService.get('detailTitleFontSize')?.value;
    } else {
      if (!detailTitleEl) {
        detailTitleEl = baseEl.querySelector(
          `h1.detail-title-${props.item.id}`
        );
      }
      detailTitleFontSize = getComputedStyle(detailTitleEl).fontSize; // slow
      cacheService.set('detailTitleFontSize', detailTitleFontSize);
    }

    console.log('push', detailTitleFontSize);

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

    const contentAnimation = isForward
      ? createFadeInAnimation(detailContenEl).delay(300).duration(200)
      : createNoAnimation(detailContenEl).beforeAddClass([
          'invisible',
          'hidden',
        ]);

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

    console.log('toDetail animation cost:', Date.now() - t0);

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
