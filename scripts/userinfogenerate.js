/*
    This script generates a user's info page.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        <img src="{{PFP}}" alt="{{username}} profile picture" title="{{username}} profile picture" class="user-image"
        onload="this.style.opacity=1"/>
        <hr>
        <div class="team-info-text">
            {{extraFields}}
        </div>
        <div class="current-season-info">
            <div class="heading-wrapper" style="margin-left: 3px;">
                <h2>Season {{currentSeason}} Team Stats</h2>
                <div class="live-dot"></div>
            </div>
            <div class="team-info-text">
                {{currentFields}}
            </div>
        </div>
    </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const teamNameBox = document.getElementById("teamNameBox")
const startYear = 2023;

let playerData = [];
let teamData;
const currentSeason = 2;
let fetchedCurrentSeason = currentSeason;

const UPDATEINVERVAL = 30000;
let refreshTimer = null;

let startTime;

function buildUserInfoTable(data, isCurrent = false) {
    if (isCurrent) {
        return `
            <table class="team-info-table">
                <tr><td class="table-key">Wins/Losses</td><td>${data.season_wins_losses[0]} - ${data.season_wins_losses[1]} ${data.team_season_points > 0 ? `(${toOrdinal(data.season_position)})` : ''}</td></tr>
                <tr><td class="table-key">Matches Played</td><td>${data.season_matches_played}</td></tr>
                <tr><td class="table-key">Points</td><td>${data.team_season_points}</td></tr>
                <tr><td class="table-key">Penalties</td><td>${data.season_penalties}</td></tr>
            </table>`;
    }
    return `
        <table class="team-info-table">
            <tr><td class="table-key">Current Team</td><td>${data.team}</td></tr>
            <tr><td class="table-key">Matches Played</td><td>${data.tournament_entries}</td></tr>
            <tr><td class="table-key">Team Wins</td><td>${data.tournament_wins}</td></tr>
            <tr><td class="table-key">First Places (Podiums)</td><td>${data.first_places} (${data.podiums})</td></tr>
            <tr><td class="table-key">Highest Finish (Podiums)</td><td>${data.first_places} (${data.podiums})</td></tr>
        </table>`;
}

async function generateUserBox(userData, showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    try {
        teamData = (await getTeamdata(userData.team, fetchedCurrentSeason))[0]
    } catch (error) {
        console.debug(`%cuserinfogenerate.js %c> %c${userData.username} does not belong to a team`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    }

    document.title = `${makePossessive(userData.username)} Stats | University Mario Kart League`;
    teamNameBox.innerText = `${makePossessive(userData.username)} Stats`;

    let currentFields = `${userData.username} doesn't belong to a team!`

    const extraFields = buildUserInfoTable(userData);
    if (teamData) currentFields = buildUserInfoTable(teamData, true);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{PFP}}", userData.profile_picture.replace("png", "webp"))
        .replaceAll("{{username}}", makePossessive(userData.username))
        .replace("{{currentSeason}}", fetchedCurrentSeason)
        .replace("{{currentFields}}", currentFields)
        .replace("{{extraFields}}", extraFields);

    if (teamData) {
        document.documentElement.style.setProperty('--highlight-color', `${teamData.team_color}80`);
    }
    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');

    if (teamData) {
        (function injectLiveDotStyle() {
            const style = document.createElement('style');
            style.textContent = `
                .live-dot {
                    background-color: ${teamData.team_color};
                    box-shadow: 0 0 0 0 ${teamData.team_color}80;
                }
                @keyframes live-dot-pulse {
                    0% {
                        box-shadow: 0 0 0 0 ${teamData.team_color}80;
                    }
                    70% {
                        box-shadow: 0 0 0 8px ${teamData.team_color}00;
                    }
                    100% {
                        box-shadow: 0 0 0 0 ${teamData.team_color}00;
                    }
                }
            `;
            document.head.appendChild(style);
        })();
    }

    showErrorBox(showError);
}

function makePossessive(name) {
    if (!name) return '';
    if (name.endsWith('s') || name.endsWith('S')) {
        return `${name}'`;
    }
    return `${name}'s`;
}

async function editUserBox(userData) {
    const currentSeasonInfo = JSTeamBox.querySelector('.current-season-info .team-info-text');
    const extraFieldsInfo = JSTeamBox.querySelector('.team-info-text');
    if (!currentSeasonInfo || !extraFieldsInfo) return;

    extraFieldsInfo.innerHTML = buildUserInfoTable(userData);
    currentSeasonInfo.innerHTML = buildUserInfoTable(teamData, true);
}

function showErrorBox(showError) {
    let errorBlock = document.getElementById("team-api-error");
    const mainElem = document.querySelector("main");

    if (showError === 1 || showError === 2) {
        if (!errorBlock) {
            errorBlock = document.createElement("blockquote");
            errorBlock.className = "fail";
            errorBlock.id = "team-api-error";
            if (mainElem) mainElem.appendChild(errorBlock);
        }
        if (showError === 1) {
            const retryMsg = window.retryCount ? `<b>API error - Retrying: attempt ${window.retryCount}</b><br>` : "<b>API error</b><br>";
            errorBlock.innerHTML = `${retryMsg}Failed to fetch user data from the API, the below information may not be up to date!`;
        } else {
            errorBlock.innerHTML = "<b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.";
        }
    } else if (errorBlock) {
        errorBlock.remove();
    }
}

function toOrdinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    switch (v % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
    }
}

async function getPlayerdata(ID = "") {
    const response = await fetch('https://api.umkl.co.uk/playerdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ID })
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { error: `HTTP error! status: ${response.status}` };
        }
        throw errorData;
    }

    return response.json();
}

async function getPlayerdataFallback(playerID) {
    const response = await fetch(`database/playerdatafallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const allTeams = await response.json();
    return allTeams.filter(team => team.team_name === playerID);
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

async function getTeamdata(team, season) {
    console.debug(`%cuserinfogenerate.js %c> %cFetching playerdata from the API...`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
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

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cuserinfogenerate.js %c> %cGenerating player info box`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    JSTeamBox.innerHTML = "Loading team information...";

    let showError = 0;
    const urlParams = new URLSearchParams(window.location.search);
    let playerID = urlParams.get('ID');

    try {
        playerData = await getPlayerdata(playerID);
        fetchedCurrentSeason = parseInt(await getCurrentSeason());
    } catch (error) {
        console.error(error)
        if (error?.error === "Player not found") {
            window.location.href = "/pages/players/";
        }

        console.debug(`%cuserinfogenerate.js %c> %cAPI failed - using fallback information...`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
        playerData = await getPlayerdataFallback(playerID);
        showError = 1;

        if (error && error.message && error.message.includes('429')) {
            showError = 2;
        } else {
            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    if (typeof retryCount === 'undefined') {
                        window.retryCount = 1;
                    } else {
                        window.retryCount++;
                    }
                    playerData = await getPlayerdata(playerID);
                    fetchedCurrentSeason = parseInt(await getCurrentSeason());
                    showError = 0;
                    await generateUserBox(playerData, showError);
                } catch (err) {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generateUserBox(playerData, showError);

    if (refreshTimer) clearTimeout(refreshTimer);
    const updateFetch = async () => {
        try {
            if (typeof retryCount === 'undefined') {
                window.retryCount = 1;
            } else {
                window.retryCount++;
            }
            console.debug(`%cuserinfogenerate.js %c> %cRefreshing live data...`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
            playerData = await getPlayerdata(playerID);
            fetchedCurrentSeason = parseInt(await getCurrentSeason());
            showError = 0;
            await editUserBox(playerData);
            showErrorBox(showError);
        } catch (error) {
            showError = 1;
            if (error && error.message && error.message.includes('429')) {
                showError = 2;
            }
            showErrorBox(showError);
        } finally {
            refreshTimer = setTimeout(updateFetch, UPDATEINVERVAL);
        }
    };
    refreshTimer = setTimeout(updateFetch, UPDATEINVERVAL);

    console.debug(`%cuserinfogenerate.js %c> %cGenerated user info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
});