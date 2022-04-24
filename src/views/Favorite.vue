<template>
<ion-page>
  <ion-content class="ion-padding">
    <h1>Favorite</h1>
    <!-- MODAL CODE -->
    <ion-modal :is-open="modalIsOpen" @didDismiss="closeModal()">
      <about-modal @onClose="closeModal" />
    </ion-modal>
    <ion-button @click="showModal">Open Modal</ion-button>
  </ion-content>
</ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

import AboutModal from "../components/AboutModal.vue";

export default defineComponent({
  name: "About",

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
