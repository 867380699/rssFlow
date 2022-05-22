<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-menu-button slot="start" />
        <ion-title>{{ feed?.title || 'All' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="main-content" class="ion-padding">
      <FeedItemList :items="feedItems" />
    </ion-content>
    <ion-segment :value="type" @ion-change="segmentChanged($event)">
      <ion-segment-button v-for="tab in tabs" :key="tab.key" :value="tab.key">
        <ion-label>{{ tab.label }}</ion-label>
        <ion-icon :icon="tab.icon"></ion-icon>
      </ion-segment-button>
    </ion-segment>
  </ion-page>
</template>

<script lang="ts" setup>
import { eyeOffOutline, listOutline, starOutline } from 'ionicons/icons';

import FeedItemList from '@/components/FeedItemList.vue';
import { useFeedItems } from '@/composables';
import router from '@/router';
import { feedDB } from '@/service/dbService';
import { Feed, FeedItem } from '@/types';

const { t } = useI18n();

const route = useRoute();

const type = ref('unread');
const id = ref(0);

watchEffect(() => {
  if (route.name === 'home') {
    type.value = (route.params.type as string) || 'unread';
    id.value = Number(route.params.id) || 0;
  }
});

const tabs = [
  { key: 'unread', label: t('unread'), icon: eyeOffOutline },
  { key: 'all', label: t('all'), icon: listOutline },
  { key: 'favorite', label: t('favorite'), icon: starOutline },
];

const segmentChanged = async ($event: CustomEvent) => {
  await router.replace(`/home/${$event.detail.value}/${id.value}`);
};

const feed = ref<Feed>();

watchEffect(async () => {
  feed.value = await feedDB.feeds.get(id.value);
});

let feedItems = ref<FeedItem[] | undefined>([]);

watchEffect(() => {
  switch (type.value) {
    case 'unread':
      let { feedItems: unreadItems } = useFeedItems(id.value, true);
      feedItems = unreadItems;
      break;
    case 'all':
      let { feedItems: allItems } = useFeedItems(id.value);
      feedItems = allItems;
      break;
    case 'favorite':
      let { feedItems: favoriteItems } = useFeedItems(id.value, false, true);
      feedItems = favoriteItems;
      break;
  }
});
</script>
