<template>
  <component :is="`h${level}`" :id="headerId" ref="header">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { useInjectContentContext } from '@/composables/content';

const props = defineProps<{
  id: number;
  level: number;
  text: string
}>()

const {contentContext} = useInjectContentContext();

const regId = ref(0);

const headerId = computed(() => `header-${props.id}-${regId.value}`)

const header = useTemplateRef<HTMLElement>('header')

const scrollIntoView = () => {
  if (header.value) {
    header.value.scrollIntoView({behavior: 'smooth', block: 'center'})
    header.value.animate([
      { opacity: 1, backgroundColor: "transparent", outline: "8px solid transparent" },
      { opacity: 0, backgroundColor: "yellow", outline: "8px solid yellow" },
      { opacity: 1, backgroundColor: "transparent", outline: "8px solid transparent" }
    ], {
      duration: 500,
      delay: 800
    }
  )
  }
}

if (contentContext) {
  const {level, text} = props
  regId.value = contentContext.registerHeader({level, text, scrollIntoView})
}
</script>

<style scoped>

</style>