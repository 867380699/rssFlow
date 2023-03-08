<template>
  <div ref="container" class="relative flex justify-center items-center">
    <iframe
      :id="id"
      :src="src"
      :type="type"
      :width="width"
      :height="height"
      :style="isFullscreen ? 'width:100%; height:100%' : ''"
    ></iframe>
    <div
      ref="bubble"
      class="absolute left-0 top-1/2 -translate-y-1/2 flex transition-all overflow-hidden shadow"
      :class="{ 'opacity-60': isBubbleActive, 'opacity-20': !isBubbleActive }"
      @click="activeBubble"
      @pointerover="activeBubble"
    >
      <div
        class="flex flex-col bg-black text-white rounded-tr rounded-br transition-all"
        :class="{
          '-translate-x-6': !isBubbleActive,
          'pointer-events-none': !isBubbleActive,
        }"
      >
        <ion-icon
          v-if="isFullscreenSupported"
          class="p-2"
          :icon="isFullscreen ? contractOutline : expandOutline"
          @click="toggleFullscreen"
        />
        <ion-icon
          v-show="isFullscreen"
          class="p-2"
          :icon="isLandscape ? tabletLandscapeOutline : tabletPortraitOutline"
          @click="rotateScreen"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { StatusBar } from '@capacitor/status-bar';
import { useBackButton } from '@ionic/vue';
import { useFullscreen } from '@vueuse/core';
import {
  contractOutline,
  expandOutline,
  tabletLandscapeOutline,
  tabletPortraitOutline,
} from 'ionicons/icons';

import { useOriention } from '@/composables/oriention';

defineProps<{
  src?: string;
  id?: string;
  type?: string;
  width?: number | string;
  height?: number | string;
}>();

const container = ref<HTMLElement | null>(null);

const bubble = ref<HTMLElement | null>(null);

const {
  isSupported: isFullscreenSupported,
  isFullscreen,
  toggle: toggleFullscreen,
} = useFullscreen(container);

useBackButton(10, (processNextHandler) => {
  if (isFullscreen.value) {
    toggleFullscreen();
  } else {
    processNextHandler();
  }
});

const {
  isLandscape,
  reset: resetOriention,
  rotate: rotateScreen,
} = useOriention();

watch(isFullscreen, async () => {
  if (isFullscreen.value) {
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.hide();
  } else {
    resetOriention();
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.show();
  }
});
const isBubbleActive = ref(true);

let deactiveTimeout: ReturnType<typeof setTimeout> | undefined;

const activeBubble = () => {
  clearTimeout(deactiveTimeout);
  isBubbleActive.value = true;
  deactiveTimeout = setTimeout(() => {
    isBubbleActive.value = false;
  }, 3000);
};

onMounted(activeBubble);
</script>

<style scoped></style>