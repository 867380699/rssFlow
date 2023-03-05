<template>
  <div
    ref="container"
    class="relative flex justify-center pb-0.5 mb-1"
    @fullscreenchange="onFullScreenChange"
  >
    <video
      ref="video"
      :controls="useNativeControls"
      :poster="poster"
      :src="src"
      @click="onVideoClick"
      @dblclick="togglePlay"
      @play="onVideoPlay"
      @pause="onVideoPause"
      @timeupdate="onVideoTimeUpdate"
      @loadedmetadata="onMetadataLoaded"
      @volumechange="onVolumeChange"
      @ratechange="onPlaybackChange"
    ></video>
    <!-- play/pause -->
    <ion-icon
      v-if="!useNativeControls"
      v-show="showPlayButtom"
      :icon="playCircle"
      class="text-white text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      @click="play"
    />
    <Transition>
      <div
        v-if="!useNativeControls"
        v-show="isControlShown"
        class="absolute left-0 right-0 top-0 flex justify-between bg-gradient-to-b from-slate-900 to-transparent"
        style="--tw-gradient-from: rgba(0, 0, 0, 0.6)"
      >
        <div>
          <!-- rotate -->
          <ion-icon
            v-show="isFullscreen"
            class="p-2"
            :icon="isLandscape ? tabletLandscapeOutline : tabletPortraitOutline"
            @click="rotateScreen"
          />
        </div>

        <!-- download -->
        <ion-icon
          class="p-2 drop-shadow"
          :icon="downloadOutline"
          @click="download"
        />
      </div>
    </Transition>

    <!-- control -->
    <div
      v-if="!useNativeControls"
      class="absolute bottom-0 w-full text-white transition-all bg-gradient-to-t from-transparent to-transparent"
      :style="isControlShown ? '--tw-gradient-from: rgba(0, 0, 0, 0.8)' : ''"
    >
      <Transition>
        <div v-show="isControlShown" class="flex justify-between">
          <div class="p-2 text-xs">
            {{ durationLabel }}
          </div>
          <div v-on-click-outside="closeRatePopup" class="flex">
            <!-- playback speed -->
            <div class="relative">
              <div
                v-show="ratePopupShown"
                class="absolute -translate-y-full top-0 py-1 rounded-sm"
                style="background-color: rgba(0, 0, 0, 0.5)"
              >
                <div
                  v-for="rate in playbackRateList"
                  :key="rate"
                  class="py-0.5 px-2 text-xs cursor-pointer"
                  :class="{ 'text-blue-400': rate === playbackRate }"
                  @click="() => setPlaybackRate(rate)"
                >
                  {{ rate.toFixed(2) }}x
                </div>
              </div>
              <div class="p-2 text-xs cursor-pointer" @click="toggleRatePopup">
                {{ playbackRate.toFixed(2) }}x
              </div>
            </div>
            <!-- volume -->
            <ion-icon
              class="p-2"
              :icon="isMuted ? volumeMute : volumeHigh"
              @click="toogleMute"
            />

            <!-- fullscreen -->
            <ion-icon
              class="p-2"
              :icon="isFullscreen ? contractOutline : expandOutline"
              @click="toggleFullscreen"
            />
          </div>
        </div>
      </Transition>
      <!-- prgoress -->
      <div
        class="relative mt-1 transition-all"
        :class="{
          'px-2': isControlShown,
          'mb-3': isFullscreen && isControlShown,
          'mb-1': isFullscreen && !isControlShown && !isLandscape,
        }"
        @touchmove.stop="() => {}"
        @pointermove.stop="() => {}"
        @mousemove.stop="() => {}"
      >
        <progress
          class="w-full block transition-all"
          :class="{
            'h-1': isControlShown,
            'mb-2': isControlShown,
            'h-0.5': !isControlShown,
            'mt-0.5': !isControlShown,
            'opacity-50': !isControlShown,
          }"
          :max="duration"
          :value="currentTime"
        />
        <input
          v-show="isControlShown"
          type="range"
          class="absolute top-0 appearance-none bg-transparent left-2 right-2"
          step="0.001"
          :max="duration"
          :value="currentTime"
          @mousemove="onSeekMove"
          @input="onVideoSeek"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBackButton } from '@ionic/vue';
import { vOnClickOutside } from '@vueuse/components';
import { useEventListener } from '@vueuse/core';
import {
  contractOutline,
  downloadOutline,
  expandOutline,
  playCircle,
  tabletLandscapeOutline,
  tabletPortraitOutline,
  volumeHigh,
  volumeMute,
} from 'ionicons/icons';

import { downloadLink } from '@/utils/flie';

const container = ref<HTMLElement | null>(null);
const video = ref<HTMLVideoElement | null>(null);

const props = defineProps<{
  poster?: string;
  src: string;
}>();

const useNativeControls = !document.createElement('video').canPlayType;

const isPlaying = ref(false);

const showPlayButtom = computed(() => !isPlaying.value);

const isControlShown = ref(true);

const onVideoPlay = () => {
  isPlaying.value = true;
};

const onVideoPause = () => {
  isPlaying.value = false;
};

