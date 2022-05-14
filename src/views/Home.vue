<template>
  <!-- side menu -->
  <ion-menu menu-id="menu" side="start" content-id="main-content">
    <Aside @item-selected="onItemSelected" />
  </ion-menu>
  <ion-page id="main-content">
    <ion-header>
      <ion-toolbar>
        <ion-menu-button slot="start" />
        <ion-title>{{ feed?.title || 'All' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="unread" href="/unread">
          <ion-icon :icon="eyeOffOutline" />
          <ion-label>{{ $t('unread') }}</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="all" href="/all">
          <ion-icon :icon="listOutline" />
          <ion-label>{{ $t('all') }}</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="favorite" href="/favorite">
          <ion-icon :icon="starOutline" />
          <ion-label>{{ $t('favorite') }}</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts" setup>
import { menuController } from '@ionic/vue';
import { eyeOffOutline, listOutline, starOutline } from 'ionicons/icons';
import { ref, watch } from 'vue';
import { feedDB } from '../service/dbService';
import { useStore } from '../store';
import { Feed } from '../types';
const store = useStore();

const onItemSelected = () => {
  menuController.close('menu');
};

const feed = ref<Feed>();

watch(
  () => [store.feedId],
  async () => {
    feed.value = await feedDB.feeds.get(store.feedId);
  }
);
</script>
