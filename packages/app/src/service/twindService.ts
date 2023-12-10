import { defineConfig } from '@twind/core';
import presetAutoprefix from '@twind/preset-autoprefix';
import presetTailwind from '@twind/preset-tailwind';

export const twindConfig = defineConfig({
  presets: [presetAutoprefix(), presetTailwind()],
});
