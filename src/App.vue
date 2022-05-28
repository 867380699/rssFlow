<template>
  <ion-app>
    <!-- side menu -->
    <ion-menu menu-id="menu" side="start" content-id="main-content">
      <Aside @item-selected="onItemSelected" />
    </ion-menu>
    <ion-router-outlet />
  </ion-app>
</template>
<script lang="ts" setup>
import { App } from '@capacitor/app';
import { menuController, useBackButton, useIonRouter } from '@ionic/vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { messageSW } from 'workbox-window';

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

initSync();

onBeforeUnmount(destroySync);

useRegisterSW({
  immediate: true,
  async onRegistered(r) {
    if (r && r.active) {
      const v = await messageSW(r.active, { type: 'GET_VERSION' });
      console.log(v);
    }
    console.log(
      `SW Registered: [active]:${r?.active}, [waiting]:${r?.waiting}`
    );
  },
});
</script>
