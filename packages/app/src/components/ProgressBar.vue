<template>
  <div
    class="progress-bar bg-gradient-to-br from-primary from-45% via-secondary to-primary to-55% bg-no-repeat"
    :class="{
      'transition-all': progress === 0,
      ' duration-300': progress === 0,
    }"
    :style="style"
  ></div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    progress?: number;
    loading?: boolean;
    position?: 'left' | 'center';
  }>(),
  {
    progress: 0,
    loading: false,
    position: 'center',
  }
);

const style = computed(() => ({
  height: '2px',
  'background-position': `${props.position === 'center' ? '50%' : 0} 0`,
  'background-size': `${(props.progress || 0) * 100}% 100vw`,
  animation: props.loading ? 'progress 1.5s linear infinite alternate' : 'none',
}));
</script>
<style lang="less">
.progress-bar {
  animation: none;
}
@keyframes progress {
  from {
    background-position-y: 0;
  }
  to {
    background-position-y: calc(-100vw + 2px);
  }
}
</style>
