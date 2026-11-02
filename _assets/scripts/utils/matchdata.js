import { getCache, setCache } from '/_assets/scripts/utils/cache.js';

export { getMatchData, normalizeMatchData, getMatchCache, setMatchCache };

const CACHE_KEY = 'matchDataCache';

const getMatchCache = () => {
    const data = getCache(CACHE_KEY);
    return data && typeof data === 'object' ? data : null;
};
const setMatchCache = (data) => { setCache(CACHE_KEY, data); };

let inflightFetch = null;

function getMatchData() {
    if (!inflightFetch) {
        inflightFetch = fetch('https://api.umkl.co.uk/matchdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: "{}"
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
            localStorage.setItem("apiReqsSent", apiReqsSent + 1);
            return response.json();
        }).finally(() => { inflightFetch = null; });
    }
    return inflightFetch;
}

function normalizeMatchData(matchData) {
    const flat = [];
    Object.keys(matchData).forEach(dateKey => {
        matchData[dateKey].forEach(entry => {
            flat.push({ ...entry, matchDate: dateKey });
        });
    });
    return flat;
}
