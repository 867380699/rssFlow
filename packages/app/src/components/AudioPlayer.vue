<template>
  <audio controls @play="onPlay">
    <source :src="src" />
  </audio>
</template>

<script setup lang="ts">
const props = defineProps<{
  src: string;
  title: string;
  artwork?: string;
}>();

const onPlay = () => {
  if (navigator.mediaSession) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: props.title,
      artist: 'rssFlow',
      artwork: [
        { src: props.artwork || '', sizes: '96x96', type: 'image/png' },
        { src: props.artwork || '', sizes: '128x128', type: 'image/png' },
        { src: props.artwork || '', sizes: '192x192', type: 'image/png' },
        { src: props.artwork || '', sizes: '256x256', type: 'image/png' },
        { src: props.artwork || '', sizes: '384x384', type: 'image/png' },
        { src: props.artwork || '', sizes: '512x512', type: 'image/png' },
      ],
    });
  }
};
</script>
