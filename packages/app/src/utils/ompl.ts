import { i18n } from '@/i18n';
import { feedDB, queryTailFeedId } from '@/service/dbService';
import xmlService from '@/service/xmlService';
import { downloadFile, readFileAsString } from '@/utils/flie';
import { toast } from '@/utils/toast';

const t = i18n.global.t;

export const importOPML = async () => {
  console.log('importOPML');
  const opmlString = await readFileAsString(
    '.opml, .xml, application/octet-stream' // compatible with opml on android
  );
  if (opmlString) {
    const opml = xmlService.parse(opmlString);

    const allFeeds = await feedDB.feeds.toArray();
    const groups = await feedDB.feeds.where({ type: 'group' }).toArray();
    const sourceSet = new Set(allFeeds.map((feed) => feed.source));

    const importFeeds = async (outlines: NodeListOf<Element>, parentId = 0) => {
      await feedDB.transaction('rw', feedDB.feeds, async () => {
        let prevId = await queryTailFeedId(parentId);

        console.log('prevId', prevId, 'parentId', parentId, outlines);
        const feedIds = [];
        for (const outline of outlines) {
          const source =
            outline.getAttribute('xmlUrl') || outline.getAttribute('xmlurl');
          const title =
            outline.getAttribute('title') || outline.getAttribute('text');
          const childOutlines = outline.querySelectorAll(':scope > outline');
          if (title) {
            if (childOutlines.length) {
              const group = groups.find((g) => g.title === title);
              let feedId;
              if (group) {
                feedId = group.id;
              } else {
                feedId = await feedDB.feeds.add({
                  title,
                  source: '',
                  type: 'group',
                  parentId,
                  prevId,
                  nextId: 0,
                });
                prevId = Number(feedId);
                feedIds.push(Number(feedId));
              }
              await importFeeds(childOutlines, Number(feedId));
            } else if (source) {
              if (!sourceSet.has(source)) {
                const feedId = await feedDB.feeds.add({
                  source,
                  title,
                  type: 'feed',
                  parentId,
                  lastUpdateTime: Date.now(),
                  prevId,
                  nextId: 0,
                });
                prevId = Number(feedId);
                feedIds.push(Number(feedId));
                sourceSet.add(source);
              }
            }
          }
        }
        for (let i = 0; i < feedIds.length; i++) {
          await feedDB.feeds.update(feedIds[i], {
            nextId: feedIds[i + 1] || 0,
          });
        }
      });
    };

    const outlines = opml.querySelectorAll('opml > body > outline');
    importFeeds(outlines);
  }
};

export const exportOPML = async () => {
  console.log('exportOPML');
  const xml = document.implementation.createDocument(null, 'opml');

  const opml = xml.querySelector('opml');

  if (opml) {
    opml.setAttribute('version', '2.0');

    const body = document.createElement('body');

    const outlines = await buildOutline();

    body.append(...outlines);

    opml.append(body);
  }

  const opmlString = xmlService.serialize(xml);

  const timeStamp = Math.round(Date.now() / 1000);
  const result = await downloadFile(opmlString, `rssflow_${timeStamp}.opml`);
  await toast(`${t('exportSuccess')}: ${result?.uri.replace('file://', '')}`);
};

const buildOutline = async (parentId = 0) => {
  const feeds = await feedDB.feeds.where({ parentId }).toArray();

  const feedMap = new Map(feeds.map((f) => [f.id, f]));

  const sortedFeeds = [];

  let headFeed = feeds.find((f) => f.prevId === 0);

  while (headFeed) {
    sortedFeeds.push(headFeed);
    headFeed = feedMap.get(headFeed.nextId);
  }

  return Promise.all(
    sortedFeeds.map(async (feed) => {
      const outline = document.createElementNS(
        'http://opml.org/spec2',
        'outline'
      );

      let attrs: Record<string, string> = {};
      if (feed.type === 'group') {
        attrs = {
          title: feed.title,
          text: feed.title,
        };
        const childOutline = await buildOutline(feed.id);
        outline.append(...childOutline);
      } else if (feed.type === 'feed') {
        attrs = {
          title: feed.title,
          text: feed.title,
          type: 'rss',
          xmlUrl: feed.source,
        };
      }
      for (const [key, value] of Object.entries(attrs)) {
        outline.setAttribute(key, value);
      }
      return outline;
    })
  );
};
