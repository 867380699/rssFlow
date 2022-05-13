<template>
  <ion-app>
    <!-- side menu -->
    <ion-menu
      menu-id="menu"
      side="start"
      content-id="main-content"
    >
      <Aside @item-selected="onItemSelected" />
    </ion-menu>
    <!-- main content -->
    <ion-page id="main-content">
      <ion-header>
        <ion-toolbar>
          <ion-menu-button slot="start" />
          <ion-title>{{ feed?.title || 'All' }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-router-outlet />
      </ion-content>
    </ion-page>
  </ion-app>
</template>
<script lang="ts" setup>import { menuController } from '@ionic/vue';
import { watch } from 'vue';
import { ref } from 'vue';
import { feedDB } from './service/dbService';
import { useStore } from './store';
import { Feed } from './types';

const store = useStore();


const onItemSelected = () => {
  menuController.close('menu')
}

const feed = ref<Feed>();

watch(()=>[store.feedId], async ()=>{
  feed.value = await feedDB.feeds.get(store.feedId)
})


</script>