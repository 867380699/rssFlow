<template>
  <div ref="listRef" class="pb-1" :data-parent-id="parentId">
    <template v-for="feed in feeds" :key="feed.id">
      <div
        v-if="feed.type === 'feed'"
        :key="feed.id"
        :data-id="feed.id"
        class="flex items-center py-2 pr-2 h-12"
        :class="{ 'pl-2': !reorderToggle }"
        @click="selectItem(feed.id)"
        @contextmenu.prevent="(e: any) => showContextMenu(e, feed)"
      >
        <ion-icon
          v-if="reorderToggle"
          :icon="reorderThree"
          class="p-2 text-lg reorder-icon cursor-move"
        />
        <div
          class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
        >
          {{ feed.title }}
        </div>

        <ion-badge>
          {{ itemCounts && itemCounts[feed.id || 0] }}
        </ion-badge>
      </div>
      <div
        v-if="feed.type === 'group'"
        :id="`aside-item-${feed.id}`"
        :data-id="feed.id"
      >
        <accordion>
          <template #header="{ isExpand }">
            <div class="flex items-center py-2 pr-2 h-12">
              <ion-icon
                v-if="reorderToggle"
                :icon="reorderThree"
                class="p-2 text-lg reorder-icon cursor-move"
              />
              <ion-icon
                v-else
                :icon="chevronDownOutline"
                class="p-2 text-lg transition"
                :class="{ '-rotate-90': !isExpand }"
              />
              <div
                class="flex-1 cursor-pointer"
                @contextmenu.prevent="(e: any) => showContextMenu(e, feed)"
              >
                {{ feed.title }}
              </div>
              <ion-badge>
                {{ itemCounts && itemCounts[feed.id || 0] }}
              </ion-badge>
            </div>
          </template>
          <template #content>
            <div class="pl-6">
              <feed-list
                :parent-id="feed.id || 0"
                :reorder-toggle="reorderToggle"
              />
            </div>
          </template>
        </accordion>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { IonBadge, IonIcon, popoverController } from '@ionic/vue';
import { chevronDownOutline, reorderThree } from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import Sortable from 'sortablejs';

import { useChildFeeds } from '@/composables';
import router from '@/router';
import { moveFeed } from '@/service/dbService';
import { useFeedStore } from '@/store';
import { Feed } from '@/types';

import Accordion from './Accordion.vue';
import FeedList from './FeedList.vue';
import AsideItemModal from './modals/AsideItemModal.vue';

const props = defineProps<{ parentId: number; reorderToggle: boolean }>();
const emit = defineEmits(['itemSelected']);

const { feeds } = useChildFeeds(props.parentId);

const feedStore = useFeedStore();
const { feedItemCounts: itemCounts } = storeToRefs(feedStore);

const listRef = ref<HTMLElement | null>(null);

onMounted(() => {
  if (listRef.value) {
    const onUpdate = (event: Sortable.SortableEvent) => {
      const { item, to, newIndex = 0 } = event;
      const feedId = Number(item.dataset.id);
      const parentId = Number(to.dataset.parentId);
      moveFeed({ feedId, parentId, newIndex });
    };
    Sortable.create(listRef.value, {
      group: 'feed-list',
      handle: '.reorder-icon',
      animation: 150,
      forceFallback: false,

      onUpdate,
      onAdd: (event) => {
        onUpdate(event);
        event.item.remove();
      },
      onMove: (event) => {
        if (event.to.dataset.parentId !== '0' && !event.dragged.dataset.id) {
          return false;
        }
      },
    });
  }
});

const { setFeedId } = useFeedStore();

const selectItem = (id?: number) => {
  setFeedId(id || 0);
  emit('itemSelected', id);
  router.replace({
    name: 'home',
    query: { ...router.currentRoute.value.query, id },
  });
};

const showContextMenu = async (event: Event, feed: Feed) => {
  const popover = await popoverController.create({
    component: AsideItemModal,
    componentProps: { feed },
    event,
  });
  await popover.present();
};
</script>