let hideControlTimeout: ReturnType<typeof setTimeout> | null;

watch(isPlaying, () => {
  if (isPlaying.value) {
    // play
    hideControlTimeout = setTimeout(() => {
      isControlShown.value = false;
      hideControlTimeout = null;
    }, 1000);
  } else {
    // pause
    hideControlTimeout && clearTimeout(hideControlTimeout);
    isControlShown.value = true;
  }
});

const onVideoClick = () => {
  if (isPlaying.value) {
    isControlShown.value = !isControlShown.value;
  } else {
    play();
  }
};

const play = () => {
  video.value?.play();
};
const pause = () => {
  video.value?.pause();
};

const togglePlay = () => {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
};

const duration = ref(0);
const currentTime = ref(0);

const durationLabel = computed(
  () => `${formatTime(currentTime.value)} / ${formatTime(duration.value)}`
);

const onMetadataLoaded = () => {
  duration.value = video.value?.duration || 0;
};

const onVideoTimeUpdate = () => {
  currentTime.value = video.value?.currentTime || 0;
};

const formatTime = (time = 0) => {
  if (time < 1000 * 60 * 60 /* 1h */) {
    return new Date(time * 1000).toISOString().substring(14, 19);
  }
  return new Date(time * 1000).toISOString().substring(11, 19);
};

const isFullscreen = ref(false);

const toggleFullscreen = () => {
  if (isFullscreen.value) {
    document.exitFullscreen();
  } else {
    container.value?.requestFullscreen();
  }
};

const onFullScreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

useEventListener(
  container,
  ['mousemove', 'pointermove', 'touchmove'],
  (event) => {
    if (isFullscreen.value) {
      event.stopPropagation();
    }
  }
);

useBackButton(10, (processNextHandler) => {
  if (isFullscreen.value) {
    toggleFullscreen();
  } else {
    processNextHandler();
  }
});

const isMuted = ref(false);

const onVolumeChange = () => {
  console.log(video.value?.volume, video.value?.muted);
  isMuted.value = !!video.value?.muted;
};

const toogleMute = () => {
  if (video.value) {
    video.value.muted = !isMuted.value;
  }
};

const download = async () => {
  await downloadLink(props.src, props.src.split('?')[0]);
};

const playbackRateList = [1.75, 1.5, 1.25, 1.0, 0.75, 0.5];
const playbackRate = ref(1);

const ratePopupShown = ref<boolean>(false);

const closeRatePopup = () => {
  ratePopupShown.value = false;
};

const toggleRatePopup = () => {
  ratePopupShown.value = !ratePopupShown.value;
};

const setPlaybackRate = (rate: number) => {
  if (video.value) {
    video.value.playbackRate = rate;
  }
  closeRatePopup();
};

const onPlaybackChange = () => {
  playbackRate.value = video.value?.playbackRate || 1;
};

const onVideoSeek = (event: Event) => {
  const input = event.target as HTMLInputElement;
  console.log(input.value);
  if (video.value) {
    video.value.currentTime = Number(input.value);
  }
};

const onSeekMove = (event: Event) => {
  // console.log('move', e);
};

let prevRate = 1;
let isBoosting = false;
let boostTimeout: ReturnType<typeof setTimeout> | null = null;

const startboost = () => {
  boostTimeout = setTimeout(() => {
    if (video.value) {
      prevRate = video.value.playbackRate;
      video.value.playbackRate = 2;
      isBoosting = true;
    }
  }, 500);
};

const stopBoost = () => {
  console.log('touchup');

  if (boostTimeout) {
    clearTimeout(boostTimeout);
    boostTimeout = null;
  }
  if (isBoosting) {
    if (video.value) {
      video.value.playbackRate = prevRate;
    }
    isBoosting = false;
  }
};

const onTouchDown = () => {
  startboost();
};

const onTouchUp = () => {
  stopBoost();
};

useEventListener(video, 'pointerdown', onTouchDown);
useEventListener(video, 'pointerup', onTouchUp);
useEventListener(video, 'pointerleave', onTouchUp);
useEventListener(video, 'pointerout', onTouchUp);

const isLandscape = ref(false);

const syncOriention = () => {
  console.log('orientation', window.screen.orientation.type);
  isLandscape.value = /landscape/.test(window.screen.orientation.type);
};

useEventListener(container, 'fullscreenchange', () => {
  if (isFullscreen.value) {
    syncOriention();
  } else {
    window.screen.orientation.unlock();
  }
});

useEventListener(screen.orientation, 'change', syncOriention);

const rotateScreen = () => {
  const rotation = isLandscape.value ? 'portrait' : 'landscape';
  window.screen.orientation.unlock();
  window.screen.orientation.lock(rotation);
};
</script>

<style lang="less" scoped>
progress::-moz-progress-bar {
  @apply bg-blue-300;
}
progress::-webkit-progress-value {
  @apply bg-blue-300;
}
progress {
  @apply bg-blue-300;
}

input[type='range'] {
  height: 4px;
  width: calc(100% - 4px);
  margin-left: -6px;
  &::-webkit-slider-thumb {
    @apply appearance-none w-3 h-3 rounded-lg bg-blue-500;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 500ms ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
