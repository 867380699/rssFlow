<template>
  <img
    v-if="imageSrc"
    ref="img"
    class="flow-lazy-image bg-slate-400 rounded-sm"
    :style="minStyle"
    :loading="loading"
    :src="imageSrc"
    :onload="onLoad"
    :onerror="onError"
  />
  <div v-else class="bg-slate-400 rounded-sm h-full"></div>
</template>

<script setup lang="ts">
import { ComponentPublicInstance } from 'vue';

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

const imageSrc = useVModel(props, 'src');

const img = ref<ComponentPublicInstance<HTMLImageElement> | null>(null);

const minStyle = ref<Record<string, string>>({ 'min-height': props.minHeight });

const onLoad = () => {
  minStyle.value = {};
};

const onError = () => {
  imageSrc.value = '';
};
</script>
