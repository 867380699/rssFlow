const cacheMap = new Map<string, Ref<any>>();

const set = (key: string, value: any) => {
  if (typeof value === 'function') {
    cacheMap.set(key, ref(value()));
  } else {
    cacheMap.set(key, ref(value));
  }
};

const get = (key: string) => {
  return cacheMap.get(key);
};

const has = (key: string) => {
  return cacheMap.has(key);
};

const setOnce = (key: string, value: any) => {
  if (!has(key)) {
    set(key, value);
  }
};

const cacheService = {
  get,
  set,
  has,
  setOnce,
};

export default cacheService;
