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

const darkenColor = (color, percent = 20) => {
  if (!/^#?[0-9A-Fa-f]{6}$/.test(color)) return color;

  const num = parseInt(color.replace('#', ''), 16);
  let [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255].map(v => v / 255);

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  l = Math.max(0, l * (1 - percent / 100));

  const f = (n) => {
    const k = (n + (d === 0 ? 0 : (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4)) * 2) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };

  return `#${((1 << 24) + (f(0) << 16) + (f(8) << 8) + f(4)).toString(16).slice(1)}`;
};

const isLightColor = (color) => {
    if (!color) return false;
    const hex = color.trim().replace(/^#/, '');
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return false;
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 0xFF;
    const g = (num >> 8) & 0xFF;
    const b = num & 0xFF;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 172;
    };
    

const showError = (message) => {
    JSTeamBoxLoading.innerHTML = `<blockquote class="fail">${message}</blockquote>`;
};

const teamPickerButton = document.getElementById('teamPickerButton');
const teamPickerDialog = document.getElementById('teamPickerDialog');
const teamPickerClose = document.getElementById('teamPickerClose');
const teamPickerGrid = document.getElementById('teamPickerGrid');
const pickerSortSelect = document.getElementById('sortSelect');

const PICKER_SORT_KEY = 'teamPickerSortMode';
let pickerSortMode = localStorage.getItem(PICKER_SORT_KEY) || 'joined';
let allTeamsCache = null;

function sortPickerTeams(teams) {
    const sorted = teams.slice();

    if (pickerSortMode === 'alpha') {
        sorted.sort((a, b) => a.team_name.localeCompare(b.team_name));
    } else if (pickerSortMode === 'joined') {
        // The API already returns teams in join order, so no sorting is needed.
    } else {
        const dataByName = new Map(teamData.map(t => [t.team_name, t]));
        sorted.sort((a, b) => {
            const va = dataByName.get(a.team_name)?.season_position ?? Infinity;
            const vb = dataByName.get(b.team_name)?.season_position ?? Infinity;
            return (Number(va) - Number(vb)) || a.team_name.localeCompare(b.team_name);
        });
    }
    return sorted;
}

function renderTeamPickerGrid() {
    if (!teamPickerGrid || !allTeamsCache) return;

    teamPickerGrid.innerHTML = '';
    for (const team of sortPickerTeams(allTeamsCache)) {
        const nameUpper = team.team_name.toUpperCase();
        const link = document.createElement('a');
        link.className = 'team-picker-item';
        link.href = `pages/teams/details/?team=${encodeURIComponent(team.team_name)}`;
        link.style.setProperty('--team-color', team.team_color);
        link.innerHTML = `
            <picture>
                <source srcset="https://api.umkl.co.uk/teamemblems/${nameUpper}" type="image/avif">
                <img class="team-picker-icon" src="https://api.umkl.co.uk/teamemblems/${nameUpper}?og" alt="${makePossessive(team.team_name)} team emblem" loading="lazy" onload="this.style.opacity=1;">
            </picture>
            <span class="team-picker-name">${team.team_name}</span>
        `;
        teamPickerGrid.appendChild(link);
    }
}

let allTeamsFetchPromise = null;

async function populateTeamPicker() {
    if (!teamPickerGrid) return;

    if (!allTeamsCache) {
        if (!allTeamsFetchPromise) allTeamsFetchPromise = fetchAPI('teamcolors', {}).catch(() => []);
        allTeamsCache = await allTeamsFetchPromise;
        allTeamsFetchPromise = null;
        if (!allTeamsCache.length) {
            teamPickerGrid.innerHTML = '<span class="team-picker-loading">Failed to load teams.</span>';
            return;
        }
    }
    renderTeamPickerGrid();
}

if (pickerSortSelect) {
    pickerSortSelect.value = pickerSortMode;
    pickerSortSelect.addEventListener('change', function () {
        pickerSortMode = this.value;
        localStorage.setItem(PICKER_SORT_KEY, pickerSortMode);
        renderTeamPickerGrid();
    });
}

function closeTeamPickerDialog() {
    if (!teamPickerDialog.open || teamPickerDialog.classList.contains('closing')) return;
    teamPickerDialog.classList.add('closing');
    teamPickerDialog.addEventListener('animationend', () => {
        teamPickerDialog.classList.remove('closing');
        teamPickerDialog.close();
    }, { once: true });
}

teamPickerButton?.addEventListener('click', () => {
    populateTeamPicker();
    teamPickerDialog.showModal();
    // Prevent the browser from autofocusing the close button, which would
    // otherwise make it look permanently hovered.
    teamPickerDialog.focus();
});

teamPickerClose?.addEventListener('click', closeTeamPickerDialog);

teamPickerDialog?.addEventListener('click', (e) => {
    const rect = teamPickerDialog.getBoundingClientRect();
    const clickedInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!clickedInside) closeTeamPickerDialog();
});

teamPickerDialog?.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeTeamPickerDialog();
});

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

    const imgAttr = alreadyRendered ? 'style="opacity:1"' : 'onload="this.style.opacity=1"';
    const fragment = document.createDocumentFragment();
    const teamStandingsBox = document.createElement('div');
    teamStandingsBox.classList.add("teamStandingsBox");

    for (const team of data) {
        const name = team.team_name;
        const nameUpper = name.toUpperCase();
        const avif = `https://api.umkl.co.uk/teamemblems/${nameUpper}`;
        const png = `https://api.umkl.co.uk/teamemblems/${nameUpper}?og`;
        const dest = `pages/teams/details/?team=${name}`;

        const row = document.createElement('div');
        row.className = "teamStanding";
        row.setAttribute('tabindex', '0');
        if (team.team_color) row.style.backgroundImage = `linear-gradient(90deg, ${darkenColor(team.team_color)} 0%, ${team.team_color} 100%)`;
        row.style.color = team.team_color ? (isLightColor(team.team_color) ? 'black' : 'white') : '';
        row.addEventListener('click', () => window.location.href = dest);
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') window.location.href = dest;
        });

        row.innerHTML = `
            <div translate="no" class="teamName" title="${team.team_full_name}">${name}</div>
            <picture>
                <source srcset="${avif}" type="image/avif">
                <img class="teamLogo" src="${png}" alt="${makePossessive(name)} team emblem"
                ${imgAttr} loading="lazy"
                onload="this.style.opacity=1;">
            </picture>
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

    // pre-load the team picker
    populateTeamPicker();
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
        option.textContent = `20${String(START_YEAR + season).slice(-2)}/${String(START_YEAR + 1 + season).slice(-2)}`;
        option.selected = season === currentSeason;
        seasonPicker.appendChild(option);
    }
}

const handleSeasonChange = async () => {
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
