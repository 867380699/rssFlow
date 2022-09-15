<template>
  <img
    class="bg-slate-400 h-full w-full object-cover rounded-sm"
    :style="minStyle"
    :loading="loading"
    :src="imageSrc"
    :onload="onLoad"
    :onerror="onError"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string;
    loading?: 'lazy' | 'eager';
    minHeight?: string;
  }>(),
  {
    src: '',
    loading: 'lazy',
    minHeight: '60px',
  }
);

const isError = ref(false);

const imageSrc = computed(() =>
  isError.value || !props.src
    ? 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    : props.src
);

const minStyle = ref<Record<string, string>>({ 'min-height': props.minHeight });

const onLoad = () => {
  minStyle.value = {};
};

const onError = () => {
  isError.value = true;
};
</script>
