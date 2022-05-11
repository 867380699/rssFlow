export type Feed = {
    id?: number;
    title: string;
    description?: string;
    link: string;
    imageUrl?: string;
    items?: Array<FeedItem>
}

export type FeedItem = {
    id?: number;
    feedId?: number;
    title: string;
    description?: string;
    link: string;
}