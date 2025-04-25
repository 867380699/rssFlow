<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Ionic</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item v-for="menu in menus" :key="menu.name" :router-link="menu.link">
          {{ menu.name }}
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonList,
  IonItem,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';

const menus = [
  {
    name: 'Browser',
    link: '/browser',
  },
  {
    name: 'InAppBrowser',
    link: '/in-app-browser',
  },
];

</script>
