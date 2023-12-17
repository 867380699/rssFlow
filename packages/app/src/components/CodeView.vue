<template>
  <pre
    ref="container"
  ><code v-if="formatedCode" v-html="formatedCode"></code><code v-else>{{code}}</code></pre>
</template>

<script setup lang="ts">
import hljs from '../service/highlightService';

const props = defineProps<{ code: string }>();

const container = ref<HTMLElement | null>(null);

const formatedCode = ref('');

onMounted(() => {
  setTimeout(() => {
    hljs.highlightCode(props.code).then((code) => {
      formatedCode.value = code;
    });
  });
});
</script>
