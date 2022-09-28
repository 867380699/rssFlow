<template>
  <div ref="container" class="feed-content-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { map, Observable, Subscription } from 'rxjs';
import { render } from 'vue';

import { useGallery } from '@/composables/gallery';
import { useMinHeight } from '@/composables/image';

import LazyImageVue from './LazyImage.vue';

const props = defineProps<{
  imgs: string[];
  offset: number;
}>();

const { openGalleryModal } = useGallery();

const { minHeight } = useMinHeight();

const container = ref<HTMLElement | null>(null);

let imagePlaceholders: Element[] | NodeListOf<Element>;

let subscription: Subscription;

onMounted(() => {
  subscription = new Observable<IntersectionObserverEntry[]>((subscriber) => {
    const rootMargin = `${minHeight.value * 2}px 0px`;
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
              src: props.imgs[index + (props.offset || 0)],
              minHeight: `${minHeight.value}px`,
              loading: 'eager',
              onclick: (ev) => {
                openGalleryModal(
                  props.imgs,
                  index + (props.offset || 0),
                  ev.target
                );
              },
            });
            target.removeAttribute('class');
            target.removeAttribute('style');
            render(lazyImage, target);
          }
        }
      });
    });
});

onBeforeUnmount(() => {
  subscription.unsubscribe();
});
</script>
