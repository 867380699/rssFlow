<template>
  <ion-app>
    <ion-menu side="start" content-id="main-content">
      <ion-header>
        <ion-toolbar>
          <ion-title>RSS</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-fab vertical="top" horizontal="end" slot="fixed" edge>
          <ion-fab-button>
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
        <ion-list>
          <ion-item>Core</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
    <ion-page id="main-content">
      <ion-header>
        <ion-toolbar>
          <ion-menu-button slot="start"/>
          <ion-title>Inbox</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-router-outlet />
      </ion-content>
    </ion-page>
  </ion-app>
</template>
<script lang="ts" setup>
import {
  IonApp,
  IonRouterOutlet, 
  IonMenu, 
  IonHeader, 
  IonContent, 
  IonToolbar, 
  IonTitle, 
  IonList, 
  IonItem,
  IonPage,
  IonButtons,
  IonMenuButton,
  IonFab,
  IonFabButton
} from "@ionic/vue";
import { add } from 'ionicons/icons'
</script>