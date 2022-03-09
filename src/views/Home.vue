<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="unread" href="/about">
          <ion-icon :icon="eyeOffOutline"/>
          <ion-label>Unread</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="all" href="/all">
          <ion-icon :icon="listOutline"/>
          <ion-label>All</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="favorite" href="/favorite">
          <ion-icon :icon="starOutline"/>
          <ion-label>Favorite</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts" setup>

import {
  IonContent,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonFooter,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonRouterOutlet,
} from "@ionic/vue";

import { eyeOffOutline, listOutline, starOutline } from 'ionicons/icons';
</script>

<style>
</style>
