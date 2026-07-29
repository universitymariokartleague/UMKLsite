/*
    This script generates a simple points standings table for each team in a given season.
*/

const JSTeamTable = document.getElementById("JSTeamTable");
const JSTeamTableLoading = document.getElementById("JSTeamTableLoading");
const seasonPicker = document.getElementById("season-select");
const currentSeasonText = document.getElementById("current-season");

const START_YEAR = 2023;
const API_BASE = 'https://api.umkl.co.uk';
const CACHE_KEY = 'teamDataCache';
const SEASON_CACHE_KEY = 'seasonInfoCache';

let teamData = [];
let currentSeason = 3;
let maxSeason = currentSeason;
let refreshTimer = null;
let retryCount = 0;


const fetchAPI = async (endpoint, body) => {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    localStorage.setItem("apiReqsSent", (parseInt(localStorage.getItem("apiReqsSent")) || 0) + 1);
    return response.json();
};

const getSeasonInfoCache = () => {
    try { return JSON.parse(localStorage.getItem(SEASON_CACHE_KEY)) || {}; } catch { return {}; }
};

const setSeasonInfoCache = (season, data) => {
    const cache = getSeasonInfoCache();
    cache[season] = data;
    localStorage.setItem(SEASON_CACHE_KEY, JSON.stringify(cache));
};

const fetchSeasonInfo = async (season = 0) => {
    console.debug(`%cteamstandings.js %c> %cFetching seasoninfo from API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetchAPI('seasoninfo', { season });
};

const fetchTeamData = async (season) => {
    console.debug(`%cteamstandings.js %c> %cFetching teamdata from API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetchAPI('teamdata', { team: "", season: `${season}` });
};

const makePossessive = name => !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

const showError = (message) => {
    if (JSTeamTableLoading) {
        JSTeamTableLoading.innerHTML = `<blockquote class="fail">${message}</blockquote>`;
    }
};

async function generateStandingsTable(data) {
    if (!JSTeamTable) return;

    JSTeamTable.innerHTML = "";
    JSTeamTable.classList.add('fade-in');

    // Sort teams descending by points
    const sortedData = data.slice().sort((a, b) => Number(b.team_season_points) - Number(a.team_season_points));

    // Calculate tie-aware positions (e.g. 1st, 1st, 3rd)
    const positionMap = new Map();
    let lastPoints = null, lastPosition = 0;
    for (let i = 0; i < sortedData.length; i++) {
        const pts = Number(sortedData[i].team_season_points);
        if (pts !== lastPoints) { 
            lastPosition = i + 1; 
            lastPoints = pts; 
        }
        positionMap.set(sortedData[i], lastPosition);
    }

    const table = document.createElement('table');
    table.className = 'standings-table';

    // Header
    table.innerHTML = `
        <thead>
            <tr>
                <th class="column-position">Pos</th>
                <th class="column-team">Team</th>
                <th class="column-played">Played</th>
                <th class="column-won">Won</th>
                <th class="column-drawn">Drawn</td>
                <th class="column-lost">Lost</th>
                <th class="column-points">Points</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement('tbody');

    for (const team of sortedData) {
        const name = team.team_name;
        const nameUpper = name.toUpperCase();
        const position = positionMap.get(team);
        const points = team.team_season_points ?? 0;
        const avif = `https://api.umkl.co.uk/teamemblems/${nameUpper}`;
        const png = `https://api.umkl.co.uk/teamemblems/${nameUpper}?og`;
        const dest = `pages/standings/details/?team=${encodeURIComponent(name)}`;

        const row = document.createElement('tr');
        row.className = 'standings-row';
        row.tabIndex = 0;
        
        row.addEventListener('click', () => window.location.href = dest);
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') window.location.href = dest;
        });

        row.innerHTML = `
            <td class="column-position">${position}</td>
            <td class="column-team">
                <div class="team-info">
                    <picture>
                        <source srcset="${avif}" type="image/avif">
                        <img class="team-logo" src="${png}" alt="${makePossessive(name)} emblem" loading="lazy">
                    </picture>
                    <span class="team-name" title="${team.team_full_name || name}">${name}</span>
                </div>
            </td>
            <td class="column-played">${team.season_matches_played}</td>
            <td class="column-won">${team.season_wins_losses[0]}</td>
            <td class="column-drawn">0</td>
            <td class="column-lost">${team.season_wins_losses[1]}</td>
            <td class="column-points"><strong>${points}</strong></td>
        `;

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    JSTeamTable.appendChild(table);
}


