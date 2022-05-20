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
import { menuController } from '@ionic/vue';

const onItemSelected = () => {
  menuController.close('menu');
};
</script>
