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
import { useAllFeedItems } from '@/composables';
import { feedDB } from '@/service/dbService';
import { Feed } from '@/types';

const { t } = useI18n();

const route = useRoute();

const ionRouter = useRouter();

const type = ref('unread');
const id = ref(0);

watchEffect(() => {
  if (route.name === 'home') {
    type.value = (route.query.type as string) || 'unread';
    id.value = Number(route.query.id) || 0;
  }
});

const tabs = [
  { key: 'unread', label: t('unread'), icon: eyeOffOutline },
  { key: 'all', label: t('all'), icon: listOutline },
  { key: 'favorite', label: t('favorite'), icon: starOutline },
];

const segmentChanged = async ($event: CustomEvent) => {
  ionRouter.replace(`/home?type=${$event.detail.value}&id=${id.value}`);
};

const feed = ref<Feed>();

watchEffect(async () => {
  feed.value = await feedDB.feeds.get(id.value);
});

let { feedItems: allFeedItems } = useAllFeedItems();

let feedItems = computed(() => {
  if (allFeedItems.value) {
    return allFeedItems.value
      .filter((item) => {
        if (id.value && item.feedId !== id.value) return false;
        switch (type.value) {
          case 'unread':
            return !item.isRead;
          case 'favorite':
            return item.isFavorite;
          default:
            return true;
        }
      })
      .map((item) => ({
        ...item,
        image: item.image && `/img/${item.image}`,
      }));
  } else {
    return [];
  }
});

onBeforeUnmount(() => {
  console.log('unmount');
});
</script>
