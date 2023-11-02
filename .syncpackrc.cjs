// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
  versionGroups: [
    {
      dependencies: ['vue'],
      packages: ['**'],
    }
  ],
};

module.exports = config;