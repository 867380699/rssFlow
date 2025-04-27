<template>
  <div class="table-view">
    <table>
      <slot></slot>
    </table>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'TableView',
  functional: true,
});
</script>

<style scoped lang="less"></style>
