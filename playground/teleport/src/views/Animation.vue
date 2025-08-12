<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

const currentProtal = ref(1)

const next = (current: number) => {
  let v = Math.round(Math.random() * 8) + 1
  while (v === current) {
    v = Math.round(Math.random() * 8) + 1
  }
  return v
}

const teleprotTransition = () => {
  const nextPortalId = next(currentProtal.value)
  const fromPortal = document.getElementById(`portal-${currentProtal.value}`)
  const toPortal = document.getElementById(`portal-${nextPortalId}`)

  if (fromPortal && toPortal) {
    const fromRect = fromPortal.getBoundingClientRect()
    const toRect = toPortal.getBoundingClientRect()

    const propList = ['width', 'height', 'borderRadius', 'backgroundColor', 'borderColor']

    let portal0 = document.getElementById(`portal-${0}`)
    if (!portal0) {
      portal0 = fromPortal.cloneNode(false) as HTMLElement
      portal0.setAttribute('id', `portal-${0}`)
      portal0.style.position = 'absolute'
      portal0.style.overflow = 'hidden'
      portal0.style.borderWidth = '0px'
      portal0.style.borderColor = 'transparent'
      portal0.style.transition = "all 300ms ease"
      portal0.style.left = `${fromRect.left}px`
      portal0.style.top = `${fromRect.top}px`
      portal0.style.width = `${fromRect.width}px`
      portal0.style.height = `${fromRect.height}px`
      const fromStyle = getComputedStyle(fromPortal)

      for (const prop of propList) {
        portal0.style[prop] = fromStyle[prop]
      }
    }

    portal0.ontransitionend = () => {
      console.log('end')
      portal0.remove()
      currentProtal.value = nextPortalId
    }

    document.body.appendChild(portal0)
    currentProtal.value = 0

    nextTick(() => {
      const toStyle = getComputedStyle(toPortal)

      for (const prop of propList) {
        portal0.style[prop] = toStyle[prop]
      }

      portal0.style.left = `${toRect.left}px`
      portal0.style.top = `${toRect.top}px`
    })
  }
}

let animation: Animation

const teleportAnimate = () => {
  const nextPortalId = next(currentProtal.value)
  const fromPortal = document.getElementById(`portal-${currentProtal.value}`)
  const toPortal = document.getElementById(`portal-${nextPortalId}`)

  if (fromPortal && toPortal) {
    const toRect = toPortal.getBoundingClientRect()
    const fromRect = fromPortal.getBoundingClientRect()

    let portal0 = document.getElementById(`portal-${0}`)
    if (!portal0) {
      portal0 = fromPortal.cloneNode(false) as HTMLElement
      portal0.setAttribute('id', `portal-${0}`)
      portal0.style.position = 'absolute'
      portal0.style.overflow = 'hidden'
      portal0.style.left = `${fromRect.left}px`
      portal0.style.top = `${fromRect.top}px`
      portal0.style.width = `${fromRect.width}px`
      portal0.style.height = `${fromRect.height}px`
    }

    document.body.appendChild(portal0)
    currentProtal.value = 0

    nextTick(() => {
      const currentRect = portal0.getBoundingClientRect()
      const currentStyle = getComputedStyle(portal0)
      const nextStyle = getComputedStyle(toPortal)

      const newAnimation = portal0.animate({
        left: [`${currentRect.left}px`, `${toRect.left}px`],
        top: [`${currentRect.top}px`, `${toRect.top}px`],
        width: [`${currentRect.width}px`, `${toRect.width}px`],
        height: [`${currentRect.height}px`, `${toRect.height}px`],
        borderRadius: [`${currentStyle.borderRadius}`, `${nextStyle.borderRadius}`],
        borderWidth: [`${currentStyle.borderWidth}`, `${nextStyle.borderWidth}`],
        backgroundColor: [`${currentStyle.backgroundColor}`, `${nextStyle.backgroundColor}`],
        borderColor: [`${currentStyle.borderColor}`, `${nextStyle.borderColor}`],
      }, {
        duration: 300,
        easing: 'ease-in-out',
      })
      newAnimation.onfinish = () => {
        console.log('end')
        portal0.remove()
        currentProtal.value = nextPortalId
      }

      if (animation) {
        animation.cancel()
      }

      animation = newAnimation
    })

  }
}


const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    teleportAnimate()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <Teleport defer :to="`#portal-${currentProtal}`">
    <div ref="img" class="relative w-full h-full bg-amber-900 overflow-hidden select-none rounded-none">
      <img src="/images/10.jpg" class="w-full h-full object-cover object-top">
      <div class="absolute left-0 top-0 w-full overflow-hidden text-white break-all font-bold">
        ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
    </div>
  </Teleport>
  <div id="space" class="h-full" @click="teleportAnimate">
    <div class="flex h-30 gap-4">
      <div id="portal-1" class="w-20 h-20 bg-red-500 border-4"></div>
      <div id="portal-2" class="w-30 h-30 bg-blue-500"></div>
      <div id="portal-3" class="w-20 h-30 bg-green-500"></div>
      <div id="portal-4" class="w-30 h-20 bg-yellow-500 rounded-b-2xl overflow-hidden"></div>
    </div>
    <div class="flex h-40 gap-4 pt-4">
      <div id="portal-5" class="w-30 h-40 bg-yellow-500"></div>
      <div id="portal-6" class="w-20 h-20 bg-red-500 rounded-[5rem] overflow-hidden"></div>
      <div id="portal-7" class="w-50 h-30 bg-blue-500"></div>
      <div id="portal-8" class="w-20 h-30 bg-green-500 rounded-4xl overflow-hidden"></div>
    </div>
    <div id="portal-9"
      class="absolute top-5 right-5 w-20 h-60 border-4 border-gray-500 bg-zinc-500 rounded-tl-4xl overflow-hidden">
    </div>
  </div>
</template>
<style></style>
