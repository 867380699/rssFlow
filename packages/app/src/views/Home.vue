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
        ref="content"
        :feed-id="feedId"
        :items="feedItems"
        class="ion-content-scroll-host"
      />
      <!-- Read All Fab -->
      <Transition name="fab">
        <ion-fab
          v-show="isFabShow"
          slot="fixed"
          vertical="bottom"
          horizontal="end"
        >
          <ion-fab-button v-show="!canUndoReadAll" @click="readAll">
            <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
          </ion-fab-button>
          <ion-fab-button v-show="canUndoReadAll" @click="unreadAll">
            <ion-icon :icon="returnUpBackOutline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </Transition>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <ion-segment
          class="flex-1"
          :value="feedItemFilter"
          @ion-change="segmentChanged($event)"
        >
          <ion-segment-button
            v-for="tab in tabs"
            :key="tab.key"
            :value="tab.key"
          >
            <ion-label>{{ tab.label }}</ion-label>
            <ion-icon :icon="tab.icon"></ion-icon>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  InfiniteScrollCustomEvent,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
} from '@ionic/vue';
import {
  checkmarkDoneOutline,
  eyeOffOutline,
  listOutline,
  returnUpBackOutline,
  starOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { fromEvent, map, pairwise, share, throttleTime } from 'rxjs';
import { ComponentPublicInstance } from 'vue';

import FeedItemList from '@/components/FeedItemList.vue';
import { useFeed, useLiveFeedItemsById } from '@/composables';
import { FeedItemFilter } from '@/enums';
import { readFeedItems } from '@/service/dbService';
import { useFeedStore } from '@/store';

const { t } = useI18n();

const ionRouter = useRouter();

const feedStore = useFeedStore();

const { feedId, feedItemFilter, feedItemIds } = storeToRefs(feedStore);

const feedItemsCount = ref(20);

watch(feedId, () => {
  feedItemsCount.value = 20;
});

const shownFeedItemsIds = computed(() => {
  return feedItemIds.value.slice(0, feedItemsCount.value);
});

const { feedItems } = useLiveFeedItemsById(shownFeedItemsIds);

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

const canUndoReadAll = ref(false);

let undoReadAllFn: () => void;

let undoReadAllTimeout: ReturnType<typeof setTimeout>;

const readAll = async () => {
  const ids: number[] = feedItems.value?.map((f) => f.id) as number[];
  if (ids.length) {
    undoReadAllFn = await readFeedItems(ids);
    canUndoReadAll.value = true;
    undoReadAllTimeout = setTimeout(() => {
      canUndoReadAll.value = false;
    }, 3000);
  }
};

const unreadAll = () => {
  if (undoReadAllFn) {
    canUndoReadAll.value = false;
    clearTimeout(undoReadAllTimeout);
    undoReadAllFn();
  }
};

const isFabShow = ref(true);

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

onMounted(() => {
  const scroll$ = fromEvent<Event>(content.value?.$el, 'scroll').pipe(share());

  scroll$
    .pipe(
      throttleTime(60),
      map((e) => (e.target as HTMLElement).scrollTop),
      pairwise(),
      map(([prevScrollTop, scrollTop]) => scrollTop - prevScrollTop)
    )
    .subscribe((deltaScrollTop) => {
      if (deltaScrollTop > 60) {
        // scroll down
        isFabShow.value = false;
      } else if (deltaScrollTop < -60) {
        // scroll up
        isFabShow.value = true;
      }
    });

  scroll$
    .pipe(
      throttleTime(30),
      map((e) => {
        const { scrollTop, scrollHeight, clientHeight } =
          e.target as HTMLElement;
        return { scrollTop, scrollHeight, clientHeight };
      })
    )
    .subscribe(({ scrollTop, scrollHeight, clientHeight }) => {
      if (scrollTop + clientHeight > scrollHeight - 96 * 3) {
        feedItemsCount.value = Math.min(
          feedItemsCount.value + 20,
          feedItemIds.value.length
        );
      }
    });
});
</script>
