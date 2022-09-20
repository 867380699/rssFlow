# Ionic

##  Vue Template

><https://github.com/aaronksaunders/ionicv6-beta-vue-vite-project>

## Native HTTP

> <https://github.com/capacitor-community/http>

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