/*
    This script generates the team boxes on the teams page. These boxes display
    information about each team, including their team name, logo, position, points,
    and institution. The script fetches data from the API and creates the
    HTML elements dynamically. It also handles caching of the data to improve performance.
*/

const teamBoxFormatHTML = `
    <button onClick="location.href='pages/teams/{{linkName}}/'" class="{{className}} teamBox">
        <div class="positionBox">
            <div class="team-position">{{position}}</div>
            <div class="team-points">
                <div class="points-value">{{points}} PTS</div>
            </div>
        </div>
        <hr>
        <div class="{{className}} team">
            <span>{{teamName}}</span>
            <img src="{{logoSrc}}" alt="{{teamName}} team logo" class="team-logo">
        </div>
        <hr>
        <div class="institution">{{institution}}</div>
    </button>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const JSTeamBoxLoading = document.getElementById("JSTeamBoxLoading")
const styleSheet = document.createElement("style");
const seasonPicker = document.getElementById("season-select")
const currentSeasonText = document.getElementById("current-season")

let listView = localStorage.getItem("teamsListView") == 1 || false;

let teamData = [];
const startYear = 2023;
let currentSeason = 2;
let maxSeason = 2;

let startTime;

async function loadFont(name, url) {
    const font = new FontFace(name, `url(${url})`);
    await font.load();
    document.fonts.add(font);
    return font;
}

async function generateTeamBox(team) {
    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
        .replaceAll("{{className}}", team.class_name)
        .replaceAll("{{teamColor}}", team.team_color);

    styleSheet.innerText += teamBoxStyle;

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{position}}", team.season_position)
        .replace("{{points}}", team.team_season_points )
        .replaceAll("{{teamName}}", team.team_name)
        .replace("{{institution}}", team.team_full_name)
        .replaceAll("{{className}}", team.class_name)
        .replace("{{linkName}}", team.link_name)
        .replace("{{logoSrc}}", team.logo_src)
        .replace("{{teamlogoopacity}}", 1);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tempTeamBox;

    JSTeamBox.appendChild(tempDiv);
}

async function generateTeamBoxes(teamData) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.add('fade-in');
    listView = localStorage.getItem("teamsListView") == 1 || false;

    for (let i = 0; i < teamData.length; i++) {
        const team = teamData[i];
        team.logo_src = `assets/image/teamemblems/${team.team_name.toUpperCase()}.png`
        team.class_name = team.team_name.replace(/\s+/g, '')
        team.link_name = team.team_name.replace(/\s+/g, '-').toLowerCase()
    }

    if (listView) {
        let experimentalListView = localStorage.getItem("experimentalListView") == 1 || false;
        if (!experimentalListView) {
            JSTeamBox.classList.remove('teamBoxContainer');

            const table = document.createElement('table');
            table.classList.add("team-list-view-table")
            
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['POS', 'TEAM', "MATCHES", 'W - L', 'PTS'].forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            teamData.forEach(async team => {
                const row = document.createElement('tr');
                row.style.backgroundColor = team.team_color;
                row.style.color = "#FFF";

                row.addEventListener('click', () => {
                    window.location.href = `pages/teams/${team.link_name}/`
                });

                row.setAttribute('tabindex', '0');
                row.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        window.location.href = `pages/teams/${team.link_name}/`
                    }
                });

                row.setAttribute('role', 'button');
                row.setAttribute('aria-label', `View ${team.team_name} details`);
                
                [
                    team.season_position, 
                    `<div class="team-name-grid-flex">
                        <img src="${team.logo_src}" alt="${team.team_name} team logo" class="team-logo-grid">
                            <div class="team-text-flex">
                            <h3>${team.team_name}</h3>
                        <span class="team-list-full-institution">${team.team_full_name}</span>
                        </div>
                    </div>`, 
                    `${team.season_matches_played}`,
                    `${team.season_wins_losses[0]} - ${team.season_wins_losses[1]}`,
                    `${team.team_season_points}`,
                ].forEach(text => {
                    const td = document.createElement('td');
                    td.innerHTML = text;
                    td.classList.add("custom-selection");
                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            JSTeamBox.appendChild(table);
        } else {
            JSTeamBox.classList.remove('teamBoxContainer');

            const teamStandingsBox = document.createElement('div');
            teamStandingsBox.classList.add("teamStandingsBox")

            teamData.forEach(async team => {
                const matchesPlayed = team.season_matches_played

                const row = document.createElement('div');
                row.classList.add("teamStanding");

                row.addEventListener('click', () => {
                    window.location.href = `pages/teams/${team.link_name}/`
                });
                row.setAttribute('tabindex', '0');
                row.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        window.location.href = `pages/teams/${team.link_name}/`
                    }
                });

                row.innerHTML = `
                    <div class="teamPosition">${team.season_position}</div>
                    <div class="teamColour" style="background-color:${team.team_color}"></div>
                    <img class="teamLogo" src="${team.logo_src}" alt="${team.team_name} team logo">
                    <div class="teamName">${team.team_name.toUpperCase()}</div>
                    <div class="teamPointsArea">
                        <div class="teamPoints">${team.points_override ? team.points_override : (team.points ? team.points : "0")}</div>
                        <div class="teamStandings">${team.season_wins_losses[0]} - ${team.season_wins_losses[1]} (${matchesPlayed} MATCH${matchesPlayed == 1 ? "" : "ES"})</div>
                    </div>
                `

                teamStandingsBox.appendChild(row);
            });

            JSTeamBox.appendChild(teamStandingsBox);
        }
    } else {
        JSTeamBox.classList.add('teamBoxContainer');

        try {
            for (let i = 0; i < teamData.length; i++) {
                const team = teamData[i];
                generateTeamBox(team, i);
            }
            document.head.appendChild(styleSheet);
        } catch (error) {
            JSTeamBox.innerHTML = error.stack;
        }
    }
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
    console.debug(`%cteamboxgenerate.js %c> %cFetching seasoninfo from API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
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
        JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch team data from API, the below information may not be up to date!</blockquote>`;
        await getTeamdataFallback(season)
    }
}

async function getTeamdata(team = "", season) {
    console.debug(`%cteamboxgenerate.js %c> %cFetching teamdata from API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
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
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateListViewButton();
    await loadFont('SF-Pro-Display-Bold', 'assets/pythongraphics/fonts/SF-Pro/SF-Pro-Display-Bold.otf');
    
    try {
        currentSeason = parseInt(await getCurrentSeason());
        maxSeason = currentSeason
        teamData = await getTeamdata("", currentSeason);
        JSTeamBoxLoading.innerHTML = ""
    } catch (error) {
        console.debug(`%cteamboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        JSTeamBoxLoading.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch team data from API, the below information may not be up to date!</blockquote>`;
        await getTeamdataFallback(currentSeason);
    }

    generateSeasonPicker();
    updateSeasonText();

    generateTeamBoxes(teamData)
    console.debug(`%cteamboxgenerate.js %c> %cGenerated team data in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9452ff", "color:#fff", "color:#c29cff");
});

document.addEventListener('listViewChange', async () => {
    await getTeamdataSafe(currentSeason)
    updateButton();
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBoxes(teamData, false);
});

async function generateSeasonPicker() {
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
    await updateSeasonText();
    await getTeamdataSafe(currentSeason)
    generateTeamBoxes(teamData)
    // console.log(JSON.stringify(teamData))
});

async function updateSeasonText() {
    currentSeasonText.classList.add('fade-in');
    let seasonStatus = "";
    try {
        seasonStatus = (await getSeasonStatus(currentSeason))[1];
    } catch (error) {
        seasonStatus = "API error";
    }
    currentSeasonText.innerText = `${seasonStatus} (${(startYear + Number(currentSeason))}-${(startYear + 1 + Number(currentSeason))})`;
}

function updateButton() {
    const isListView = localStorage.getItem("teamsListView") == 1;
    listViewButton.innerHTML = `<span class="fa-solid ${isListView ? 'fa-table-cells-large' : 'fa-bars'}"></span> ${isListView ? 'Grid View' : 'List View'}`;
}

function generateListViewButton() {
    const listViewButton = document.getElementById("listViewButton");
    
    updateButton();
    
    listViewButton.onclick = () => {
        const isListView = localStorage.getItem("teamsListView") == 1;
        localStorage.setItem("teamsListView", isListView ? 0 : 1);
        updateButton();
        document.dispatchEvent(new CustomEvent('listViewChange'));
    };
}