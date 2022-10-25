<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-menu-button slot="start" />
        <ion-title>{{ feed?.title || 'All' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="main-content" class="ion-padding">
      <FeedItemList :feed-id="feedId" :items="feedItems" />
    </ion-content>
    <ion-segment :value="feedItemFilter" @ion-change="segmentChanged($event)">
      <ion-segment-button v-for="tab in tabs" :key="tab.key" :value="tab.key">
        <ion-label>{{ tab.label }}</ion-label>
        <ion-icon :icon="tab.icon"></ion-icon>
      </ion-segment-button>
    </ion-segment>
  </ion-page>
</template>

<script lang="ts" setup>
import { eyeOffOutline, listOutline, starOutline } from 'ionicons/icons';
import { storeToRefs } from 'pinia';

import FeedItemList from '@/components/FeedItemList.vue';
import { FeedItemFilter } from '@/enums';
import { feedDB } from '@/service/dbService';
import { useFeedStore } from '@/store';
import { Feed } from '@/types';

const { t } = useI18n();

const ionRouter = useRouter();

const feedStore = useFeedStore();

const { feedId, feedItemFilter, feedItems } = storeToRefs(feedStore);

const tabs = [
  { key: FeedItemFilter.UNREAD, label: t('unread'), icon: eyeOffOutline },
  { key: FeedItemFilter.ALL, label: t('all'), icon: listOutline },
  { key: FeedItemFilter.FAVORITE, label: t('favorite'), icon: starOutline },
];

const segmentChanged = async ($event: CustomEvent) => {
  feedItemFilter.value = $event.detail.value;
  ionRouter.replace(`/home?type=${$event.detail.value}&id=${feedId.value}`);
};

const feed = ref<Feed>();

watchEffect(async () => {
  feed.value = await feedDB.feeds.get(feedId.value);
});

onBeforeUnmount(() => {
  console.log('unmount');
});
</script>
