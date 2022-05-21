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

const ionRouter = useIonRouter();
useBackButton(-1, () => {
  if (!ionRouter.canGoBack()) {
    App.exitApp();
  }
});

const onItemSelected = () => {
  menuController.close('menu');
};
</script>
