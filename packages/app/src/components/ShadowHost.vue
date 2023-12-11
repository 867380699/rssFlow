<template>
  <div ref="shadowHost">
    <Teleport v-if="shadowRoot" :to="shadowRoot">
      <slot></slot>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  customStyle?: CSSStyleSheet[];
}>();

const shadowHost = ref<HTMLElement | null>(null);

const shadowRoot = ref<ShadowRoot | null>(null);

onMounted(() => {
  if (shadowHost.value) {
    shadowRoot.value = shadowHost.value.attachShadow({ mode: 'open' });
  }
});

watch(
  () => [shadowRoot, props.customStyle],
  () => {
    if (shadowRoot.value && props.customStyle) {
      shadowRoot.value.adoptedStyleSheets = props.customStyle;
    }
  },
  { deep: true }
);

defineExpose({
  shadowRoot,
});
</script>

<style scoped></style>
