/* Season-keyed team data cache. */

import { getCache, setCache } from '/_assets/scripts/utils/cache.js';

export { getTeamDataCache, setTeamDataCache };

const CACHE_KEY_PREFIX = 'teamDataCache:s';
const LEGACY_CACHE_KEY = 'teamDataCache';

const cacheKeyFor = (season) => `${CACHE_KEY_PREFIX}${season}`;

function getTeamDataCache(season) {
    if (season == null) return null;
    const data = getCache(cacheKeyFor(season));
    return Array.isArray(data) && data.length > 0 ? data : null;
}

function setTeamDataCache(season, data) {
    if (season == null || !Array.isArray(data) || data.length === 0) return;
    setCache(cacheKeyFor(season), data);
    try { localStorage.removeItem(LEGACY_CACHE_KEY); } catch { }
}
