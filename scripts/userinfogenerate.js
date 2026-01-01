/*
    This script generates a user's info page.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper user-info-wrapper">
        <img src="{{PFP}}" alt="{{username}} profile picture" title="{{username}} profile picture" class="user-image"
        onload="this.style.opacity=1" onerror="this.onerror=null; this.src='assets/media/faq/defaultavatar.avif';"/>
        <hr>
        <div class="team-info-text">
            {{extraFields}}
        </div>
        <div class="current-season-info">
            <div class="heading-wrapper" style="margin-left: 3px;">
                <div style="margin-bottom: 5px;">
                    <h2>{{currentTeam}} Stats</h2>
                    <p class="p-below-title">Season {{currentSeason}}</p>
                </div>
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

let matchData, teamData;
const currentSeason = 2;
let fetchedCurrentSeason = currentSeason;

let refreshTimer = null;

let startTime;

function findMatchByEventID(eventID) {
    for (const date in matchData) {
        const matches = matchData[date];
        if (!Array.isArray(matches)) continue;

        const found = matches.find(match => match.eventID === eventID);
        if (found) {
            return { date, match: found };
        }
    }
    return null;
}

function formatDetailedPoints(matches_info) {
    return matches_info
        .map(match_info => {
            const found = findMatchByEventID(match_info.eventID);
            const { date, match } = found;
            return `<a href="pages/matches/?date=${date}">${match.title}</a> - ${match_info.points} points`;
        })
        .join(`,<br>`);
}

function buildUserInfoTable(data, isCurrent = false) {
    if (isCurrent) {
        return `
            <table class="team-info-table">
                <tr><td class="table-key">Wins/Losses (Position)</td><td>${data.season_wins_losses[0]} - ${data.season_wins_losses[1]} ${data.team_season_points > 0 ? `(${toOrdinal(data.season_position)})` : ''}</td></tr>
                <tr><td class="table-key">Matches Played</td><td>${data.season_matches_played}</td></tr>
                <tr><td class="table-key">Points (Penalties)</td><td>${data.team_season_points} (${data.season_penalties})</td></tr>
            </table>`;
    }
    return `
        <table class="team-info-table">
            <tr><td class="table-key">Current Team</td><td>${data.team}</td></tr>
            <tr><td class="table-key">Team Wins</td><td>${data.team_wins}</td></tr>
            <tr><td class="table-key">Matches Played</td><td>${data.matches_played}</td></tr>
            <tr><td class="table-key">First Places (Podiums)</td><td>${data.first_places}</td></tr>
            <tr><td class="table-key">Highest Finish</td><td>${data.highest_finish}</td></tr>
            <tr><td class="table-key">Career Points</td><td>${data.career_points} <details class="details-box"><summary>Detailed results</summary><p class="p-below-title">${formatDetailedPoints(data.match_data)}</p></details></td></tr>
            <tr><td class="table-key">SP</td><td>${data.sp}</td></tr>
        </table>`;
}

function fillInPageTitle(data) {
    document.title = `${makePossessive(data.username)} Stats | UMKL`;
    teamNameBox.innerText = `${makePossessive(data.username)} Stats`;
}

async function generatePlayerStatsBox(data, showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    try {
        teamData = (await getTeamdata(data.team, fetchedCurrentSeason))[0]
    } catch (error) {
        console.debug(`%cuserinfogenerate.js %c> %c${data.username} does not belong to a team`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    }

    let currentFields = `${data.username} doesn't belong to a team!`

    const extraFields = buildUserInfoTable(data);
    if (teamData) currentFields = buildUserInfoTable(teamData, true);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{PFP}}", data.pfp.replace("png", "webp"))
        .replaceAll("{{username}}", makePossessive(data.username))
        .replace("{{currentTeam}}", data.team)
        .replace("{{currentSeason}}", fetchedCurrentSeason)
        .replace("{{currentFields}}", currentFields)
        .replace("{{extraFields}}", extraFields);

    if (teamData) {
        document.documentElement.style.setProperty('--highlight-color', `#${data.color}80`);
    }
    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');

    (function injectLiveDotStyle() {
        const style = document.createElement('style');
        style.textContent = `
            .live-dot {
                background-color: #${data.color};
                box-shadow: 0 0 0 0 #${data.color}80;
            }
            @keyframes live-dot-pulse {
                0% {
                    box-shadow: 0 0 0 0 #${data.color}80;
                }
                70% {
                    box-shadow: 0 0 0 8px #${data.color}00;
                }
                100% {
                    box-shadow: 0 0 0 0 #${data.color}00;
                }
            }
        `;
        document.head.appendChild(style);
    })();

    showErrorBox(showError);
}

const makePossessive = name =>
    !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

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
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

async function getMatchData() {
    return fetch('https://api.umkl.co.uk/matchdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: "{}"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

async function getMatchDataFallback() {
    const response = await fetch(`database/matchdatafallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    matchData = await response.json();
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
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cuserinfogenerate.js %c> %cGenerating player info box`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    JSTeamBox.innerHTML = "Loading team information...";

    let showError = 0;
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('d')) window.location.href = "/";
    const compressed = urlParams.get('d');
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    const data = JSON.parse(json);
    fillInPageTitle(data)

    try {
        matchData = await getMatchData();
        fetchedCurrentSeason = parseInt(await getCurrentSeason());
    } catch (error) {
        console.debug(`%cuserinfogenerate.js %c> %cAPI failed - retrying...`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
        await getMatchDataFallback();
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
                    fetchedCurrentSeason = parseInt(await getCurrentSeason());
                    matchData = await getMatchData();
                    showError = 0;
                    await generatePlayerStatsBox(data, showError);
                } catch (err) {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generatePlayerStatsBox(data, showError);

    console.debug(`%cuserinfogenerate.js %c> %cGenerated user info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
});