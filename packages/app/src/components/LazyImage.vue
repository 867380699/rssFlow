<template>
  <div class="relative h-full w-full">
    <img
      class="bg-slate-400 h-full w-full object-cover rounded-sm"
      :crossorigin="crossorigin"
      :style="minStyle"
      :loading="loading"
      :src="src"
      :onload="onLoad"
      :onerror="onError"
    />
    <img
      v-show="isLoading || isError"
      :style="minStyle"
      class="absolute bg-slate-400 h-full w-full object-cover rounded-sm top-0"
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
    minHeight: '60px',
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
