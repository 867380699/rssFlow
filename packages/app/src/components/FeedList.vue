<template>
  <div
    ref="listRef"
    :data-parent-id="feedIdTree.id"
    :class="{
      'space-y-4 py-2': reorderToggle,
      'px-2': reorderToggle && !feedIdTree.id,
      'pb-0 pt-4': reorderToggle && feedIdTree.id,
    }"
  >
    <template
      v-for="childFeedTree in feedIdTree.children"
      :key="childFeedTree.id"
    >
      <div
        v-if="feedsMap?.[childFeedTree.id].type === 'feed'"
        :key="childFeedTree.id"
        :data-id="childFeedTree.id"
        class="flex items-center border-0 border-dashed border-transparent"
        :class="{ 'h-12 p-2': !reorderToggle, 'h-8': reorderToggle }"
        @click="selectItem(childFeedTree.id)"
        @contextmenu.prevent="(e: any) => showContextMenu(e, feedsMap?.[childFeedTree.id]!)"
      >
        <div class="flex-1 cursor-pointer truncate">
          {{ feedsMap?.[childFeedTree.id].title }}
        </div>
        <i-ion-reorder-three
          v-if="reorderToggle"
          class="reorder-icon cursor-move text-lg"
        />
        <ion-badge v-show="!reorderToggle">
          {{ itemCounts?.[childFeedTree.id || 0] || 0 }}
        </ion-badge>
      </div>
      <div
        v-if="feedsMap?.[childFeedTree.id].type === 'group'"
        :id="`aside-item-${childFeedTree.id}`"
        :data-id="childFeedTree.id"
      >
        <accordion>
          <template #header="{ isExpand }">
            <div
              class="flex items-center"
              :class="{
                'h-12 py-2 pr-2': !reorderToggle,
                '-ml-2 h-8': reorderToggle,
              }"
            >
              <div class="p-2">
                <i-ion-chevron-down-outline
                  class="transition"
                  :class="{ '-rotate-90': !isExpand }"
                />
              </div>

              <div
                class="flex-1 cursor-pointer transition-all"
                @contextmenu.prevent="(e: any) => showContextMenu(e, feedsMap?.[childFeedTree.id]!)"
                @click.prevent.stop="selectItem(childFeedTree.id)"
              >
                {{ feedsMap?.[childFeedTree.id].title }}
              </div>
              <i-ion-reorder-three
                v-if="reorderToggle"
                class="reorder-icon cursor-move text-lg transition-all"
              />
              <ion-badge v-show="!reorderToggle">
                {{ itemCounts?.[childFeedTree.id || 0] || 0 }}
              </ion-badge>
            </div>
          </template>
          <template #content>
            <div class="pl-6">
              <feed-list
                :feed-id-tree="childFeedTree"
                :reorder-toggle="reorderToggle"
                @item-selected="(id) => emit('itemSelected', id)"
              />
            </div>
          </template>
        </accordion>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { popoverController } from '@ionic/vue';
import { storeToRefs } from 'pinia';
import Sortable from 'sortablejs';

import type { FeedIdTree } from '@/composables';
import router from '@/router';
import { moveFeed } from '@/service/dbService';
import { useFeedStore } from '@/store';
import { Feed } from '@/types';

import Accordion from './Accordion.vue';
import FeedList from './FeedList.vue';
import AsideItemModal from './modals/AsideItemModal.vue';

const props = defineProps<{ feedIdTree: FeedIdTree; reorderToggle: boolean }>();
const emit = defineEmits(['itemSelected']);

const feedStore = useFeedStore();
const { feedItemCounts: itemCounts, feedsMap } = storeToRefs(feedStore);

const listRef = useTemplateRef<HTMLElement>('listRef');

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
  if (props.reorderToggle) {
    return;
  }
  setFeedId(id || 0);
  emit('itemSelected', id);
  router.replace({
    name: 'home',
    query: { ...router.currentRoute.value.query, id },
  });
};

const showContextMenu = async (event: Event, feed: Feed) => {
  if (props.reorderToggle) {
    return;
  }
  const popover = await popoverController.create({
    component: AsideItemModal,
    componentProps: { feed },
    event,
  });
  await popover.present();
};
</script>
