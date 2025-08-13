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
      :loading="loading"
      :src="src"
      :onload="onLoad"
      :onerror="onError"
    />
    <img :style="minStyle" class="error-image" :src="dummySrc" />
    <div v-show="isError" class="error-icon">
      <slot name="error-icon">
        <i-ion-alert-outline />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'LazyImage', inheritAttrs: true });
const props = withDefaults(
  defineProps<{
    src?: string;
    loading?: 'lazy' | 'eager';
    minHeight?: string;
  }>(),
  {
    src: '',
    loading: 'lazy',
    minHeight: '36px',
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
