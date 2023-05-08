<template>
  <ion-content>
    <ion-list v-for="action in actions" :key="action.key">
      <ion-item @click="handleFeedAction(action)">
        {{ action.label }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { IonContent, IonItem, IonList, popoverController } from '@ionic/vue';

import { feedDB, storeFeed } from '@/service/dbService';
import xmlService from '@/service/xmlService';
import { downloadFile, readFileAsString } from '@/utils/flie';
import { toast } from '@/utils/toast';

type Action = {
  key: 'import' | 'export';
  label: string;
};

const { t } = useI18n();

const actions: Action[] = [
  {
    key: 'import',
    label: t('import'),
  },
  {
    key: 'export',
    label: t('export'),
  },
];

const handleFeedAction = (action: Action) => {
  switch (action.key) {
    case 'import':
      importOPML();
      break;
    case 'export':
      exportOPML();
      break;
  }
  popoverController.dismiss();
};

const importOPML = async () => {
  console.log('importOPML');
  const opmlString = await readFileAsString(
    '.opml, .xml, application/octet-stream' // compatible with opml on android
  );
  if (opmlString) {
    const opml = xmlService.parse(opmlString);

    feedDB.transaction('rw', feedDB.feeds, async () => {
      const allFeeds = await feedDB.feeds.toArray();
      const groups = await feedDB.feeds.where({ type: 'group' }).toArray();
      const sources = allFeeds.map((feed) => feed.source);
      const importFeeds = (outlines: NodeListOf<Element>, parentId = 0) => {
        Array.from(outlines).forEach(async (outline) => {
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
                feedId = await storeFeed({
                  title,
                  source: '',
                  type: 'group',
                  parentId,
                });
              }
              importFeeds(childOutlines, feedId);
            } else if (source) {
              if (sources.indexOf(source) === -1) {
                console.log('feed', title, parentId);
                storeFeed({
                  source,
                  title,
                  type: 'feed',
                  parentId,
                });
                sources.push(source);
              }
            }
          }
        });
      };

      const outlines = opml.querySelectorAll('opml > body > outline');
      importFeeds(outlines);
    });
  }
};

const exportOPML = async () => {
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
  const feeds = await feedDB.feeds.where({ parentId }).sortBy('rank');

  return Promise.all(
    feeds.map(async (feed) => {
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
</script>

<style scoped></style>
