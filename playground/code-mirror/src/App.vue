<script setup lang="ts">
import { ref, onMounted } from "vue"
import CssEditor from './components/CssEditor.vue'

const visualHeight = ref(window.innerHeight)

const adjustHeight = () => {
  visualHeight.value = window.visualViewport?.height || window.innerHeight
  document.documentElement.style.height = `${visualHeight.value}px`
}

onMounted(() => {
  adjustHeight()
})

window.visualViewport?.addEventListener('resize', adjustHeight);
</script>

<template>
  <CssEditor />
</template>