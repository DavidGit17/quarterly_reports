type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const inflightMap = new Map<string, Promise<unknown>>();
const cacheMap = new Map<string, CacheEntry<unknown>>();

export async function dedupedFetch<T>(
  url: string,
  options?: { ttlMs?: number; cacheKey?: string },
): Promise<T> {
  const key = options?.cacheKey ?? url;
  const ttlMs = options?.ttlMs ?? 30000;

  // Check TTL cache first
  const cached = cacheMap.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // Deduplicate in-flight requests
  if (!inflightMap.has(key)) {
    inflightMap.set(
      key,
      (async () => {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} for ${url}`);
          }
          const data = (await res.json()) as T;
          cacheMap.set(key, { data, expiresAt: Date.now() + ttlMs } as CacheEntry<unknown>);
          return data;
        } finally {
          inflightMap.delete(key);
        }
      })(),
    );
  }

  return inflightMap.get(key) as Promise<T>;
}

export function invalidateCache(key: string) {
  cacheMap.delete(key);
  inflightMap.delete(key);
}
