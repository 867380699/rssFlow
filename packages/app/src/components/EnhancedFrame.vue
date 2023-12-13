<template>
  <div ref="container" class="iframe-container">
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
      class="bubble"
      :class="{ 'is-active': isBubbleActive }"
      @click="activeBubble"
      @pointerover="activeBubble"
    >
      <div
        class="icon-list"
        :class="{
          'is-active': isBubbleActive,
        }"
      >
        <ion-icon
          v-if="isFullscreenSupported"
          class="icon"
          :icon="isFullscreen ? contractOutline : expandOutline"
          @click="toggleFullscreen"
        />
        <ion-icon
          v-show="isFullscreen"
          class="icon"
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
  toggle,
} = useFullscreen(container);

const isBubbleActive = ref(true);

const enable = ref(isBubbleActive.value);

let enableTimeout: ReturnType<typeof setTimeout>;
watch(isBubbleActive, () => {
  if (isBubbleActive.value) {
    enableTimeout = setTimeout(() => {
      enable.value = true;
    }, 150);
  } else {
    clearTimeout(enableTimeout);
    enable.value = false;
  }
});

const toggleFullscreen = () => {
  if (!enable.value) return;
  toggle();
};

useBackButton(10, (processNextHandler) => {
  if (isFullscreen.value) {
    toggle();
  } else {
    processNextHandler();
  }
});

const { isLandscape, reset: resetOriention, rotate } = useOriention();

const rotateScreen = () => {
  if (!enable.value) return;
  rotate();
};

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
<style lang="less" scoped>
@import '../theme/iframe.less';
</style>
