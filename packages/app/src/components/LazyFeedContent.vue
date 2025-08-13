<template>
  <div ref="container" class="feed-content-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
const container = ref<HTMLElement | null>(null);

</script>
