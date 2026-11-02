/* Season info cache. */

import { getCache, setCache } from '/_assets/scripts/utils/cache.js';

export { getSeasonInfoCache, setSeasonInfoCache };

const CACHE_KEY = 'seasonInfoCache';

function getSeasonInfoCache() {
    const data = getCache(CACHE_KEY);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

function setSeasonInfoCache(season, data) {
    const cache = getSeasonInfoCache();
    cache[season] = data;
    setCache(CACHE_KEY, cache);
}
