<template>
  <ion-page>
    <ion-content class="ion-padding">
      <FeedItemList :items="feedItems" />
    </ion-content>
  </ion-page>
</template>
<script lang="ts" setup>
import { useUnreadFeedItems } from '@/composables';
import { FeedItem } from '@/types';

import FeedItemList from '../components/FeedItemList.vue';

const props = withDefaults(
  defineProps<{
    id?: number;
  }>(),
  {
    id: 0,
  }
);

let feedItems = ref<FeedItem[] | undefined>([]);

watchEffect(() => {
  let { feedItems: newFeedItems } = useUnreadFeedItems(props.id);
  feedItems = newFeedItems;
});
</script>
