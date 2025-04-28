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
        <IonItem @click="openInSystemBrowserBottomSheet">openInSystemBrowserBottomSheet</IonItem>
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


const url = "https://www.v2ex.com";

const openInWebView = async () => {
  await InAppBrowser.openInWebView({
    url,
    options: {
      ...DefaultWebViewOptions,
    }
  });
}

const openInSystemBrowser = async () => {
  await InAppBrowser.openInSystemBrowser({
    url,
    options: {
      ...DefaultSystemBrowserOptions
    }
  });
}
const openInSystemBrowserBottomSheet = async () => {
  await InAppBrowser.openInSystemBrowser({
    url,
    options: {
      android: {
        ...DefaultSystemBrowserOptions.android,
        viewStyle: 0,
        bottomSheetOptions: {
          height: 400,
          isFixed: false
        }
      },
      iOS: {
        ...DefaultSystemBrowserOptions.iOS
      }
    }
  });
}

const openInExternalBrowser = async () => {
  await InAppBrowser.openInExternalBrowser({
    url
  });
}

</script>

<style scoped></style>