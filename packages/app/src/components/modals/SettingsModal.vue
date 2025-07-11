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
  <ion-content class="ion-padding">
    <ion-item>
      <ion-label slot="start" class="whitespace-nowrap text-xs"
        >Global Font</ion-label
      >
      <div
        id="change-font-trigger"
        class="flex w-full items-center justify-end"
      >
        <div class="truncate text-xs">
          {{ currentFont || 'Default' }}
        </div>
        <i-ion-chevron-down class="shrink-0" />
      </div>
      <ion-popover
        trigger="change-font-trigger"
        trigger-action="click"
        alignment="right"
        style="--width: auto"
        :dismiss-on-select="true"
      >
        <div class="divide-y divide-slate-400 divide-opacity-10 px-2">
          <div
            class="whitespace-nowrap py-2 text-xs"
            @click="() => clearFont()"
          >
            Default
          </div>
          <div
            v-for="font in fontNames"
            :key="font"
            class="whitespace-nowrap py-2 text-xs"
            @click="() => onFontClick(font)"
          >
            {{ font }}
          </div>
          <div
            class="flex w-full justify-center whitespace-nowrap py-2 text-xs"
            @click="addFont"
          >
            <i-ion-add />
          </div>
        </div>
      </ion-popover>
    </ion-item>
  </ion-content>
</template>

<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core';

import { useFontNames } from '@/composables/index';
import { storeFont } from '@/service/dbService';
import { readFileAsBuffer } from '@/utils/flie';

defineOptions({ name: 'SettingsModal' });

const emit = defineEmits(['close']);

const { fontNames } = useFontNames();
const currentFont = useLocalStorage('font', '');

const addFont = async () => {
  const { name, buffer } = await readFileAsBuffer('.ttf,.otf,.woff,.woff2'); // .ttf load 2~3x faster than .woff2 and .otf
  await storeFont({ name, buffer });
  await setFont(name);
};

const setFont = async (fontName: string) => {
  const loadedCustomFonts = [...document.fonts].filter((f) =>
    fontNames.value?.includes(f.family)
  );
  if (!loadedCustomFonts.map((f) => f.family).includes(fontName)) {
    const fontFace = new FontFace(fontName, `url(/custom-font/${fontName})`);
    await fontFace.load();
    document.fonts.add(fontFace);
  }
  document.body.style.setProperty('--ion-font-family', `"${fontName}"`);
  currentFont.value = fontName;
  loadedCustomFonts.forEach((f) => document.fonts.delete(f));
};

const clearFont = async () => {
  currentFont.value = '';
  document.body.style.removeProperty('--ion-font-family');
};

const onFontClick = async (fontName: string) => {
  await setFont(fontName);
};
</script>
