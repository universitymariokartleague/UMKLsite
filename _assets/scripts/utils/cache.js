/* Versioned, guarded localStorage cache helpers. */

export { getCacheEntry, getCache, setCache, removeCache, isCacheFresh };

const CACHE_VERSION = 1;

function getCacheEntry(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (!entry || typeof entry !== 'object' || entry.version !== CACHE_VERSION || !('data' in entry)) return null;
        return entry;
    } catch {
        return null;
    }
}

function getCache(key) {
    const entry = getCacheEntry(key);
    return entry ? entry.data : null;
}

function setCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ version: CACHE_VERSION, savedAt: Date.now(), data }));
        return true;
    } catch {
        return false;
    }
}

function removeCache(key) {
    try { localStorage.removeItem(key); } catch { }
}

function isCacheFresh(entry, maxAgeMs) {
    if (!entry || typeof entry.savedAt !== 'number') return false;
    if (maxAgeMs == null) return true;
    return Date.now() - entry.savedAt <= maxAgeMs;
}
