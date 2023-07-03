<template>
  <div class="relative h-full w-full rounded-sm">
    <img
      class="bg-slate-400 h-full w-full object-cover rounded-sm"
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
      }"
      :style="minStyle"
      class="absolute h-full w-full bg-slate-500 object-cover top-0 rounded-sm pointer-events-none"
      :src="dummySrc"
    />
  </div>
</template>

<script setup lang="ts">
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
