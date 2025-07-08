<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button @click="$emit('close')">
          <i-ion-close-outline class="text-xl" />
        </ion-button>
      </ion-buttons>
      <ion-title>Add Group</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item>
      <ion-input
        v-model="groupName"
        label="Group Name"
        label-placement="floating"
      />
    </ion-item>
    <div class="p-2">
      <ion-button expand="block" @click="addGroup"> Add </ion-button>
    </div>
  </ion-content>
</template>

<script lang="ts" setup>
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
