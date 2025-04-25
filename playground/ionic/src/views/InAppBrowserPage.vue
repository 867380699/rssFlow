<template>
  <IonPage>
    <IonHeader :translucent="true">
      <IonToolbar>
        <IonTitle>InAppBrowserPage</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonItem @click="openInWebView">openInWebView</IonItem>
        <IonItem @click="openInSystemBrowser">openInSystemBrowser</IonItem>
        <IonItem @click="openInExternalBrowser">openInExternalBrowser</IonItem>
      </IonList>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem
} from '@ionic/vue';
import { InAppBrowser, DefaultWebViewOptions, DefaultSystemBrowserOptions } from '@capacitor/inappbrowser';


defineOptions({
  name: 'InAppBrowserPage'
})


const openInWebView = async () => {
  await InAppBrowser.openInWebView({
    url: "https://www.v2ex.com",
    options: {
      ...DefaultWebViewOptions,
    }
  });
}

const openInSystemBrowser = async () => {
  await InAppBrowser.openInSystemBrowser({
    url: "https://www.v2ex.com",
    options: {
      ...DefaultSystemBrowserOptions
    }
  });
}

const openInExternalBrowser = async () => {
  await InAppBrowser.openInExternalBrowser({
    url: "https://www.v2ex.com"
  });
}

</script>

<style scoped></style>