<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="unread" href="/unread">
          <ion-icon :icon="eyeOffOutline" />
          <ion-label>{{ $t('unread') }}</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="all" href="/all">
          <ion-icon :icon="listOutline" />
          <ion-label>{{ $t('all') }}</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="favorite" href="/favorite">
          <ion-icon :icon="starOutline" />
          <ion-label>{{ $t('favorite') }}</ion-label>
          <ion-badge>6</ion-badge>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts" setup>
import { eyeOffOutline, listOutline, starOutline } from 'ionicons/icons';
</script>
