<template>
  <div>
    <div @click="isExpand = !isExpand">
      <slot name="header" :is-expand="isExpand">
        <div class="flex items-center p-2 h-12">
          <ion-icon
            :icon="chevronDownOutline"
            class="p-2 text-lg transition"
            :class="{ '-rotate-90': !isExpand }"
          />
          {{ title }}
        </div>
      </slot>
    </div>
    <div
      ref="contentRef"
      class="transition-all overflow-hidden"
      :class="{ 'max-h-0': !isExpand }"
      :style="isExpand ? contentStyle : {}"
    >
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver, useMutationObserver } from '@vueuse/core';
import { chevronDownOutline } from 'ionicons/icons';

const props = withDefaults(
  defineProps<{ title?: string; isExpand?: boolean }>(),
  {
    title: '',
    isExpand: true,
  }
);

const emit = defineEmits(['update:isExpand']);

const selfIsExpand = ref(props.isExpand);

const isExpand = computed({
  get() {
    return selfIsExpand.value;
  },
  set(newVal) {
    selfIsExpand.value = !selfIsExpand.value;
    emit('update:isExpand', newVal);
  },
});

watch(
  () => props.isExpand,
  () => (selfIsExpand.value = props.isExpand)
);

const contentStyle = ref({});
const contentRef = ref<HTMLElement | null>(null);

const calcContentStyle = () => {
  console.log('calcContentStyle');

  contentStyle.value = {
    maxHeight: `${contentRef.value?.scrollHeight}px`,
  };
};

const { stop } = useIntersectionObserver(contentRef, ([{ isIntersecting }]) => {
  if (isIntersecting) {
    calcContentStyle();
    stop();
  }
});

useMutationObserver(
  contentRef,
  () => {
    calcContentStyle();
  },
  {
    subtree: true,
    childList: true,
  }
);
</script>
