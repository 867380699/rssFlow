<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <div class="flex items-center ml-1">
          <ion-thumbnail
            class="rounded-full overflow-hidden"
            style="--size: 32px"
          >
            <LazyImage :src="feed?.imageUrl" min-height="32" />
          </ion-thumbnail>
          {{ feed?.title || 'All' }}
        </div>
        <ion-buttons slot="end">
          <ion-button v-show="!!newItemsCount" @click="resetHomeFeedItems">
            <ion-icon slot="icon-only" :icon="sparklesOutline" />
            <span
              class="p-0.5 absolute bottom-[-4px] right-[-8px] text-[10px] leading-none"
              >{{ Math.min(newItemsCount || 0, 99) }}</span
            >
          </ion-button>

          <ion-button
            v-bind="{ color: isHomeFeedItemsDesc ? 'medium' : 'primary' }"
            @click="toggleDesc"
          >
            <ion-icon slot="icon-only" :icon="swapVerticalOutline" />
          </ion-button>
        </ion-buttons>
        <progress-bar
          class="absolute bottom-0 left-0 right-0"
          :progress="pullProgress"
          :loading="pullLoading"
        ></progress-bar>
      </ion-toolbar>
    </ion-header>
    <ion-content id="main-content" class="ion-padding" :scroll-y="false">
      <ion-refresher
        slot="fixed"
        mode="md"
        :pull-max="120"
        :pull-min="3"
        :disabled="pullLoading"
        @ion-pull="onRefresherPull"
        @ion-refresh="handleRefresh($event)"
      >
        <ion-refresher-content
          :pulling-icon="null"
          :refreshing-spinner="null"
        />
      </ion-refresher>

      <FeedItemList
        ref="content"
        :feed-id="feedId"
        :items="homeFeedItems"
        class="ion-content-scroll-host"
        style="background-color: var(--ion-item-background)"
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
        <progress-bar
          v-if="false"
          class="absolute top-0 left-0 right-0"
          :progress="homeLoading ? 1 : 0"
          :loading="homeLoading"
        ></progress-bar>
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
            <ion-label>{{ '' }}</ion-label>
            <ion-icon :icon="tab.icon"></ion-icon>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts" setup>
import {
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
  IonToolbar,
  RefresherCustomEvent,
} from '@ionic/vue';
import {
  checkmarkDoneOutline,
  eyeOffOutline,
  listOutline,
  returnUpBackOutline,
  sparklesOutline,
  starOutline,
  swapVerticalOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { fromEvent, map, mergeWith, pairwise, share, throttleTime } from 'rxjs';
import { ComponentPublicInstance } from 'vue';

import FeedItemList from '@/components/FeedItemList.vue';
import { useFeed } from '@/composables';
import { FeedItemFilter } from '@/enums';
import { readFeedItems } from '@/service/dbService';
import { fetchFeed } from '@/service/feedService';
import { useFeedStore } from '@/store';

const { t } = useI18n();

const ionRouter = useRouter();

const feedStore = useFeedStore();

const {
  feedId,
  feedItemFilter,
  homeLoading,
  homeNextPage,
  homeFeedItems,
  isHomeFeedItemsDesc,
  loadingFeedIds,
  newItemsCount,
} = storeToRefs(feedStore);

const resetHomeFeedItems = feedStore.resetHomeFeedItems;

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

const pullProgress = ref(0);
const pullLoading = ref(false);

watch(
  () => loadingFeedIds.value.has(feedId.value),
  (isLoading) => {
    if (isLoading) {
      pullLoading.value = true;
      pullProgress.value = 1;
    } else {
      pullLoading.value = false;
      pullProgress.value = 0;
    }
  }
);

const onRefresherPull = (event: CustomEvent) => {
  const refresher = event.target as unknown as typeof IonRefresher;
  const { progress, pullMin, pullMax } = refresher;
  pullProgress.value = progress / (pullMax / pullMin);
};

const handleRefresh = (event: RefresherCustomEvent) => {
  const refresher = event.target as unknown as typeof IonRefresher;
  const { progress, pullMin, pullMax } = refresher;
  const realProgress = progress / (pullMax / pullMin);
  console.log('refresh', realProgress);
  event.target?.complete();

  if (realProgress > 1) {
    // pullLoading.value = true;

    if (feed.value && feed.value.type === 'feed') {
      fetchFeed(feed.value);
    } else {
      pullProgress.value = 0;
    }
  } else {
    pullProgress.value = 0;
  }
};

const canUndoReadAll = ref(false);

let undoReadAllFn: () => void;

let undoReadAllTimeout: ReturnType<typeof setTimeout>;

const readAll = async () => {
  const ids: number[] = homeFeedItems.value?.map((f) => f.id) as number[];
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

const toggleDesc = () => {
  isHomeFeedItemsDesc.value = !isHomeFeedItemsDesc.value;
  (content.value?.$el as HTMLElement).scrollTop = 0;
};

const isFabShow = ref(true);

const content = ref<ComponentPublicInstance<HTMLElement> | null>(null);

onMounted(() => {
  const scrollEnd$ = fromEvent<Event>(content.value?.$el, 'scrollend');

  const scroll$ = fromEvent<Event>(content.value?.$el, 'scroll').pipe(
    mergeWith(scrollEnd$),
    share()
  );

  scroll$
    .pipe(
      throttleTime(60),
      // tap((e) => console.log(e.type)),
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
      if (scrollTop + clientHeight > scrollHeight - 80 * 6) {
        if (homeLoading.value) return;
        if (homeNextPage.value) {
          homeNextPage.value();
        }
      }
    });
});
</script>
