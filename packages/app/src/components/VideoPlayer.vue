<template>
  <div
    ref="container"
    class="video-player"
    @click="onVideoClick"
    @dblclick="togglePlay"
  >
    <video
      ref="video"
      playsinline
      :controls="useNativeControls"
      :poster="poster"
      @play="onVideoPlay"
      @pause="onVideoPause"
      @timeupdate="onVideoTimeUpdate"
      @loadedmetadata="onMetadataLoaded"
      @volumechange="onVolumeChange"
      @ratechange="onPlaybackChange"
    >
      <source :src="src" />
    </video>
    <!-- play/pause -->
    <ion-icon
      v-if="!useNativeControls"
      v-show="showPlayButtom"
      :icon="playCircle"
      class="btn-play"
      @click="play"
    />
    <!-- top control -->
    <Transition>
      <div
        v-if="!useNativeControls"
        v-show="isControlShown"
        ref="topControl"
        class="toolbar"
        :class="{ 'is-fullscreen': isFullscreen }"
        style="--tw-gradient-from: rgba(0, 0, 0, 0.6)"
      >
        <div>
          <!-- rotate -->
          <ion-icon
            v-show="isFullscreen"
            class="btn-rotate"
            :icon="isLandscape ? tabletLandscapeOutline : tabletPortraitOutline"
            @click="rotateScreen"
          />
        </div>

        <!-- download -->
        <ion-icon
          class="btn-download"
          :icon="downloadOutline"
          @click="download"
        />
      </div>
    </Transition>

    <!-- control -->
    <div
      v-if="!useNativeControls"
      ref="control"
      class="control-bar"
      :style="isControlShown ? '--tw-gradient-from: rgba(0, 0, 0, 0.8)' : ''"
    >
      <Transition>
        <div v-show="isControlShown" class="overlay">
          <div class="left">
            {{ durationLabel }}
          </div>
          <div v-on-click-outside="closeRatePopup" class="right">
            <!-- playback speed -->
            <div class="playback">
              <div
                v-show="ratePopupShown"
                class="popup"
                style="background-color: rgba(0, 0, 0, 0.5)"
              >
                <div
                  v-for="rate in playbackRateList"
                  :key="rate"
                  class="item"
                  :class="{ selected: rate === playbackRate }"
                  @click="() => setPlaybackRate(rate)"
                >
                  {{ rate.toFixed(2) }}x
                </div>
              </div>
              <div class="trigger" @click="toggleRatePopup">
                {{ playbackRate.toFixed(2) }}x
              </div>
            </div>
            <!-- volume -->
            <ion-icon
              class="icon-volume"
              :icon="isMuted ? volumeMute : volumeHigh"
              @click="toogleMute"
            />

            <!-- fullscreen -->
            <ion-icon
              v-if="isFullscreenSupported"
              class="icon-fullscreen"
              :icon="isFullscreen ? contractOutline : expandOutline"
              @click="toggleFullscreen"
            />
            <!-- fullscreen iOS support -->
            <ion-icon
              v-else-if="video.webkitEnterFullscreen"
              class="icon-fullscreen"
              @click="() => video.webkitEnterFullscreen()"
            />
          </div>
        </div>
      </Transition>
      <!-- prgoress -->
      <div
        class="progress"
        :class="{
          'is-control-shown': isControlShown,
          'is-fullscreen': isFullscreen,
          'is-landscape': isLandscape,
        }"
        @touchmove.stop="() => {}"
        @pointermove.stop="() => {}"
        @mousemove.stop="() => {}"
      >
        <progress
          class="bar"
          :class="{
            'is-control-shown': isControlShown,
          }"
          :max="duration"
          :value="currentTime"
        />
        <input
          v-show="isControlShown"
          type="range"
          class="seeker"
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
import { StatusBar } from '@capacitor/status-bar';
import { useBackButton } from '@ionic/vue';
import { vOnClickOutside } from '@vueuse/components';
import { useEventListener, useFullscreen } from '@vueuse/core';
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

import { useOriention } from '@/composables/oriention';
import { downloadLink } from '@/utils/flie';

const container = ref<HTMLElement | null>(null);
const video = ref<HTMLVideoElement | null>(null);
const control = ref<HTMLVideoElement | null>(null);
const topControl = ref<HTMLVideoElement | null>(null);

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

const {
  isSupported: isFullscreenSupported,
  isFullscreen,
  toggle: toggleFullscreen,
} = useFullscreen(container);

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

useEventListener(container, 'pointerdown', onTouchDown);
useEventListener(
  container,
  ['pointerup', 'pointerleave', 'pointerout'],
  onTouchUp
);

useEventListener(
  control,
  ['mousedown', 'pointerdown', 'touchstart', 'click'],
  (e) => {
    e.stopPropagation();
  }
);
useEventListener(
  topControl,
  ['mousedown', 'pointerdown', 'touchstart', 'click'],
  (e) => {
    e.stopPropagation();
  }
);
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
</script>
