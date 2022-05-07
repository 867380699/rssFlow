const parser = new DOMParser();

export type FeedItem = {
  title: string;
  description: string;
  link: string;
}

export type Feed = {
  title: string,
  description: string,
  link: string,
  imageUrl: string,
  items: Array<FeedItem>
}

const parseFeedItems = (nodeTree: Document): Array<FeedItem> => {
  const itemNodes = nodeTree.querySelectorAll('rss > channel > item');
  const items: Array<FeedItem> = [];
  itemNodes.forEach(node => items.push({
    title: node.querySelector('title')?.textContent || '',
    description: node.querySelector('description')?.textContent || '',
    link: node.querySelector('link')?.textContent?.replace(/^https?/,'https') || '',
  }))
  return items;
}

export const parseFeed = (feed: string):Feed => {
  const nodeTree = parser.parseFromString(feed, 'text/xml');
  const title = nodeTree.querySelector('rss > channel > title')?.textContent || '';
  const description = nodeTree.querySelector('rss > channel > description')?.textContent || '';
  const link = nodeTree.querySelector('rss > channel > link')?.textContent || '';
  const imageUrl = nodeTree.querySelector('rss > channel > image > url')?.textContent?.replace(/^https?/,'https') || '';
  const items = parseFeedItems(nodeTree);
  console.log(nodeTree);
  return {
    title,
    description,
    link,
    imageUrl,
    items
  };  
} 