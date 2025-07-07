<template>
  <RecycleList ref="scroller" :items="recycleItems">
    <!-- Feed -->
    <template #feed="slotPorps">
      <div
        class="flex h-6 items-center pl-1.5"
        style="background-color: var(--ion-item-background, #fff)"
      >
        <div class="mr-2 size-4 overflow-hidden rounded-full">
          <LazyImage
            :src="feedsMap && feedsMap[slotPorps.data.feedId].imageUrl"
          />
        </div>

        <span class="line-clamp-1 text-sm">
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
      <FeedItem :item="slotPorps.data" />
    </template>
  </RecycleList>
</template>
<script lang="ts" setup>
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

const scrollItemIntoView = (id?:number, scrollBehavior?: ScrollBehavior) => {
  if (scroller.value) {
    scroller.value.scrollItemIntoView((item) => (item.id === id), scrollBehavior);
  }
};

const scrollTo = (scrollOption: ScrollToOptions) => {
  if (scroller.value) {
    scroller.value.scrollTo(scrollOption);
  }
};

const getVisualItems = (
  topOffst: (h: number) => number = () => 0,
  bottomOffst: (h: number) => number = (h) => h
) => {
  if (scroller.value) {
    return scroller.value.getVisualItems(topOffst, bottomOffst);
  }
}

defineExpose({scrollItemIntoView, scrollTo, getVisualItems})
</script>
<style>
.feed-item {
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
