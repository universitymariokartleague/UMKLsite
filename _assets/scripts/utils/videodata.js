/* Shared cache for the /videos API payload. */

import { getCache, setCache } from '/_assets/scripts/utils/cache.js';

export { getCachedVideos, setCachedVideos };

const CACHE_KEY = 'videosCache';

function getCachedVideos() {
    const data = getCache(CACHE_KEY);
    return Array.isArray(data) && data.length > 0 ? data : null;
}

function setCachedVideos(data) {
    if (!Array.isArray(data) || data.length === 0) return;
    setCache(CACHE_KEY, data);
}
