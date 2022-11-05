<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button @click="$emit('close')">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>Add Group</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item>
      <ion-label position="floating"> Group Name </ion-label>
      <ion-input v-model="groupName" />
    </ion-item>
    <ion-button @click="addGroup"> Add </ion-button>
  </ion-content>
</template>

<script lang="ts" setup>
import { closeOutline } from 'ionicons/icons';

import { storeGroup } from '@/service/dbService';

const emit = defineEmits(['close']);

const groupName = ref('');

const addGroup = async () => {
  if (groupName.value) {
    await storeGroup(groupName.value);
    emit('close');
  }
};
</script>
