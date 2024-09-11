function storeInCache(key: string, value: any, ttl_ms: number) {
  const item = {
    value: value,
    expiry: Date.now() + ttl_ms
  };

  localStorage.setItem(key, JSON.stringify(item));
}

function getFromCache(key: string) {
  const lsRecord = localStorage.getItem(key);

  if (!lsRecord) return null;

  const item = JSON.parse(lsRecord);

  if (Date.now() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
}

export { storeInCache, getFromCache };
