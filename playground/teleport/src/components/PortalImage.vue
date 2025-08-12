<template>
  <div class="w-full h-full">
    <img src="/images/10.jpg" class="w-full h-full object-top object-cover">
    <img class="absolute left-0 top-0 w-10 h-15 object-cover" :src="image" />
    <div class="absolute left-0 bottom-0 w-full overflow-hidden text-white break-all font-bold">{{ id }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated } from 'vue';


defineProps<{
  id: string
  image: string
}>()

onMounted(() => {
  console.log('PortalImage mounted')
})

onUpdated(() => {
  console.log('PortalImage updated')
})

onUnmounted(() => {
  console.log('PortalImage unmounted')
})

</script>

<style lang="scss" scoped></style>
