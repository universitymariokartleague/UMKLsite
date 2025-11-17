/*
    This script generates the team boxes on the teams page. These boxes display
    information about each team, including their team name, logo, position, points,
    and institution. The script fetches data from the API and creates the
    HTML elements dynamically. It also handles caching of the data to improve performance.
*/
function generateTeamHTML(team, cached = false) {
    return `
        <button onClick="location.href='pages/teams/details?team=${team.link_name}'" class="${team.class_name} teamBox">
            <div class="positionBox">
                <div class="team-position">${team.season_position}</div>
                <div class="team-points" translate="no">
                    <div class="points-value">${team.team_season_points} PTS</div>
                </div>
            </div>
            <hr>
            <div class="${team.class_name} team">
                <span translate="no">${team.team_name}</span>
                <img src="${team.logo_src}" alt="${makePossessive(team.team_name)} team logo" class="team-logo"
                ${cached ? '' : `onload="this.style.opacity=1"`} loading="lazy"
                onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';"/>
            </div>
            <hr>
            <div class="institution">${team.team_full_name}</div>
        </button>
    `;
}

const JSTeamBox = document.getElementById("JSTeamBox")
const JSTeamBoxLoading = document.getElementById("JSTeamBoxLoading")
const styleSheet = document.createElement("style");
const seasonPicker = document.getElementById("season-select")
const currentSeasonText = document.getElementById("current-season")

let teamData = [];
const startYear = 2023;
let currentSeason = 2;
let maxSeason = currentSeason;

let refreshTimer = null;

let startTime;

async function loadFont(name, url) {
    const font = new FontFace(name, `url(${url})`);
    await font.load();
    document.fonts.add(font);
    return font;
}

function generateTeamBox(team, cached = false) {
    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
        .replaceAll("{{className}}", team.class_name)
        .replaceAll("{{teamColor}}", team.team_color);

    styleSheet.innerText += teamBoxStyle;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateTeamHTML(team, cached);

    return tempDiv;
}

async function generateTeamBoxes(teamData, cached = false) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.add('fade-in');
    const gridView = localStorage.getItem("teamsGridView") == 1 || false;
    const placeholderLogo = "assets/media/teamemblems/DEFAULT.avif";

    for (let i = 0; i < teamData.length; i++) {
        const team = teamData[i];
        team.logo_src = `assets/media/teamemblems/${team.team_name.toUpperCase()}.avif`
        team.class_name = team.team_name.replace(/\s+/g, '')
        team.link_name = team.team_name
    }

    if (gridView) {
        JSTeamBox.classList.add('teamBoxContainer');
        const fragment = document.createDocumentFragment();
        try {
            for (let i = 0; i < teamData.length; i++) {
                const team = teamData[i];
                fragment.appendChild(generateTeamBox(team, cached));
            }
            document.head.appendChild(styleSheet);
        } catch (error) {
            JSTeamBox.innerHTML = error.stack;
        }
        JSTeamBox.appendChild(fragment);
    } else {
        JSTeamBox.classList.remove('teamBoxContainer');

        const teamStandingsBox = document.createElement('div');
        teamStandingsBox.classList.add("teamStandingsBox");

        const fragment = document.createDocumentFragment();

        teamData.forEach(team => {
            const matchesPlayed = team.season_matches_played;

            const row = document.createElement('div');
            row.classList.add("teamStanding");

            row.addEventListener('click', () => {
                window.location.href = `pages/teams/details?team=${team.link_name}`;
            });
            row.setAttribute('tabindex', '0');
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    window.location.href = `pages/teams/details?team=${team.link_name}`;
                }
            });

            row.innerHTML = `
                <div translate="no" class="teamPosition">${team.season_position}</div>
                <div class="teamColour" style="background-color:${team.team_color}"></div>
                <img class="teamLogo" src="${team.logo_src}" alt="${makePossessive(team.team_name)} team emblem"
                ${cached ? '' : `onload="this.style.opacity=1"`} loading="lazy"
                onerror="this.onerror=null; this.src='${placeholderLogo}';"/>
                <div translate="no" class="teamName" title="${team.team_full_name}">${team.team_name}</div>
                <div translate="no" class="teamPointsArea">
                    <div class="teamPoints">${team.team_season_points}</div>
                    <div class="teamStandings">${team.season_wins_losses[0]} - ${team.season_wins_losses[1]} (${matchesPlayed})</div>
                </div>
            `;

            fragment.appendChild(row);
        });

        teamStandingsBox.appendChild(fragment);
        JSTeamBox.appendChild(teamStandingsBox);
    }
}

