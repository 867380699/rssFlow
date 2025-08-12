<template>
  <PortalSpace>
    <div class="flex gap-8">
      <button @click="addImage">ADD</button>
      <button @click="delImage">DEL</button>
    </div>
    <div class="flex gap-4 flex-wrap">
      <Portal v-for="(img, i) in images" :key="i" :tunnel-id="'same-id'" class="relative w-20 h-30 overflow-hidden">
        <PortalImage :id="img.image.id" :image="img.image.src"></PortalImage>
      </Portal>
    </div>
  </PortalSpace>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Portal from '../components/Portal.vue';
import PortalSpace from '../components/PortalSpace.vue';
import PortalImage from '@/components/PortalImage.vue';

const text = ref('text')

setTimeout(() => {
  text.value = 'TEXT'
}, 1000)

const allImages = [
  {
    id: "img-10",
    src: '/images/10.jpg'
  },
  {
    id: "img-33",
    src: '/images/33.jpg'
  },
  {
    id: "img-32",
    src: '/images/32.jpg'
  },
  {
    id: "img-34",
    src: '/images/34.jpg'
  }
]

const widthClassList = ['w-15', 'w-20', 'w-30']
const heightClassList = ['h-15', 'h-20', 'h-30']
const bgClassList = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500']
const radiusClassList = ['rounded-2xl', 'rounded-3xl', 'rounded-none']

const randomImage = () => {
  const index = Math.floor(Math.random() * allImages.length)
  const indexWidth = Math.floor(Math.random() * widthClassList.length)
  const indexHeight = Math.floor(Math.random() * heightClassList.length)
  const indexBg = Math.floor(Math.random() * bgClassList.length)
  const indexRound = Math.floor(Math.random() * radiusClassList.length)
  return {
    image: allImages[index],
    classList: [
      widthClassList[indexWidth],
      heightClassList[indexHeight],
      bgClassList[indexBg],
      radiusClassList[indexRound],
    ]
  }
}
const images = ref([randomImage()])

const addImage = () => {
  images.value.push(randomImage())
}

const delImage = () => {
  images.value.splice(-1, 1)
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Equal') {
    addImage()
  } else if (e.code === 'Minus') {
    delImage()
  }
})
</script>

<style scoped></style>
