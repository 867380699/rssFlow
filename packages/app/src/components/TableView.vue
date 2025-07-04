<template>
  <div ref="container" class="table-view">
    <table>
      <slot></slot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useTrapSwipe } from '@/composables';

defineOptions({
  name: 'TableView',
  functional: true,
});

const container = useTemplateRef('container');

useTrapSwipe(container);
</script>

<style scoped lang="less"></style>
