<template>
  <ion-list>
    <ion-item
      v-for="item in shownFeedItems"
      :key="item.id"
      @click="toDetail(item.id!)"
    >
      <ion-avatar slot="start" />
      <ion-label>
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      </ion-label>
    </ion-item>
  </ion-list>
</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useFeedItems } from "../composables";
import { useStore } from "../store";

const { feedItems } = useFeedItems();

const shownFeedItems = computed(()=>feedItems.value?.filter((item)=>!feedId.value || item.feedId===feedId.value))

const router = useRouter();
const store = useStore()
const {feedId} = storeToRefs(store);

const toDetail = (id: number) =>{
  router.push(`/detail/${id}`)
}
</script>