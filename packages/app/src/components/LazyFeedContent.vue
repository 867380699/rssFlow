<template>
  <div ref="container" class="feed-content-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { map, Observable, Subscription } from 'rxjs';
import { render } from 'vue';

import LazyImageVue from './LazyImage.vue';

const props = defineProps<{
  imgEls: Element[];
}>();

const container = ref<HTMLElement | null>(null);

let imagePlaceholders: Element[] | NodeListOf<Element>;

let subscription: Subscription;

onMounted(() => {
  subscription = new Observable<IntersectionObserverEntry[]>((subscriber) => {
    const rootMargin = '360px 0px';
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        subscriber.next(entries);
      },
      { root: container.value!.parentElement, rootMargin }
    );
    console.log(rootMargin);

    imagePlaceholders = container.value!.querySelectorAll('.img-placeholder');
    imagePlaceholders.forEach((e) => {
      intersectionObserver.observe(e);
    });

    return () => intersectionObserver.disconnect();
  })
    .pipe(
      map((entries) =>
        entries.map(({ intersectionRatio, target }) => ({
          intersectionRatio,
          target,
        }))
      )
    )
    .subscribe((e) => {
      e.forEach(({ intersectionRatio, target }) => {
        if (intersectionRatio > 0) {
          const index = Array.prototype.findIndex.call(
            imagePlaceholders,
            (el: Element) => el === target
          );
          if (!target.childElementCount) {
            const lazyImage = h(LazyImageVue, {
              src: props.imgEls[index].src,
              minHeight: '180px',
              loading: 'eager',
            });
            target.classList.remove('img-placeholder');
            render(lazyImage, target);
            // target.append(props.imgEls[index]);
          }
        }
      });
    });
});

onBeforeUnmount(() => {
  subscription.unsubscribe();
});
</script>

<style scoped lang="less">
:deep(.img-placeholder) {
  min-height: 180px;
  @apply bg-slate-400 rounded-sm mb-2;
}
</style>