async function getTeamDataSafe(season) {
    try {
        teamData = await fetchTeamData(season);
        if (JSTeamTableLoading) JSTeamTableLoading.innerHTML = "";
    } catch {
        showError(`<b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!`);
    }
}

function scheduleRetry() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
        try {
            retryCount++;
            teamData = await fetchTeamData(currentSeason);
            if (JSTeamTableLoading) JSTeamTableLoading.innerHTML = "";
            await generateStandingsTable(teamData);
            generateSeasonPicker();
            updateSeasonText();
        } catch {
            showError(`<b>API error - Retrying: attempt ${retryCount}</b><br>Failed to fetch team data from the API!`);
            scheduleRetry();
        }
    }, 2000);
}


function generateSeasonPicker() {
    if (!seasonPicker) return;
    seasonPicker.innerHTML = "";
    for (let season = 1; season <= maxSeason; season++) {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = `20${String(START_YEAR + season).slice(-2)}/${String(START_YEAR + 1 + season).slice(-2)}`;
        option.selected = season === currentSeason;
        seasonPicker.appendChild(option);
    }
}

const handleSeasonChange = async () => {
    await getTeamDataSafe(currentSeason);
    await generateStandingsTable(teamData);
    await updateSeasonText();
};

seasonPicker?.addEventListener("change", function () {
    currentSeason = parseInt(this.value);
    handleSeasonChange();
});

async function updateSeasonText() {
    if (!currentSeasonText) return;

    const render = (status, matches) => {
        currentSeasonText.innerText = `${status} (${START_YEAR + currentSeason}-${String(START_YEAR + 1 + currentSeason).slice(-2)})`;
        if (matches) {
            const [c, t] = matches.split('/').map(Number);
            currentSeasonText.title = `${matches} (${Math.round((c / t) * 100)}%)`;
        } else {
            currentSeasonText.title = "";
        }
        currentSeasonText.classList.add('fade-in');
    };

    const cachedInfo = getSeasonInfoCache()[currentSeason];
    if (cachedInfo?.[1]) render(cachedInfo[1], cachedInfo[2] || "");

    try {
        const seasonInfo = await fetchSeasonInfo(currentSeason);
        setSeasonInfoCache(currentSeason, seasonInfo);
        render(seasonInfo[1], seasonInfo[2]);
    } catch {
        if (!cachedInfo?.[1]) render("Unknown...", "");
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    const startTime = performance.now();
    const cached = localStorage.getItem(CACHE_KEY);

    // Render cache immediately if available
    if (cached) {
        try {
            const parsedCache = JSON.parse(cached);
            if (parsedCache?.length > 0) {
                if (JSTeamTableLoading) JSTeamTableLoading.innerHTML = "";
                await generateStandingsTable(parsedCache);
            } else {
                localStorage.removeItem(CACHE_KEY);
            }
        } catch {
            localStorage.removeItem(CACHE_KEY);
        }
    }

    // Set fallback current season from cache
    const seasonInfoCache = getSeasonInfoCache();
    if (seasonInfoCache[0] != null) {
        const cachedSeasonNum = parseInt(seasonInfoCache[0]);
        if (!isNaN(cachedSeasonNum)) {
            currentSeason = cachedSeasonNum;
            maxSeason = currentSeason;
        }
    }

    // Fetch live data
    const [teamResult, seasonResult] = await Promise.allSettled([
        fetchTeamData(currentSeason),
        fetchSeasonInfo(0)
    ]);

    if (teamResult.status === 'fulfilled') {
        teamData = teamResult.value;
        if (JSTeamTableLoading) JSTeamTableLoading.innerHTML = "";
        await generateStandingsTable(teamData);
        console.debug(`%cteamstandings.js %c> %cUpdated standings loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9452ff", "color:#fff", "color:#c29cff");
        localStorage.setItem(CACHE_KEY, JSON.stringify(teamData));
    } else {
        const msg = teamResult.reason?.message;
        if (msg?.includes('429')) {
            showError(`<b>API error</b><br>You have been rate-limited. Please try again later.`);
        } else {
            showError(`<b>API error</b><br>Failed to fetch team data from the API!`);
            scheduleRetry();
        }
    }

    if (seasonResult.status === 'fulfilled') {
        setSeasonInfoCache(0, seasonResult.value);
        currentSeason = parseInt(seasonResult.value);
        maxSeason = currentSeason;
    }

    generateSeasonPicker();
    updateSeasonText();
});