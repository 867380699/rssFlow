import { defineStore } from 'pinia';

export const useStore = defineStore('store', {
  state: () => {
    return { feedId: 0 };
  },
  actions: {
    setFeedId(id: number) {
      this.feedId = id;
    },
  },
});
