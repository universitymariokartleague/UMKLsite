/*
    This script generates the team boxes on the teams page. These boxes display
    information about each team, including their team name, logo, position, points,
    and institution. The script fetches data from the API and creates the
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

const fetchSeasonInfo = async (season = 0) => {
    console.debug(`%cteamboxgenerate.js %c> %cFetching seasoninfo from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetchAPI('seasoninfo', { season });
};

const fetchTeamData = async (season) => {
    console.debug(`%cteamboxgenerate.js %c> %cFetching teamdata from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    const data = await fetchAPI('teamdata', { team: "", season: `${season}` });
    JSTeamBoxLoading.innerHTML = "";
    return data;
};

const fetchFallback = async (season) => {
    const response = await fetch(`database/teamdatafallbacks${season}.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    localStorage.setItem("apiReqsSent", (parseInt(localStorage.getItem("apiReqsSent")) || 0) + 1);
    return response.json();
};

const makePossessive = name => !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

async function generateTeamBoxes(data, cached = false) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.add('fade-in');
    JSTeamBox.classList.remove('teamBoxContainer');

    const placeholderLogoAvif = "assets/media/teamemblems/DEFAULT.avif";
    const placeholderLogoPng = "assets/media/teamemblems/og/DEFAULT.png";
    const fragment = document.createDocumentFragment();
    const teamStandingsBox = document.createElement('div');
    teamStandingsBox.classList.add("teamStandingsBox");

    for (const team of data) {
        team.logo_src_avif = `assets/media/teamemblems/${team.team_name.toUpperCase()}.avif`;
        team.logo_src_png = `assets/media/teamemblems/og/${team.team_name.toUpperCase()}.png`;
        team.link_name = team.team_name;
    }

    for (const team of data) {
        const row = document.createElement('div');
        row.className = "teamStanding";
        row.setAttribute('tabindex', '0');
        row.addEventListener('click', () => window.location.href = `pages/teams/details?team=${team.link_name}`);
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                window.location.href = `pages/teams/details?team=${team.link_name}`;
            }
        });

        const opacityStyle = cached ? '' : 'onload="this.style.opacity=1"';
        row.innerHTML = `
            <div translate="no" class="teamPosition">${team.season_position}</div>
            <div class="teamColour" style="background-color:${team.team_color}"></div>
            <picture>
                <source srcset="${team.logo_src_avif}" type="image/avif">
                <img class="teamLogo" src="${team.logo_src_png}" alt="${makePossessive(team.team_name)} team emblem"
                ${opacityStyle} loading="lazy"
                onerror="this.onerror=null; this.src='${placeholderLogoPng}'; this.parentNode.querySelector('source').srcset='${placeholderLogoAvif}';">
            </picture>
            <div translate="no" class="teamName" title="${team.team_full_name}">${team.team_name}</div>
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
    } catch {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!</blockquote>`;
        teamData = await fetchFallback(season);
    }
}

const showError = (message) => {
    JSTeamBoxLoading.innerHTML = `<blockquote class="fail">${message}</blockquote>`;
};

const retryFetch = debounce(async () => {
    try {
        retryCount++;
        teamData = await fetchTeamData(currentSeason);
        await generateTeamBoxes(teamData);
        generateSeasonPicker();
        updateSeasonText();
    } catch {
        showError(`<b>API error - Retrying: attempt ${retryCount}</b><br>Failed to fetch team data from the API, the below information may not be up to date!`);
        refreshTimer = setTimeout(retryFetch, 2000);
    }
}, 2000);

document.addEventListener("DOMContentLoaded", async () => {
    const startTime = performance.now();
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
        try {
            JSTeamBoxLoading.innerHTML = "";
            console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes (cache)...`, "color:#9452ff", "color:#fff", "color:#c29cff");
            await generateTeamBoxes(JSON.parse(cached), true);
        } catch {
            localStorage.removeItem(CACHE_KEY);
        }
    }

    try {
        teamData = await fetchTeamData(currentSeason);
    } catch (error) {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        showError(`<b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!`);
        teamData = await fetchFallback(currentSeason);

        if (error.message?.includes('429')) {
            showError(`<b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.`);
        } else {
            retryFetch();
        }
    }

    await generateTeamBoxes(teamData);
    console.debug(`%cteamboxgenerate.js %c> %cGenerated updated team data in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9452ff", "color:#fff", "color:#c29cff");
    localStorage.setItem(CACHE_KEY, JSON.stringify(teamData));

    try {
        currentSeason = parseInt(await fetchSeasonInfo(0));
        maxSeason = currentSeason;
    } catch {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    }

    generateSeasonPicker();
    updateSeasonText();
});

document.addEventListener('listViewChange', async () => {
    await getTeamDataSafe(currentSeason);
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    await generateTeamBoxes(teamData, false);
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
    let seasonStatus = "Unknown...";
    let seasonMatchesCompleted = "";
    let seasonPercentage = "";
    try {
        let seasonInfo = await fetchSeasonInfo(currentSeason);
        seasonStatus = seasonInfo[1];
        seasonMatchesCompleted = seasonInfo[2];
        const [completed, total] = seasonMatchesCompleted.split('/').map(Number);
        seasonPercentage = `${Math.round((completed / total) * 100)}%`;
    } catch {
        // Keep default
    }
    currentSeasonText.innerText = `${seasonStatus} (${START_YEAR + currentSeason}-${START_YEAR + 1 + currentSeason})`;
    currentSeasonText.title = `${seasonMatchesCompleted} (${seasonPercentage})`;
    currentSeasonText.classList.add('fade-in');
}
