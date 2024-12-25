<template>
  <ion-menu content-id="main-content">
    <ion-header>
      <ion-toolbar>
        <ion-title>Menu Content</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-item>Large pictures</ion-item>
    </ion-content>
  </ion-menu>
  <ion-page id="main-content">
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-buttons slot="end">
            <ion-select interface="popover" :value="suffix" @ionChange="onSuffixChange">
              <ion-select-option value="?origin">Origin</ion-select-option>
              <ion-select-option value="?thumbnail">Canvas</ion-select-option>
              <ion-select-option value="?pica">Pica</ion-select-option>
            </ion-select>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-list>
        <MessageListItem v-for="message in messages" :key="message.id" :message="message" :suffix="suffix" />
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonMenu,
  IonContent,
  IonHeader,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonItem,
  IonSelect,
  IonSelectOption
} from '@ionic/vue';
import MessageListItem from '@/components/MessageListItem.vue';
import { getMessages, Message } from '@/data/messages';
import { ref } from 'vue';

const suffix = ref('?origin');

const onSuffixChange = (ev: CustomEvent) => {
  suffix.value = ev.detail.value
}

const messages = ref<Message[]>(getMessages());

const refresh = (ev: CustomEvent) => {
  setTimeout(() => {
    ev.detail.complete();
  }, 3000);
};
</script>
