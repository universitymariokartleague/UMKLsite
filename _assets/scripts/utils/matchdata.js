export { getMatchData, normalizeMatchData, getMatchCache, setMatchCache };

const CACHE_KEY = 'matchDataCache';

const getMatchCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; } };
const setMatchCache = (data) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { } };

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
