<template>
  <div class="h-full w-full" @click="close">
    <swiper
      class="h-full overflow-auto"
      :modules="[Virtual, Zoom, Pagination]"
      :initial-slide="index"
      :slides-per-view="1"
      :space-between="16"
      :virtual="{ enabled: true }"
      :zoom="true"
      :pagination="{ type: 'fraction' }"
      @zoom-change="onZoomChanged"
    >
      <swiper-slide v-for="(img, idx) in imgs" :key="idx" :virtual-index="idx">
        <drag-down-container @drag-end="onDragEnd">
          <div class="swiper-zoom-container">
            <img :src="img" alt="" />
          </div>
        </drag-down-container>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import 'swiper/css/zoom';
import 'swiper/css/pagination';

import { GestureDetail, modalController } from '@ionic/vue';
import { Pagination, Virtual, Zoom } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';

import DragDownContainer from './DragDownContainer.vue';

defineProps<{ imgs: string[]; index: number }>();

let closeTimeout: any;

let enableClose = true;

const close = () => {
  console.log('close');
  if (closeTimeout) {
    cancelClose();
  }
  if (enableClose) {
    closeTimeout = setTimeout(() => {
      enableClose && modalController.dismiss(null, 'cancel');
    }, 300);
  }
};

const onZoomChanged = ($event: any) => {
  console.log('onZoomChanged', $event.zoom);
  clearTimeout(closeTimeout);
  enableClose = false;
  setTimeout(() => {
    enableClose = true;
  }, 300);
};

const cancelClose = () => {
  clearTimeout(closeTimeout);
  closeTimeout = undefined;
};

const onDragEnd = (ev: GestureDetail) => {
  if (Math.abs(ev.deltaY) > 200) {
    modalController.dismiss(null, 'cancel');
  }
};
</script>

<style lang="less">
.gallery-modal {
  --width: 100vw;
  --height: 100vh;
  --background: #000;

  .swiper-pagination-fraction {
    @apply opacity-50 text-white text-sm;
  }
}
</style>
