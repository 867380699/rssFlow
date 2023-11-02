// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
  versionGroups: [
    {
      dependencies: ['vue'],
      packages: ['**'],
    },
    {
      dependencies: ['vite-plugin-proxy'],
      packages: ['**'],
      isIgnored: true
    }
  ],
};

module.exports = config;