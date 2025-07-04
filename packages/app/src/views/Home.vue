<template>
  <ion-page>
    <ion-header class="transition-all" :class="{ '-mt-14': !isFabShow }">
      <ion-toolbar class="" :class="{ 'opacity-0': !isFabShow }">
        <ion-buttons slot="start" class="pl-1">
          <ion-thumbnail
            class="shrink-0"
            style="--size: 32px"
            @click="() => toggleMenu()"
          >
            <LazyImage
              class="overflow-hidden !rounded-full"
              :src="feed?.imageUrl"
              min-height="32"
            >
              <template v-if="feed?.title" #error-icon>
                <div class="uppercase">
                  {{ feed.title.slice(0, 1) }}
                </div>
              </template>
            </LazyImage>
          </ion-thumbnail>
        </ion-buttons>
        <div class="ml-1 flex items-center">
          <div class="line-clamp-2">
            {{ feed?.title || 'All' }}
          </div>
          <div
            v-show="!!newItemsCount"
            class="ml-2 flex items-center space-x-1 rounded-full bg-primary px-2 py-1"
            @click="resetHomeFeedItems"
          >
            <span class="text-xs leading-none">{{ newItemsCount }}</span>
            <ion-icon class="text-xs leading-none" :icon="sparklesOutline" />
          </div>
        </div>
        <ion-buttons slot="end">
          <ion-buttons class="bg-ion-toolbar-background">
            <ion-button
              v-for="tab in tabs"
              :key="tab.key"
              :value="tab.key"
              class="transition-all"
              :class="{
                'max-w-0': !isTabActive,
                '!m-0': true,
                'text-primary': feedItemFilter === tab.key,
                'max-w-20': isTabActive || feedItemFilter === tab.key,
              }"
              @click="() => selectTab(tab)"
            >
              <ion-icon class="text-2xl" :icon="tab.icon"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-button
            v-bind="{ color: isHomeFeedItemsDesc ? 'medium' : 'primary' }"
            @click="toggleDesc"
          >
            <ion-icon slot="icon-only" :icon="swapVerticalOutline" />
          </ion-button>
        </ion-buttons>
        <progress-bar
          class="absolute inset-x-0 bottom-0"
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
        class="ion-content-scroll-host pb-2 after:flex after:items-center after:justify-center after:opacity-50 after:content-['~']"
        :class="{
          'after:h-full': !homeFeedItems?.length,
          'after:h-16': homeFeedItems?.length,
        }"
        style="background-color: var(--ion-item-background)"
        @item-visible="onItemVisible"
      />
      <!-- Read All Fab -->
      <Transition name="fab">
        <ion-fab
          v-show="isFabShow"
          slot="fixed"
          vertical="bottom"
          horizontal="end"
        >
          <ion-fab-button ref="fab">
            <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </Transition>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  type IonRefresher,
  type RefresherCustomEvent,
  createGesture,
  menuController,
} from '@ionic/vue';
import {
  checkmarkDoneOutline,
  eyeOffOutline,
  listOutline,
  sparklesOutline,
  starOutline,
  swapVerticalOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import {
  animationFrameScheduler,
  debounceTime,
  fromEvent,
  map,
  mergeWith,
  observeOn,
  pairwise,
  share,
  tap,
  throttleTime,
} from 'rxjs';
import { ComponentPublicInstance } from 'vue';
import { ComponentExposed } from 'vue-component-type-helpers';

import FeedItemList from '@/components/FeedItemList.vue';
import { useFeed } from '@/composables';
import { FeedItemFilter } from '@/enums';
import { readFeedItems } from '@/service/dbService';
import { fetchFeed } from '@/service/feedService';
import { useFeedStore } from '@/store';
import { FeedItem } from '@/types';

const { t } = useI18n();

const ionRouter = useRouter();

const feedStore = useFeedStore();

const {
  feedId,
  feedItemFilter,
  homeLoading,
  homeNextPage,
  homePrevPage,
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

const isTabActive = ref(false);

const selectTab = async (tab: { key: FeedItemFilter; label: string }) => {
  if (!isTabActive.value) {
    isTabActive.value = true;
    return;
  }
  feedItemFilter.value = tab.key;
  ionRouter.replace(`/home?type=${tab.key}&id=${feedId.value}`);
  isTabActive.value = false;
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

const visibleItemIdSet = new Set<number>();

watch([feedId, isHomeFeedItemsDesc, feedItemFilter], () => {
  console.log('visible reset');
  visibleItemIdSet.clear();
});

const onItemVisible = (item: FeedItem) => {
  // console.log('item visible:', item.id, item.title);
  if (item.id) {
    visibleItemIdSet.add(item.id);
  }
};

let undoReadAllFn: (() => void) | null;

const readAll = async () => {
  console.log('read all');
  const ids: number[] = [...visibleItemIdSet];
  if (ids.length) {
    visibleItemIdSet.clear();
    undoReadAllFn = await readFeedItems(ids);
  }
  if (homeFeedItems.value?.length || 0 < 20) {
    if (homeNextPage.value) {
      homeNextPage.value();
    }
  }
  if (feedItemFilter.value === FeedItemFilter.UNREAD) {
    setTimeout(() => {
      const nextUnreadItem = homeFeedItems.value?.find((item) => !item.isRead);
      if (nextUnreadItem) {
        content.value?.scrollItemIntoView(nextUnreadItem.id, 'instant');
      }
    });
  } else {
    (content.value?.$el as HTMLElement).scrollTo({
      top: 0,
      behavior: 'instant',
    });
  }
};

const undoReadAll = async () => {
  console.log('undo read all');
  if (undoReadAllFn) {
    visibleItemIdSet.clear();
    undoReadAllFn();
    undoReadAllFn = null;
  }
};

const fab = ref<ComponentPublicInstance | null>(null);

onMounted(() => {
  let fabLongPressTimeout: ReturnType<typeof setTimeout>;
  let isUndo = false;
  if (fab.value?.$el) {
    const fabGesture = createGesture({
      el: fab.value.$el,
      gestureName: 'fab',
      threshold: 0,
      onStart: () => {
        isUndo = false;
        fabLongPressTimeout = setTimeout(() => {
          undoReadAll();
          isUndo = true;
        }, 500);
      },
      onEnd: () => {
        clearTimeout(fabLongPressTimeout);
        if (!isUndo) {
          readAll();
        }
      },
    });
    fabGesture.enable();
  }
});

const toggleDesc = () => {
  isHomeFeedItemsDesc.value = !isHomeFeedItemsDesc.value;
  (content.value?.$el as HTMLElement).scrollTop = 0;
};

const isFabShow = ref(true);

const content = ref<ComponentExposed<typeof FeedItemList> | null>(null);

onMounted(() => {
  const throttleInterval = 32;

  const scrollShare$ = fromEvent<Event>(content.value?.$el, 'scroll', {
    passive: true,
  }).pipe(share());

  const scrollEnd$ = scrollShare$.pipe(debounceTime(throttleInterval * 2));

  const scroll$ = scrollShare$.pipe(mergeWith(scrollEnd$), share());

  const nextDone = ref(false);

  scroll$
    .pipe(
      throttleTime(throttleInterval),
      observeOn(animationFrameScheduler),
      // tap((e) => console.log(e.type)),
      map((e) => {
        const el = e.target as HTMLElement;
        const { clientHeight, scrollHeight, scrollTop } = el;
        return {
          clientHeight,
          scrollHeight,
          scrollTop,
        };
      }),
      pairwise()
    )
    .subscribe(
      ([
        { scrollTop: prevScrollTop },
        { clientHeight, scrollHeight, scrollTop },
      ]) => {
        // loading next
        const shouldLoadingNext =
          scrollTop + clientHeight > scrollHeight - 80 * 6;
        if (shouldLoadingNext && !homeLoading.value) {
          if (homeNextPage.value) {
            homeNextPage.value().then((result) => {
              nextDone.value = result.done; // TODO: fixme
            });
          }
        }

        // show/hide fab
        const isReachEnd = clientHeight + scrollTop + 1 > scrollHeight;

        if (isReachEnd && nextDone.value) {
          isFabShow.value = true;
        } else {
          const deltaThreshold = 40;
          const deltaScrollTop = scrollTop - prevScrollTop;
          if (deltaScrollTop > deltaThreshold) {
            // scroll down
            isFabShow.value = false;
          } else if (deltaScrollTop < -deltaThreshold) {
            // scroll up
            isFabShow.value = true;
          }
        }
      }
    );
});

const route = useRoute();
const initDetailId = ref(0);

watch(
  () => [route.path, route.query],
  ([path, query], [prevPath, prevQuery]) => {
    console.log('vr', path, query, prevPath, prevQuery);
    if (path === '/detail' && prevPath === '/home') {
      initDetailId.value = parseInt(query.id);
    } else if (path === '/home' && prevPath === '/detail') {
      const id = parseInt(prevQuery.id);
      if (id && id !== initDetailId.value) {
        setTimeout(() => {
          content.value?.scrollItemIntoView(id);
        }, 500);
      }
    }
  }
);

const toggleMenu = () => {
  menuController.toggle();
};
</script>
<style>
.ion-content-scroll-host::-webkit-scrollbar {
  display: none;
}
</style>
