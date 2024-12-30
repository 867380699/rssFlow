<template>
  <pre
    ref="container"
    @touchstart="onToutchStart"
    @touchmove="onTouchMove"
  ><code v-if="formatedCode" v-html="formatedCode"></code><code v-else>{{code}}</code></pre>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

import hljs from '../service/highlightService';

const props = defineProps<{ code: string }>();

const container = useTemplateRef('container');

const formatedCode = ref('');

const observer = useIntersectionObserver(
  container,
  (intersectionObserverEntries) => {
    for (const entry of intersectionObserverEntries) {
      if (entry.isIntersecting) {
        hljs.highlightCode(props.code).then((code) => {
          formatedCode.value = code;
        });
        observer.stop();
        break;
      }
    }
  },
  {
    window,
    threshold: 0,
    rootMargin: '200px 0px',
  }
);

let isHorizontalScrollable = false;
let touchStartX = 0;
let isReachStart = true;
let isReachEnd = false;

const onToutchStart = (ev: TouchEvent) => {
  if (container.value) {
    const { scrollWidth, clientWidth, scrollLeft } = container.value;
    isHorizontalScrollable = scrollWidth > clientWidth;
    isReachStart = scrollLeft === 0;
    isReachEnd = scrollLeft + 1 > scrollWidth - clientWidth;
  }
  touchStartX = ev.touches[0].clientX;
};

const onTouchMove = (ev: TouchEvent) => {
  if (isHorizontalScrollable) {
    const deltaX = ev.touches[0].clientX - touchStartX;
    if (!isReachStart && deltaX > 0) {
      ev.stopPropagation();
    } else if (!isReachEnd && deltaX < 0) {
      ev.stopPropagation();
    }
  }
};
</script>
