/*
    This script generates the team boxes on the teams page. These boxes display
    information about each team, including their team name, logo, position,
    and points. The script fetches data from the API and creates the
    HTML elements dynamically. It also handles caching of the data to improve performance.
*/
const JSTeamBox = document.getElementById("JSTeamBox");
const JSTeamBoxLoading = document.getElementById("JSTeamBoxLoading");
const seasonPicker = document.getElementById("season-select");
const currentSeasonText = document.getElementById("current-season");

const START_YEAR = 2023;
const API_BASE = 'https://api.umkl.co.uk';
const CACHE_KEY = 'teamDataCache';
const SEASON_CACHE_KEY = 'seasonInfoCache';

let teamData = [];
let currentSeason = 2;
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
    console.debug(`%cteamboxgenerate.js %c> %cFetching seasoninfo from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetchAPI('seasoninfo', { season });
};

const fetchTeamData = async (season) => {
    console.debug(`%cteamboxgenerate.js %c> %cFetching teamdata from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetchAPI('teamdata', { team: "", season: `${season}` });
};

const makePossessive = name => !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

const showError = (message) => {
    JSTeamBoxLoading.innerHTML = `<blockquote class="fail">${message}</blockquote>`;
};

async function generateTeamBoxes(data) {
    const alreadyRendered = JSTeamBox.children.length > 0;
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.add('fade-in');
    JSTeamBox.classList.remove('teamBoxContainer');

    // Compute tie-aware positions without mutating data
    const positionMap = new Map();
    const sorted = data.slice().sort((a, b) => Number(b.team_season_points) - Number(a.team_season_points));
    let lastPoints = null, lastPosition = 0;
    for (let i = 0; i < sorted.length; i++) {
        const pts = Number(sorted[i].team_season_points);
        if (pts !== lastPoints) { lastPosition = i + 1; lastPoints = pts; }
        positionMap.set(sorted[i], lastPosition);
    }

    const placeholderLogoAvif = "assets/media/teamemblems/DEFAULT.avif";
    const placeholderLogoPng = "assets/media/teamemblems/og/DEFAULT.png";
    const imgAttr = alreadyRendered ? 'style="opacity:1"' : 'onload="this.style.opacity=1"';
    const fragment = document.createDocumentFragment();
    const teamStandingsBox = document.createElement('div');
    teamStandingsBox.classList.add("teamStandingsBox");

    for (const team of data) {
        const name = team.team_name;
        const nameUpper = name.toUpperCase();
        const avif = `assets/media/teamemblems/${nameUpper}.avif`;
        const png = `assets/media/teamemblems/og/${nameUpper}.png`;
        const dest = `pages/teams/details/?team=${name}`;

        const row = document.createElement('div');
        row.className = "teamStanding" + (team.championship_seasons?.includes(currentSeason) ? " champion-standing" : "");
        row.setAttribute('tabindex', '0');
        row.addEventListener('click', () => window.location.href = dest);
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') window.location.href = dest;
        });

        row.innerHTML = `
            <div translate="no" class="teamPosition">${positionMap.get(team) ?? team.season_position}</div>
            <div class="teamColour" style="background-color:${team.team_color}"></div>
            <picture>
                <source srcset="${avif}" type="image/avif">
                <img class="teamLogo" src="${png}" alt="${makePossessive(name)} team emblem"
                ${imgAttr} loading="lazy"
                onerror="this.onerror=null; this.src='${placeholderLogoPng}'; this.parentNode.querySelector('source').srcset='${placeholderLogoAvif}';">
            </picture>
            <div translate="no" class="teamName" title="${team.team_full_name}">${name}</div>
            <div translate="no" class="teamPointsArea">
                <div class="teamPoints">${team.team_season_points}</div>
                <div class="teamStandings">${team.season_wins_losses[0]} - ${team.season_wins_losses[1]} (${team.season_matches_played})</div>
            </div>
        `;
        fragment.appendChild(row);
    }

    teamStandingsBox.appendChild(fragment);
    JSTeamBox.appendChild(teamStandingsBox);
}

async function getTeamDataSafe(season) {
    try {
        teamData = await fetchTeamData(season);
        JSTeamBoxLoading.innerHTML = "";
    } catch {
        JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!</blockquote>`;
    }
}

function scheduleRetry() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
        try {
            retryCount++;
            teamData = await fetchTeamData(currentSeason);
            JSTeamBoxLoading.innerHTML = "";
            await generateTeamBoxes(teamData);
            generateSeasonPicker();
            updateSeasonText();
        } catch {
            showError(`<b>API error - Retrying: attempt ${retryCount}</b><br>Failed to fetch team data from the API, the below information may not be up to date!`);
            scheduleRetry();
        }
    }, 2000);
}

document.addEventListener("DOMContentLoaded", async () => {
    const startTime = performance.now();
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
        try {
            const parsedCache = JSON.parse(cached);
            if (parsedCache?.length > 0) {
                JSTeamBoxLoading.innerHTML = "";
                console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes (cache)...`, "color:#9452ff", "color:#fff", "color:#c29cff");
                await generateTeamBoxes(parsedCache);
            } else {
                localStorage.removeItem(CACHE_KEY);
            }
        } catch {
            localStorage.removeItem(CACHE_KEY);
        }
    }

    const seasonInfoCache = getSeasonInfoCache();
    if (seasonInfoCache[0] != null) {
        const cachedSeasonNum = parseInt(seasonInfoCache[0]);
        if (!isNaN(cachedSeasonNum)) {
            currentSeason = cachedSeasonNum;
            maxSeason = currentSeason;
        }
    }

    const [teamResult, seasonResult] = await Promise.allSettled([
        fetchTeamData(currentSeason),
        fetchSeasonInfo(0)
    ]);

    if (teamResult.status === 'fulfilled') {
        teamData = teamResult.value;
        JSTeamBoxLoading.innerHTML = "";
        await generateTeamBoxes(teamData);
        console.debug(`%cteamboxgenerate.js %c> %cGenerated updated team data in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9452ff", "color:#fff", "color:#c29cff");
        localStorage.setItem(CACHE_KEY, JSON.stringify(teamData));
    } else {
        const msg = teamResult.reason?.message;
        if (msg?.includes('429')) {
            showError(`<b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.`);
        } else {
            showError(`<b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!`);
            scheduleRetry();
        }
        JSTeamBox.classList.add('fade-in');
    }

    if (seasonResult.status === 'fulfilled') {
        setSeasonInfoCache(0, seasonResult.value);
        currentSeason = parseInt(seasonResult.value);
        maxSeason = currentSeason;
    } else {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    }

    generateSeasonPicker();
    updateSeasonText();
});

document.addEventListener('listViewChange', async () => {
    await getTeamDataSafe(currentSeason);
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    await generateTeamBoxes(teamData);
});

function generateSeasonPicker() {
    seasonPicker.innerHTML = "";
    for (let season = 1; season <= maxSeason; season++) {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = `Season ${season}`;
        option.selected = season === currentSeason;
        seasonPicker.appendChild(option);
    }
}

const handleSeasonChange = async () => {
    JSTeamBox.classList.remove('fade-in');
    currentSeasonText.classList.remove('fade-in');
    await getTeamDataSafe(currentSeason);
    await generateTeamBoxes(teamData);
    await updateSeasonText();
};

seasonPicker.addEventListener("change", function () {
    currentSeason = parseInt(this.value);
    handleSeasonChange();
});

async function updateSeasonText() {
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
