<template>
  <div
    class="lazy-image"
    :class="{
      'is-loading': isLoading,
      'is-error': isError,
    }"
  >
    <img
      class="main-image"
      :style="minStyle"
      :crossorigin="crossorigin"
      :loading="loading"
      :src="src"
      :onload="onLoad"
      :onerror="onError"
    />
    <img :style="minStyle" class="error-image" :src="dummySrc" />
    <div v-show="isError" class="error-icon">
      <slot name="error-icon">
        <ion-icon :icon="alertOutline" />
      </slot>
    </div>
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
const isLoading = ref(false);

watch(
  () => props.src,
  () => {
    isError.value = false;
    isLoading.value = !!props.src;
  },
  { immediate: true }
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
@import '../theme/image.less'; // The component will be used in a ShadowHost
</style>
