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
        <div class="swiper-zoom-container">
          <img :src="img" alt="" />
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import 'swiper/css/zoom';
import 'swiper/css/pagination';

import { modalController } from '@ionic/vue';
import { Pagination, Virtual, Zoom } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';

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
    }, 200);
  }
};

const onZoomChanged = () => {
  console.log('onZoomChanged');
  clearTimeout(closeTimeout);
  enableClose = false;
  setTimeout(() => {
    enableClose = true;
  }, 200);
};

const cancelClose = () => {
  clearTimeout(closeTimeout);
  closeTimeout = undefined;
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
