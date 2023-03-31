<template>
  <div ref="container" class="overflow-auto h-full relative scroll-smooth">
    <div :style="{ minHeight: totalHeight }">
      <template v-for="({ itemIndex }, id) in pool" :key="id">
        <div
          v-if="flatItems[itemIndex]"
          ref="itemsRef"
          class="absolute w-full"
          :class="{
            'overflow-hidden': !flatItems[itemIndex].value.childrenHeight,
          }"
          :style="{
            top: `${flatItems[itemIndex].value.top}px`,
            height: `${
              flatItems[itemIndex].value.height +
              flatItems[itemIndex].value.childrenHeight
            }px`,
          }"
        >
          <div
            v-if="flatItems[itemIndex].value.childrenHeight"
            class="overflow-hidden"
            :style="[
              {
                height: `${flatItems[itemIndex].value.height}px`,
                zIndex: flatItems[itemIndex].value.level,
              },
              {
                position: 'sticky',
                top: `${flatItems[itemIndex].value.topOffset || 0}px`,
              },
            ]"
          >
            <component
              :is="$slots[flatItems[itemIndex].value.slot]"
              v-if="$slots[flatItems[itemIndex].value.slot]"
              :data="flatItems[itemIndex].value.data"
            ></component>
          </div>
          <component
            :is="$slots[flatItems[itemIndex].value.slot]"
            v-else-if="$slots[flatItems[itemIndex].value.slot]"
            :data="flatItems[itemIndex].value.data"
          ></component>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementSize, useEventListener } from '@vueuse/core';

export type RecycleItem = {
  height: number;
  slot: string;
  data: any;
  children?: Array<RecycleItem>;
};

type InnerRecycleItem = {
  id: number;
  top: number;
  height: number;
  level: number;
  topOffset?: number;
  childrenHeight: number;
  slot: string;
  data: any;
};

type PoolItem = {
  itemIndex: number;
  slot: string;
};

const props = defineProps<{
  items?: RecycleItem[];
}>();

let innerIndex = 0;

const expandChildren = (
  items: RecycleItem[],
  initTop = 0,
  offsetTop = 0,
  level = 1
): [Ref<InnerRecycleItem>[], number] => {
  let top = initTop;
  let currentLevel = level;
  const resultItems: Ref<InnerRecycleItem>[] = [];

  items.forEach(({ height, slot, data, children }) => {
    const resultItem: Ref<InnerRecycleItem> = ref({
      id: innerIndex++,
      top,
      height,
      childrenHeight: 0,
      slot,
      data,
      level,
    });
    if (children) {
      const [childItems, newLevel] = expandChildren(
        children,
        top + height,
        height,
        level
      );
      const childrenHeight = childItems.reduce(
        (h, item) => h + item.value.height,
        0
      );
      if (newLevel > currentLevel) {
        currentLevel = newLevel;
      }
      Object.assign(resultItem.value, {
        topOffset: offsetTop,
        childrenHeight,
        level: currentLevel,
      });
      resultItems.push(resultItem);
      resultItems.push(...childItems);
      top += height + childrenHeight;
    } else {
      resultItems.push(resultItem);
      top += height;
    }
  });

  return [resultItems, currentLevel + 1];
};

const flatItems = computed(() => {
  if (props.items) {
    innerIndex = 0;
    return expandChildren(props.items)[0];
  } else {
    return [];
  }
});

const container = ref<HTMLElement | null>(null);
const itemsRef = ref<HTMLElement[] | null>(null);

const totalHeight = computed(() => {
  let height = flatItems.value.reduce((h, i) => h + i.value.height, 0);
  return `${height}px`;
});

const { height: containerHeight } = useElementSize(container);

const pool = reactive<Array<PoolItem>>([]);

const invisiblePoolIndexes = new Map<string, Set<number>>();

const addPoolItem = (id: number) => {
  const slotSet =
    invisiblePoolIndexes.get(flatItems.value[id].value.slot) || new Set();
  const next = slotSet.values().next();
  if (next.done) {
    pool.push({ itemIndex: id, slot: flatItems.value[id].value.slot });
  } else {
    const index = next.value;
    slotSet.delete(index);
    pool[index].itemIndex = id;
  }
};

const scrollTop = ref(0);

useEventListener(container, 'scroll', (e) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop;
});

// FIXME: performance
const shownFlatItemIds = computed(() => {
  // const t0 = performance.now();
  const shownTop = scrollTop.value - containerHeight.value * 0.5;
  const shownBottom = scrollTop.value + containerHeight.value * 1.5;

  const ids = flatItems.value
    .filter((item) => {
      const { top: itemTop, height, childrenHeight } = item.value;
      const itemBottom = itemTop + height + childrenHeight;
      return itemTop < shownBottom && shownTop < itemBottom;
    })
    .map((item) => item.value.id);
  // console.log('flat', flatItems.value.length, performance.now() - t0);

  return ids;
});

const joinIds = computed(() => shownFlatItemIds.value.join(','));

watch(joinIds, () => {
  const currentItemIds = pool.map((poolItem) => poolItem.itemIndex);

  const recycleIndexes = pool.reduce((ids, poolItem, index) => {
    if (!shownFlatItemIds.value.includes(poolItem.itemIndex)) {
      ids.push(index);
    }
    return ids;
  }, [] as number[]);

  const addIds = shownFlatItemIds.value.filter(
    (id) => !currentItemIds.includes(id)
  );

  recycleIndexes.forEach((index) => {
    if (!invisiblePoolIndexes.has(pool[index].slot)) {
      invisiblePoolIndexes.set(pool[index].slot, new Set());
    }
    let slotSet = invisiblePoolIndexes.get(pool[index].slot);
    slotSet?.add(index);
  });
  addIds.forEach((id) => addPoolItem(id));
});
</script>

<style scoped></style>
