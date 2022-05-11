import { liveQuery } from "dexie";
import { ref } from "vue";
import { feedDB } from "../service/dbService";
import { FeedItem } from "../types";

export const useFeedItems = () => {
  const feedItems = ref<FeedItem[]>()
  liveQuery(() => feedDB.feedItems.toArray()).subscribe({
    next: result => {
      feedItems.value = result;
    },
    error: error => console.error(error)
  })
  return {
    feedItems
  }
}