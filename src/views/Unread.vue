<template>
<ion-page>
  <ion-content class="ion-padding">
    <h1>Unread</h1>
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
