<template>
  <ion-app>
    <ion-split-pane content-id="main" when="lg">
      <!-- side menu -->
      <ion-menu menu-id="menu" content-id="main" side="start" type="reveal">
        <Aside @item-selected="onItemSelected" />
      </ion-menu>
      <suspense><ion-router-outlet id="main" /></suspense>
    </ion-split-pane>
  </ion-app>
</template>
<script lang="ts" setup>
import { App } from '@capacitor/app';
import { menuController, useBackButton, useIonRouter } from '@ionic/vue';

import { destroySync, initSync } from './service/feedService';

const ionRouter = useIonRouter();
useBackButton(-1, () => {
  if (!ionRouter.canGoBack()) {
    App.exitApp();
  }
});

const onItemSelected = () => {
  menuController.close('menu');
};

onMounted(initSync);

onBeforeUnmount(destroySync);
</script>
