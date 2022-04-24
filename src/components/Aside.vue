<template>
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
</template>
<script lang="ts" setup>
import { add } from 'ionicons/icons'
</script>