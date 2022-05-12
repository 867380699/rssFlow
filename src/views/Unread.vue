<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item
          v-for="item in feedItems"
          :key="item.id"
        >
          <ion-avatar slot="start" />
          <ion-label>
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
<script lang="ts">
  export default {
    name: 'Unread',
  }
</script>
<script lang="ts" setup>
import { useFeedItems } from "../composables";

const { feedItems } = useFeedItems();
</script>

<style>
</style>
