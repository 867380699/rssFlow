<template>
  <div class="h-full w-full" @click="() => close()">
    <swiper
      class="h-full overflow-auto"
      :modules="[Virtual, Zoom, Pagination]"
      :initial-slide="index"
      :slides-per-view="1"
      :space-between="16"
      :virtual="{ enabled: true }"
      :zoom="true"
      :pagination="{ type: 'fraction' }"
      @slide-change="onSlideChange"
      @zoom-change="onZoomChanged"
      @after-init="afterInit"
    >
      <swiper-slide
        v-for="(img, idx) in showImages"
        :key="idx"
        :virtual-index="idx"
      >
        <drag-down-container @drag-end="onDragEnd">
          <div class="swiper-zoom-container">
            <img :key="img" :src="img" alt="" />
          </div>
        </drag-down-container>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import 'swiper/css/zoom';
import 'swiper/css/pagination';

import { createAnimation, GestureDetail, modalController } from '@ionic/vue';
import { Pagination, Swiper as SwiperClass, Virtual, Zoom } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';

import DragDownContainer from './DragDownContainer.vue';

const props = defineProps<{ imgs: string[]; index: number }>();

const activeIndex = ref(props.index);

const showImages = ref(Array(props.imgs.length).fill(props.imgs[props.index]));

let closeTimeout: any;

let enableClose = true;

let swiperInstance = ref<SwiperClass>();

const close = (delay = 300) => {
  console.log('close');
  if (closeTimeout) {
    cancelClose();
  }
  if (enableClose) {
    closeTimeout = setTimeout(() => {
      if (enableClose) {
        if (swiperInstance.value) {
          swiperInstance.value.zoom.out();
        }
        if (activeIndex.value !== props.index) {
          const translateY = activeIndex.value > props.index ? '30vh' : '-30vh';
          modalController.getTop().then((modalTop) => {
            modalTop.leaveAnimation = (baseEl) => {
              const backdropAnimation = createAnimation()
                .addElement(baseEl.shadowRoot.querySelector('ion-backdrop')!)
                .keyframes([
                  { offset: 0, opacity: '0.01' },
                  {
                    offset: 1,
                    opacity: 'var(--backdrop-opacity)',
                  },
                ])
                .direction('reverse');
              const wrapperAnimation = createAnimation()
                .addElement(baseEl.shadowRoot.querySelector('.modal-wrapper')!)
                .keyframes([
                  { offset: 0, opacity: '1', transform: 'translate(0,0)' },
                  {
                    offset: 1,
                    opacity: '0',
                    transform: `translate(0,${translateY})`,
                  },
                ]);
              return createAnimation()
                .addAnimation([backdropAnimation, wrapperAnimation])
                .addElement(baseEl)
                .duration(300);
            };
            modalController.dismiss(null, 'cancel');
          });
        } else {
          modalController.dismiss(null, 'cancel');
        }
      }
    }, delay);
  }
};

const onSlideChange = (swiper: SwiperClass) => {
  activeIndex.value = swiper.activeIndex;
};

const onZoomChanged = (swiper: SwiperClass) => {
  console.log('onZoomChanged', swiper.zoom);
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
    close(0);
  }
};

const afterInit = (swiper: SwiperClass) => {
  swiperInstance.value = swiper;
  setTimeout(() => {
    showImages.value = props.imgs;
  }, 200);
};
</script>

<style lang="less">
.gallery-modal {
  --width: 100vw;
  --height: 100vh;
  --background: transparent;
  --ion-backdrop-color: #000;
  --backdrop-opacity: 1;
  --box-shadow: none;

  .swiper-pagination-fraction {
    @apply opacity-50 text-white text-sm;
  }
}
</style>
