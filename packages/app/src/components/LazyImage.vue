<template>
  <div class="lazy-image">
    <img
      class="main-image"
      :class="{ 'is-error': isError }"
      :style="minStyle"
      :crossorigin="crossorigin"
      :loading="loading"
      :src="src"
      :onload="onLoad"
      :onerror="onError"
    />
    <img
      :class="{
        'is-loading': isLoading,
        'is-error': isError,
      }"
      :style="minStyle"
      class="error-image"
      :src="dummySrc"
    />
    <ion-icon v-show="isError" :icon="alertOutline" class="error-icon" />
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
<style lang="less">
@import '../theme/image.less';
</style>
