<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button @click="() => emit('close')">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>About</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <div class="text-center">
      <ion-list class="space-y-4">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <div class="flex items-baseline justify-center space-x-1">
                <h1 class="text-3xl">RSS</h1>
                <div class="text-sm text-opacity-50">
                  {{ `v${version}-${gitRevision}` }}
                </div>
              </div>
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>DB version</ion-label>
              <ion-note slot="end">{{ dbVersion }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Platform</ion-label>
              <ion-note slot="end">{{ platform }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Service Wroker</ion-label>
              <ion-note slot="end">{{ swInfo }}</ion-note>
            </ion-item>
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Storage</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>Total</ion-label>
              <ion-note slot="end">
                {{ formatBytes(storageInfo.usage || 0) }}
              </ion-note>
            </ion-item>
            <template v-if="storageInfo.usageDetails">
              <ion-item>
                <ion-label>Cache</ion-label>
                <ion-note slot="end">
                  {{ formatBytes(storageInfo.usageDetails.caches || 0) }}
                </ion-note>
              </ion-item>
              <ion-item>
                <ion-label>IndexedDB</ion-label>
                <ion-note slot="end">
                  {{ formatBytes(storageInfo.usageDetails.indexedDB || 0) }}
                </ion-note>
              </ion-item>
            </template>
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-header>
            <ion-card-title>FeedItems</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>Total</ion-label>
              <ion-note slot="end">
                {{ feedItemStatistic?.total }}
              </ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Unread</ion-label>
              <ion-note slot="end">
                {{ feedItemStatistic?.unread }}
              </ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Favorite</ion-label>
              <ion-note slot="end">
                {{ feedItemStatistic?.favorite }}
              </ion-note>
            </ion-item>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </div>
  </ion-content>
</template>

<script lang="ts" setup>
import { Capacitor } from '@capacitor/core';
import { closeOutline } from 'ionicons/icons';

import { useAllFeedItemStatistic } from '@/composables';
import { dbVersion } from '@/service/dbService';

import { version } from '../../../package.json';

defineOptions({ name: 'AboutModal' });

const emit = defineEmits(['close']);

const gitRevision = import.meta.env.GIT_REVISION;

const platform = Capacitor.getPlatform();

const swInfo = ref('');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      console.log(event, 'about sw');
      swInfo.value = `v${event.data.version} (${event.data.platform})`;
    };
    registration.active?.postMessage({ type: 'INFO' }, [messageChannel.port2]);
  });
}

const storageInfo = ref<StorageEstimate>({});

navigator.storage.estimate().then((info) => {
  storageInfo.value = info;
});

const formatBytes = (bytes: number) => {
  if (bytes >= 1000000000) {
    return `${(bytes / 1000000000).toFixed(2)} GB`;
  }
  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(2)} MB`;
  }
  if (bytes >= 1000) {
    return `${(bytes / 1000).toFixed(2)} KB`;
  }
  return `${bytes} B`;
};

const { feedItemStatistic } = useAllFeedItemStatistic();
</script>
