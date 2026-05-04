type CacheValue = {
  data: any;
  expiresAt: number;
};

const cache = new Map<string, CacheValue>();

export function getCache(key: string) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

export function setCache(key: string, data: any, ttlMs = 10 * 60 * 1000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function deleteCache(key: string) {
  cache.delete(key);
}