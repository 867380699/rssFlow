<template>
  <div ref="container" class="relative h-full overflow-auto scroll-smooth">
    <div :style="{ minHeight: totalHeight }">
      <template v-for="({ itemIndex }, id) in pool" :key="id">
        <div
          v-if="flatItems[itemIndex]"
          ref="itemsRef"
          class="absolute w-full"
          :class="{
            'overflow-hidden': !flatItems[itemIndex].value.childrenHeight,
            'pointer-events-none': flatItems[itemIndex].value.childrenHeight,
          }"
          :style="[
            flatItems[itemIndex].value.childrenHeight
              ? {
                  top: `${flatItems[itemIndex].value.top}px`,
                }
              : {
                  transform: `translateY(${flatItems[itemIndex].value.top}px)`,
                },
            {
              height: `${
                flatItems[itemIndex].value.height +
                flatItems[itemIndex].value.childrenHeight
              }px`,
            },
          ]"
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

<script setup lang="ts" generic="T">
import { useElementSize, useEventListener } from '@vueuse/core';
import { throttle } from 'lodash-es';

export type RecycleItem<T> = {
  height: number;
  slot: string;
  data: T;
  children?: Array<RecycleItem<T>>;
};

type InnerRecycleItem<T> = {
  id: number;
  top: number;
  height: number;
  level: number;
  topOffset?: number;
  childrenHeight: number;
  slot: string;
  data: T;
};

type PoolItem = {
  itemIndex: number;
  slot: string;
};

const props = defineProps<{
  items?: RecycleItem<T>[];
}>();

let innerIndex = 0;

const scrollOffsets = ref<number[]>([]);
let scrollOffset = computed<number>(() =>
  scrollOffsets.value.reduce((a = 0, b = 0) => a + b, 0)
);
const expandChildren = (
  items: RecycleItem<T>[],
  initTop = 0,
  offsetTop = 0,
  level = 1
): [Ref<InnerRecycleItem<T>>[], number] => {
  let top = initTop;
  let currentLevel = level;
  const resultItems: Ref<InnerRecycleItem<T>>[] = [];

  items.forEach(({ height, slot, data, children }) => {
    const resultItem: Ref<InnerRecycleItem<T>> = ref({
      id: innerIndex++,
      top,
      height,
      level,
      childrenHeight: 0,
      slot,
      data,
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
  scrollOffsets.value[currentLevel] = offsetTop;
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

const flatItemLevelIndex = computed(() => {
  const index: number[][] = [];
  flatItems.value.forEach((item, i) => {
    const level = item.value.level - 1;
    if (!index[level]) {
      index[level] = [];
    }
    index[level].push(i);
  });
  return index;
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

useEventListener(
  container,
  'scroll',
  throttle((e) => {
    scrollTop.value = (e.target as HTMLElement).scrollTop;
  }, 10)
);

const shownFlatItemIds = computed(() => {
  // const t0 = performance.now();
  const shownTop = scrollTop.value - containerHeight.value * 0.5;
  const shownBottom = scrollTop.value + containerHeight.value * 1.5;

  const isShown = (item: Ref<InnerRecycleItem<T>>) => {
    const { top: itemTop, height, childrenHeight } = item.value;
    const itemBottom = itemTop + height + childrenHeight;
    return itemTop < shownBottom && shownTop < itemBottom;
  };
  // find the biggest itemTop less then shownTop
  const findStartIndex = (ids: number[]) => {
    let a = 0;
    let b = ids.length;
    let i = ~~((a + b) / 2);

    do {
      const item = flatItems.value[ids[i]];
      if (item.value.top >= shownTop) {
        b = i;
      } else {
        a = i;
      }
      i = ~~((a + b) / 2);
    } while (i !== a);

    return i;
  };

  const shownIds: number[] = [];
  for (let i = 0; i < flatItemLevelIndex.value.length; i++) {
    const ids = flatItemLevelIndex.value[i];
    const start = findStartIndex(ids);
    for (let j = start; j < ids.length; j++) {
      const item = flatItems.value[ids[j]];
      if (isShown(item)) {
        shownIds.push(item.value.id);
      } else if (j > start) {
        break;
      }
    }
  }

  // const shownIds = flatItems.value.filter(isShown).map((item) => item.value.id);
  // const t1 = performance.now();
  // console.log(`flat:${shownIds.length}/${flatItems.value.length}`, t1 - t0);
  return shownIds;
});

const joinIds = computed(() => shownFlatItemIds.value.join(','));

watch(joinIds, () => {
  const currentItemIds = new Set(pool.map((poolItem) => poolItem.itemIndex));

  const recycleIndexes = pool.reduce((ids, poolItem, index) => {
    if (!shownFlatItemIds.value.includes(poolItem.itemIndex)) {
      ids.push(index);
    }
    return ids;
  }, [] as number[]);

  const addIds = shownFlatItemIds.value.filter((id) => !currentItemIds.has(id));

  for (let slotSet of invisiblePoolIndexes.values()) {
    slotSet.clear();
  }
  recycleIndexes.forEach((index) => {
    if (!invisiblePoolIndexes.has(pool[index].slot)) {
      invisiblePoolIndexes.set(pool[index].slot, new Set());
    }
    let slotSet = invisiblePoolIndexes.get(pool[index].slot);
    slotSet?.add(index);
  });
  addIds.forEach((id) => addPoolItem(id));
});

const scrollItemIntoView = (
  find: (data: T) => boolean,
  scrollBehavior?: ScrollBehavior = 'auto'
) => {
  const item = flatItems.value.find((item) => find(item.value.data));
  if (item && container.value) {
    container.value.scrollTo({
      top: item.value.top - scrollOffset.value,
      behavior: scrollBehavior,
    });
  }
};

const scrollTo = (scrollOption: ScrollToOptions) => {
  if (container.value) {
    container.value.scrollTo(scrollOption);
  }
};

defineExpose({ scrollTo, scrollItemIntoView });
</script>

<style scoped></style>
