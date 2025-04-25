<template>
  <IonPage>
    <IonHeader :translucent="true">
      <IonToolbar>
        <IonTitle>Browser</IonTitle>
      </IonToolbar>
    </IonHeader>
    
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/vue';
defineOptions({
  name: 'BrowserPage'
})
</script>

<style scoped>

</style>