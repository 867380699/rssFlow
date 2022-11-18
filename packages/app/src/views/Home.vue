<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-menu-button slot="start" />
        <ion-title>{{ feed?.title || 'All' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="main-content" class="ion-padding" :scroll-y="false">
      <ion-refresher slot="fixed" @ion-refresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <FeedItemList
        :feed-id="feedId"
        :items="feedItems"
        class="ion-content-scroll-host"
      />
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <ion-segment class="flex-1" :value="feedItemFilter" @ion-change="segmentChanged($event)">
          <ion-segment-button v-for="tab in tabs" :key="tab.key" :value="tab.key">
            <ion-label>{{ tab.label }}</ion-label>
            <ion-icon :icon="tab.icon"></ion-icon>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-footer>

  </ion-page>
</template>

<script lang="ts" setup>
import { RefresherCustomEvent } from '@ionic/vue';
import { eyeOffOutline, listOutline, starOutline } from 'ionicons/icons';
import { storeToRefs } from 'pinia';

import FeedItemList from '@/components/FeedItemList.vue';
import { useFeed } from '@/composables';
import { FeedItemFilter } from '@/enums';
import { useFeedStore } from '@/store';

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

const { feed } = useFeed(feedId);

onBeforeUnmount(() => {
  console.log('unmount');
});

const handleRefresh = (event: RefresherCustomEvent) => {
  setTimeout(() => {
    event.target?.complete();
  }, 1500);
};
</script>
