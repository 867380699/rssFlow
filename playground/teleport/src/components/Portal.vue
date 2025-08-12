<template>
  <div ref="wrap" :id="id"></div>
</template>
<script setup lang="ts">
import { ref, inject, useSlots, onBeforeUnmount, useTemplateRef, onMounted } from 'vue';
import { PortalContextKey } from '@/types';

const props = defineProps({
  tunnelId: String
})

const slots = useSlots()

const id = ref('')

const wrapEl = useTemplateRef('wrap')

const portalSpace = inject(PortalContextKey)

const portalId = ref(0)

onMounted(() => {
  if (props.tunnelId === undefined) {
    throw new Error('tunnelId is required')
  } else {
    if (portalSpace) {
      portalId.value = portalSpace.register(props.tunnelId, { slots, el: wrapEl.value })
      id.value = `portal-${props.tunnelId}-${portalId.value}`
    }
  }
})

onBeforeUnmount(() => {
  if (portalSpace && props.tunnelId) {
    portalSpace.unregister(props.tunnelId)
  }
})
</script>

<style scoped></style>
