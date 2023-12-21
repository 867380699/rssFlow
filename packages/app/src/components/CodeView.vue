<template>
  <pre
    ref="container"
  ><code v-if="formatedCode" v-html="formatedCode"></code><code v-else>{{code}}</code></pre>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

import hljs from '../service/highlightService';

const props = defineProps<{ code: string }>();

const container = ref<HTMLElement | null>(null);

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
</script>
