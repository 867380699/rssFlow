# Ionic

##  Vue Template

><https://github.com/aaronksaunders/ionicv6-beta-vue-vite-project>

## Native HTTP

> <https://capacitorjs.com/docs/apis/http>

## Splash

> <https://forum.ionicframework.com/t/white-screen-after-splash-and-before-my-home-screen-capacitor-ionic/202724>

# Dexie

## Schema

|         |                               |
|---------|-------------------------------|
| `++`    | Auto-incremented primary key  |
| `&`     | Unique index                  |
| `*`     | Multi-entry index             |
| `[A+B]` | Compound index or primary key |

# Decorator

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

- class declaration
- property
- method
- parameter
- accessor

```ts
@classDecorator
class Person {
  @propertyDecorator
  public name: string;

  @accessorDecorator
  get fullName() {
    // ...
  }

  @methodDecorator
  printName(@parameterDecorator prefix: string) {
    // ...
  }
}
```

# Web Workers

Data is sent between workers and the main thread via a system of messages.

- `postMessage()`
- `onmessage`

The data is copied rather than shared.

## MessageChannel

# B64 to Blob

```js
const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}
```

# CacheStorage

```js
const cache = await caches.open(cacheName);
await cache.put(request, resp);

const cacheResponse = await cache.match(url);
```

# Animation

```js
document.getElementById("alice").animate(
  [
    { transform: 'rotate(0) translate3D(-50%, -50%, 0)', color: '#000' },
    { color: '#431236', offset: 0.3 },
    { transform: 'rotate(360deg) translate3D(-50%, -50%, 0)', color: '#000' }
  ], {
    duration: 3000,
    iterations: Infinity
  }
);

```

# CSS

## clip-path

```css
clip-path: inset(1rem 3rem 3rem calc(10vw - 5px));
```

# vue

```js
h('strong', 'Foo')
// eq
createVNode('strong', null, 'Foo')
```


```js
export interface Events {
  onContextmenu: MouseEvent
}
```


# Lodash

```yml
bundle size:    3.29 MB
original size:  5.155 MB
code reduction: 36.17 %
module count:   402

--- export * as _ from 'lodash-es'

bundle size:    3.309 MB
original size:  5.176 MB
code reduction: 36.06 %
module count:   435
```

# OPML

Outline Processor Markup Language

<http://opml.org/spec2.opml>

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Title</title>
    <dateCreated>Wed, 28 Dec 2022 07:27:33 GMT</dateCreated>
  </head>
  <body>
    <outline type="rss" title="title" text="text" xmlUrl="url"/>

    <outline title="group">
      <outline type="rss" title="title" text="text" xmlUrl="url"/>
    </outline>

  </body>
</opml>
```

- `<outline>` 
  + `text` - required attribute