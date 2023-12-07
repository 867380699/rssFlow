<template>
  <RecycleList ref="scroller" :items="recycleItems">
    <!-- Feed -->
    <template #feed="slotPorps">
      <div
        class="flex h-6 items-center pl-1.5"
        style="background-color: var(--ion-item-background, #fff)"
      >
        <div class="mr-2 h-4 w-4 overflow-hidden rounded-full">
          <LazyImage
            :src="feedsMap && feedsMap[slotPorps.data.feedId].imageUrl"
          />
        </div>

        <span class="text-sm">
          {{ feedsMap && feedsMap[slotPorps.data.feedId].title }}
        </span>
      </div>
    </template>
    <!-- Date -->
    <template #date="slotPorps">
      <div
        class="flex h-6 items-center pl-1.5 text-sm"
        style="background-color: var(--ion-item-background, #fff)"
      >
        {{ formatRelative(slotPorps.data.pubDate || 0, now) }}
      </div>
    </template>
    <!-- FeedItem -->
    <template #feedItem="slotPorps">
      <FeedItem
        v-intersection-observer="[
          (entrys) => onElementVisibility(entrys, slotPorps.data),
          {
            root: scroller as MaybeElement,
            threshold: 1,
            rootMargin: '0px 0px -40px 0px',
            immediate: true,
          },
        ]"
        :item="slotPorps.data"
        @item-changed="onItemChanged"
      />
    </template>
  </RecycleList>
</template>
<script lang="ts" setup>
import { vIntersectionObserver } from '@vueuse/components';
import { MaybeElement } from '@vueuse/core';
import { ComponentExposed } from 'vue-component-type-helpers';

import { useAllFeeds, useFeed } from '@/composables';
import { formatRelative } from '@/composables/date';
import { Feed, FeedItem as FeedItemType } from '@/types';

import LazyImage from './LazyImage.vue';
import RecycleList, { RecycleItem } from './RecycleTreeList.vue';

const props = withDefaults(
  defineProps<{
    feedId?: number;
    items?: FeedItemType[];
  }>(),
  { feedId: 0, items: () => [] }
);

const emit = defineEmits<{
  (event: 'itemVisible', item: FeedItemType): void;
}>();

const { feed } = useFeed(toRef(props, 'feedId'));

const { feeds } = useAllFeeds();

const feedsMap = computed(() => {
  return feeds.value?.reduce((o, feed) => {
    if (feed.id !== undefined) {
      o[feed.id] = feed;
    }
    return o;
  }, {} as Record<number, Feed>);
});

const now = Date.now();

const recycleItems = computed<RecycleItem<FeedItemType>[]>(() => {
  const resultItems: RecycleItem<FeedItemType>[] = [];
  let feedId: number | undefined;
  let pubdate = 0;
  props.items.forEach((item, i) => {
    const isSameFormatTime =
      formatRelative(pubdate, now) === formatRelative(item.pubDate || 0, now);
    if (!isSameFormatTime || i === 0) {
      resultItems.push({
        height: 24,
        slot: 'date',
        data: item,
        children: [],
      });
    }
    const prevDate = resultItems[resultItems.length - 1];

    if (prevDate.children) {
      if (feed.value?.type === 'feed') {
        prevDate.children.push({
          height: 80,
          slot: 'feedItem',
          data: item,
        });
      } else {
        // all and group
        if (item.feedId !== feedId || !prevDate.children.length) {
          prevDate.children.push({
            height: 24,
            slot: 'feed',
            data: item,
            children: [],
          });
        }
        const prevFeed = prevDate.children[prevDate.children.length - 1];

        if (prevFeed.children) {
          prevFeed.children.push({
            height: 80,
            slot: 'feedItem',
            data: item,
          });
        }
      }

      feedId = item.feedId;
      pubdate = item.pubDate || 0;
    }
  });
  return resultItems;
});

const scroller = ref<ComponentExposed<typeof RecycleList<FeedItemType>> | null>(null);

watch(
  () => props.feedId,
  () => {
    scroller.value?.scrollTo({ top: 0 });
  }
);

const visibleItemIdSet = new Set();

const onElementVisibility = (
  entries: IntersectionObserverEntry[],
  item: FeedItemType
) => {
  if (entries[0].isIntersecting) {
    // console.log('visibleL itemAdd', item.id, item.title);
    visibleItemIdSet.add(item.id);
    emit('itemVisible', item);
  } else {
    // console.log('visibleL itemRemove', item.id, item.title);
    visibleItemIdSet.delete(item.id);
  }
};

const idsToDelete: FeedItemType['id'][] = [];
const idsToAdd: FeedItemType['id'][] = [];

const onItemChanged = (item: FeedItemType, oldItem?: FeedItemType) => {
  if (oldItem) {
    if (visibleItemIdSet.has(oldItem.id)) {
      idsToAdd.push(item.id);
      idsToDelete.push(item.id);
      emit('itemVisible', item);
    }
  }
};

onUpdated(() => {
  if (idsToDelete.length) {
    idsToDelete.forEach((id) => {
      visibleItemIdSet.delete(id);
    });
    idsToDelete.length = 0;
  }
  if (idsToAdd.length) {
    idsToAdd.forEach((id) => {
      visibleItemIdSet.add(id);
    });
    idsToAdd.length = 0;
  }
});

const scrollItemIntoView = (id?:number) => {
  if (scroller.value) {
    scroller.value.scrollItemIntoView((item) => (item.id === id));
  }
};

defineExpose({scrollItemIntoView, scrollTo: scroller.value?.scrollTo})
</script>
<style>
.feed-item {
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
