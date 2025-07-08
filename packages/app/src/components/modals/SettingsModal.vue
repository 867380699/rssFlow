<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button @click="() => emit('close')">
          <i-ion-close-outline class="text-xl" />
        </ion-button>
      </ion-buttons>
      <ion-title>Settings</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding"> </ion-content>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SettingsModal' });

const emit = defineEmits(['close']);
</script>
