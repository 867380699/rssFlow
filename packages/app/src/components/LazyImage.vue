<template>
  <div class="lazy-image relative h-full w-full rounded-sm">
    <img
      class="h-full w-full rounded-sm bg-slate-400 object-cover"
      :class="{ 'opacity-0': isError }"
      :style="minStyle"
      :crossorigin="crossorigin"
      :loading="loading"
      :src="src"
      :onload="onLoad"
      :onerror="onError"
    />
    <img
      :class="{
        'opacity-0': !(isLoading || isError),
        transition: !(isLoading || isError),
        'bg-transparent': !(isLoading || isError),
        'animate-brightness': isLoading && !isError,
      }"
      :style="minStyle"
      class="pointer-events-none absolute top-0 h-full w-full rounded-sm bg-slate-500 object-cover"
      :src="dummySrc"
    />
    <ion-icon
      v-show="isError"
      :icon="alertOutline"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200"
    />
  </div>
</template>

<script setup lang="ts">
import { alertOutline } from 'ionicons/icons';

const props = withDefaults(
  defineProps<{
    src?: string;
    loading?: 'lazy' | 'eager';
    minHeight?: string;
    crossorigin?: 'anonymous' | 'use-credentials' | '';
  }>(),
  {
    src: '',
    loading: 'lazy',
    minHeight: '36px',
    crossorigin: '',
  }
);

const isError = ref(false);
const isLoading = ref(true);

watch(
  () => props.src,
  () => {
    isError.value = false;
    isLoading.value = true;
  }
);

const dummySrc =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const minStyle = computed(() =>
  isLoading.value ? { 'min-height': props.minHeight } : {}
);

const onLoad = () => {
  isLoading.value = false;
};

const onError = () => {
  isError.value = true;
};
</script>
