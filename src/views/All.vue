<template>
<ion-page>
  <ion-content class="ion-padding">
    <h1>All</h1>
  </ion-content>
</ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import {
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonModal,
} from "@ionic/vue";
import AboutModal from "../components/AboutModal.vue";

export default defineComponent({
  name: "About",
  components: {
    IonHeader,
    IonPage,
    IonButton,
    IonButtons,
    IonBackButton,
    IonContent,
    IonTitle,
    IonToolbar,
    IonModal,
    AboutModal,
  },
  setup() {
    const modalIsOpen = ref(false);
    const showModal = () => {
      modalIsOpen.value = true;
    };

    const closeModal = () => {
      modalIsOpen.value = false;
    };
    return {
      showModal,
      closeModal,
      modalIsOpen,
    };
  },
});
</script>

<style>
</style>
