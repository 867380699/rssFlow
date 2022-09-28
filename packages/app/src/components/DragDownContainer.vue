<template>
  <div
    ref="dragDownContainer"
    class="w-full h-full flex items-center justify-center"
    :style="{
      transform: `translate3d(${deltaX}px, ${deltaY}px, 0)`,
      transition,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { createGesture, Gesture } from '@ionic/vue';

const props = withDefaults(
  defineProps<{
    enabled?: boolean;
  }>(),
  {
    enabled: true,
  }
);

const emit = defineEmits(['dragChange', 'dragEnd']);

const dragDownContainer = ref<HTMLElement | null>(null);

let gesture: Gesture;

let deltaX = ref(0);
let deltaY = ref(0);
let transition = ref('');

watch(
  () => props.enabled,
  () => {
    console.log('enable change', props.enabled);

    gesture?.enable(props.enabled);
  }
);

onMounted(() => {
  gesture = createGesture({
    el: dragDownContainer.value!,
    threshold: 15,
    gestureName: 'drag',
    direction: 'y',
    onMove: (ev) => {
      deltaX.value = ev.deltaX / 2;
      deltaY.value = ev.deltaY / 2;
      emit('dragChange', ev);
    },
    onStart: () => {
      transition.value = '';
    },
    onEnd: (ev) => {
      transition.value = 'all 0.2s';
      deltaX.value = 0;
      deltaY.value = 0;
      emit('dragEnd', ev);
    },
    notCaptured: () => console.log('notCaptured'),
  });
  gesture.enable(props.enabled);
});

onBeforeUnmount(() => {
  gesture?.destroy();
});
</script>
