<template>
  <!-- <pre><code>{{code}}</code></pre> -->
  <pre ref="container"><code>{{code}}</code></pre>
</template>

<script setup lang="ts">
import hljs from '../service/highlightService';

defineProps<{ code: string }>();

const container = ref<HTMLElement | null>(null);

onMounted(() => {
  if (container.value) {
    hljs.highlightElement(container.value);
  }
});
</script>
