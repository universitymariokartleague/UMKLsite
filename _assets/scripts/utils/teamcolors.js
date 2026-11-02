/* Cached, deduped team colours fetch. */

import { getCache, getCacheEntry, isCacheFresh, setCache } from '/_assets/scripts/utils/cache.js';

export { getTeamColors, getCachedTeamColors };

const API_URL = 'https://api.umkl.co.uk/teamcolors';
const CACHE_KEY = 'teamColorsCache';
const MAX_AGE_MS = 30 * 60 * 1000;

let pending = null;

async function fetchTeamColors() {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    try {
        const apiReqsSent = parseInt(localStorage.getItem('apiReqsSent')) || 0;
        localStorage.setItem('apiReqsSent', apiReqsSent + 1);
    } catch { }

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Unexpected teamcolors response');
    return data;
}

function getCachedTeamColors() {
    const entry = getCacheEntry(CACHE_KEY);
    return entry && Array.isArray(entry.data) ? entry.data : null;
}

function getTeamColors() {
    if (pending) return pending;

    const entry = getCacheEntry(CACHE_KEY);
    if (entry && Array.isArray(entry.data) && isCacheFresh(entry, MAX_AGE_MS)) {
        return Promise.resolve(entry.data);
    }

    pending = fetchTeamColors()
        .then(data => {
            setCache(CACHE_KEY, data);
            return data;
        })
        .finally(() => { pending = null; });

    return pending;
}
