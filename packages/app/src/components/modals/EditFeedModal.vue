<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="$emit('close')">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-buttons slot="end">
        <ion-button @click="save">
          <ion-icon :icon="saveOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>Edit feed</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item>
      <ion-input
        :value="feed.source"
        :disabled="true"
        inputmode="url"
        label="Feed URL"
        label-placement="floating"
      />
    </ion-item>
    <ion-item>
      <ion-input v-model="title" label="Title" label-placement="floating" />
    </ion-item>
  </ion-content>
</template>

<script lang="ts" setup>
import { closeOutline, saveOutline } from 'ionicons/icons';

import { updateFeed } from '@/service/dbService';
import { Feed } from '@/types';

const emit = defineEmits(['close']);

const props = defineProps<{
  feed: Feed;
}>();

const title = ref(props.feed.title);

const save = async () => {
  if (props.feed.id) {
    await updateFeed(props.feed.id, { title: title.value });
  }
  emit('close');
};
</script>
