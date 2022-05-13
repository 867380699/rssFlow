<template>
  <ion-page>
    <div v-html="feedItemContent"></div>
  </ion-page>
</template>
<script lang="ts">
import { onMounted, ref } from 'vue';
import { loadFeedItem } from '../service/dbService';
import { parseFeedContent } from '../service/feedService';
import { FeedItem } from '../types';

export default {
  name: 'Detail'
}
</script>
<script lang="ts" setup>
const props = defineProps<{
  id: number
}>()

const feedItem = ref<FeedItem>();
const feedItemContent = ref<string>();

onMounted(async ()=>{
  feedItem.value = await loadFeedItem(props.id);
  feedItemContent.value = parseFeedContent(feedItem.value?.description || '')
})
</script>