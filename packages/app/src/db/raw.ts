const openDB = (dbName: string) => {
  return new Promise<IDBDatabase>((resolve) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = function () {
      resolve(this.result);
    };
  });
};

export const getFirstKey = async (
  tableName: string,
  indexName: string,
  range: IDBKeyRange,
  direction: IDBCursorDirection
) => {
  const db = await openDB('feedDB');

  return new Promise<IDBValidKey | undefined>((resolve) => {
    const tx = db.transaction([tableName], 'readonly');
    const store = tx.objectStore(tableName);
    const index = store.index(indexName);
    const request = index.openKeyCursor(range, direction);
    request.onsuccess = function () {
      const cursor = this.result;
      if (cursor) {
        resolve(cursor.key);
      }
    };
  });
};

export const getLastKey = async (
  tableName: string,
  indexName: string,
  range: IDBKeyRange,
  direction: IDBCursorDirection
) => {
  return getFirstKey(tableName, indexName, range, reverseDirection(direction));
};

const reverseDirection = (
  direction: IDBCursorDirection
): IDBCursorDirection => {
  switch (direction) {
    case 'next':
      return 'prev';
    case 'prev':
      return 'next';
    case 'nextunique':
      return 'prevunique';
    case 'prevunique':
      return 'nextunique';
  }
};
