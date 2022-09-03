<template>
  <img
    ref="img"
    class="flow-lazy-image bg-slate-400 rounded-sm my-1"
    :style="minStyle"
    loading="lazy"
    :src="src"
    :onload="onload"
  />
</template>

<script setup lang="ts">
import { ComponentPublicInstance } from 'vue';

defineProps<{ src: string }>();

const img = ref<ComponentPublicInstance<HTMLImageElement> | null>(null);

const minStyle = ref<Record<string, string>>({ 'min-height': '40px' });

const onload = () => {
  minStyle.value = {};
};
</script>
