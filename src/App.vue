<template>
  <ion-app>
    <!-- side menu -->
    <ion-menu side="start" content-id="main-content">
      <Aside></Aside>
    </ion-menu>
    <!-- main content -->
    <ion-page id="main-content">
      <ion-header>
        <ion-toolbar>
          <ion-menu-button slot="start"/>
          <ion-title>Inbox</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-router-outlet />
      </ion-content>
    </ion-page>
  </ion-app>
</template>
<script lang="ts" setup>

</script>