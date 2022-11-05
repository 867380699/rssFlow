<template>
  <div ref="listRef" class="pb-1" :data-parent-id="parentId">
    <template v-for="feed in feeds" :key="feed.id">
      <div
        v-if="feed.type === 'feed'"
        :key="feed.id"
        :data-id="feed.id"
        class="flex items-center p-2 h-12"
        @click="selectItem(feed.id)"
        @contextmenu.prevent="(e: any) => showContextMenu(e, feed)"
      >
        <ion-icon
          v-if="reorderToggle"
          :icon="reorderThree"
          class="pr-2 py-2 ml-1 text-lg reorder-icon cursor-move"
        />
        <div class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {{ feed.title }}
        </div>

        <ion-badge slot="end">
          {{ itemCounts && itemCounts[feed.id || 0] }}
        </ion-badge>
      </div>
      <div v-if="feed.type === 'group'" :id="`aside-item-${feed.id}`">
        <div class="flex items-center p-2 h-12">
          <ion-icon
            v-if="reorderToggle"
            :icon="reorderThree"
            class="pr-2 py-2 ml-1 text-lg reorder-icon cursor-move"
          />
          <ion-icon
            v-else
            :icon="chevronDownOutline"
            class="pr-2 py-2 ml-1 text-lg"
          />
          {{ feed.title }}
        </div>
        <div class="pl-6">
          <feed-list
            :parent-id="feed.id || 0"
            :reorder-toggle="reorderToggle"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { IonBadge, IonIcon, popoverController } from '@ionic/vue';
import { chevronDownOutline, reorderThree } from 'ionicons/icons';
import Sortable from 'sortablejs';

import { useChildFeeds, useFeedItemCounts } from '@/composables';
import router from '@/router';
import { moveFeed } from '@/service/dbService';
import { useFeedStore } from '@/store';
import { Feed } from '@/types';

import FeedList from './FeedList.vue';
import AsideItemModal from './modals/AsideItemModal.vue';

const props = defineProps<{ parentId: number; reorderToggle: boolean }>();
const emit = defineEmits(['itemSelected']);

const { feeds } = useChildFeeds(props.parentId);

const { counts: itemCounts } = useFeedItemCounts();

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