function makePossessive(name) {
    if (!name) return '';
    if (name.endsWith('s') || name.endsWith('S')) {
        return `${name}'`;
    }
    return `${name}'s`;
}

async function getCurrentSeason() {
    return fetch('https://api.umkl.co.uk/seasoninfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            season: 0
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

async function getSeasonStatus(season = 0) {
    console.debug(`%cteamboxgenerate.js %c> %cFetching seasoninfo from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetch('https://api.umkl.co.uk/seasoninfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            season: season
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

async function getTeamdataSafe(season) {
    try {
        teamData = await getTeamdata("", currentSeason); 
    } catch (error) {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!</blockquote>`;
        await getTeamdataFallback(season)
    }
}

async function getTeamdata(team = "", season) {
    console.debug(`%cteamboxgenerate.js %c> %cFetching teamdata from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetch('https://api.umkl.co.uk/teamdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            team: `${team}`,
            season: `${season}`
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        JSTeamBoxLoading.innerHTML = ""
        return response.json();
    });
}

async function getTeamdataFallback(season) {
    await fetch(`database/teamdatafallbacks${season}.json`)
    .then(async response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        teamData = await response.json();
    })
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    generateListViewButton();
    await loadFont('SF-Pro-Display-Bold', 'assets/font/SF-Pro-Display-Bold.woff2');
    
    if (localStorage.teamDataCache) {
        JSTeamBoxLoading.innerHTML = ""
        console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes (cache)...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        await generateTeamBoxes(JSON.parse(localStorage.teamDataCache), true)
    }

    try {
        teamData = await getTeamdata("");
    } catch (error) {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!</blockquote>`;
        await getTeamdataFallback(currentSeason);

        if (error && error.message && error.message.includes('429')) {
            JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.</blockquote>`;
        } else {
            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    if (typeof retryCount === 'undefined') {
                        window.retryCount = 1;
                    } else {
                        window.retryCount++;
                    }
                    teamData = await getTeamdata("");
                    await generateTeamBoxes(teamData)
                    generateSeasonPicker();
                    updateSeasonText();
                } catch (err) {
                    JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${window.retryCount}</b><br>Failed to fetch team data from the API, the below information may not be up to date!</blockquote>`;
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    
    await generateTeamBoxes(teamData);
    console.debug(`%cteamboxgenerate.js %c> %cGenerated updated team data in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9452ff", "color:#fff", "color:#c29cff");
    localStorage.setItem("teamDataCache", JSON.stringify(teamData));

    try {
        currentSeason = parseInt(await getCurrentSeason());
        maxSeason = currentSeason
    } catch {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    }

    generateSeasonPicker();
    updateSeasonText();
});

document.addEventListener('listViewChange', async () => {
    await getTeamdataSafe(currentSeason)
    updateButton();
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes...`, "color:#9452ff", "color:#fff", "color:#c29cff");    
    await generateTeamBoxes(teamData, false);
});

function generateSeasonPicker() {
    seasonPicker.innerHTML = ""; // Clear existing options
    for (let season = 1; season <= maxSeason; season++) {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = `Season ${season}`;
        if (season === currentSeason) {
            option.selected = true;
        }
        seasonPicker.appendChild(option);
    }
}

seasonPicker.addEventListener("change", async function () {
    JSTeamBox.classList.remove('fade-in');
    currentSeasonText.classList.remove('fade-in');
    currentSeason = parseInt(this.value);
    await getTeamdataSafe(currentSeason)
    await generateTeamBoxes(teamData)
    await updateSeasonText();
});

async function updateSeasonText() {
    let seasonStatus = "";
    try {
        seasonStatus = (await getSeasonStatus(currentSeason))[1];
    } catch (error) {
        seasonStatus = "Unknown...";
    }
    currentSeasonText.innerText = `${seasonStatus} (${(startYear + Number(currentSeason))}-${(startYear + 1 + Number(currentSeason))})`;
    currentSeasonText.classList.add('fade-in');
}

function updateButton() {
    const isGridView = localStorage.getItem("teamsGridView") == 1;
    listViewButton.innerHTML = `<span class="fa-solid ${isGridView ? 'fa-bars' : 'fa-table-cells-large'}"></span> ${isGridView ? 'List View' : 'Grid View'}`;
}

function generateListViewButton() {
    const listViewButton = document.getElementById("listViewButton");
    
    updateButton();
    
    listViewButton.onclick = () => {
        const isListView = localStorage.getItem("teamsGridView") == 1;
        localStorage.setItem("teamsGridView", isListView ? 0 : 1);
        updateButton();
        document.dispatchEvent(new CustomEvent('listViewChange'));
    };
}