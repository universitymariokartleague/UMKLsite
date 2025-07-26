/*
    This script generates the team info page for each team's individual page.
    It is similar to teamboxgenerate.js, but it focuses on displaying detailed information
    about a specific team, including their logo, location, institution,
    championships, wins-losses, and lifetime points. HTML elements are created dynamically.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        <img width=200 height=200 src="{{logoSrc}}" alt="{{teamName}}'s team logo" title="{{teamName}}'s team logo"  class="team-info-logo"
        onerror="this.onerror=null; this.src='{{placeholderLogo}}';"/>
        <hr>
        <div class="team-info-text">
            {{extraFields}}
        </div>
        <div class="current-season-info">
            <div class="heading-wrapper" style="margin-left: 3px;">
                <h2>Season {{currentSeason}}</h2>
                <div class="live-dot"></div>
            </div>
            <div class="team-info-text">
                {{currentFields}}
            </div>
        </div>
    </div>

    <div class="map {{className}}">
        <iframe id="teamMapIFrame" src="pages/map/index.html?team={{teamName}}" frameborder="0"></iframe>
    </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const teamNameBox = document.getElementById("teamNameBox")
const startYear = 2023;

let teamData = [];
const currentSeason = 2;

const UPDATEINVERVAL = 30000;
let refreshTimer = null;

let startTime;

function buildTeamInfoTable(teamData, isCurrent = false) {
    if (isCurrent) {
        return `
            <table class="team-info-table">
                <tr><td class="table-key">Wins-Losses</td><td>${teamData.season_wins_losses[0]} - ${teamData.season_wins_losses[1]}</td></tr>
                <tr><td class="table-key">Matches Played</td><td>${teamData.season_matches_played}</td></tr>
                <tr><td class="table-key">Points</td><td>${teamData.team_season_points} (${toOrdinal(teamData.season_position)})</td></tr>
                <tr><td class="table-key">Penalties</td><td>${teamData.season_penalties}</td></tr>
            </table>
        `;
    }
    return `
        <table class="team-info-table">
            <tr><td class="table-key">Location</td><td>${teamData.team_place}</td></tr>
            <tr><td class="table-key">Institution</td><td>${teamData.team_full_name}</td></tr>
            <tr><td class="table-key">First Entry</td><td>Season ${teamData.first_entry} (${startYear + teamData.first_entry}-${startYear + 1 + teamData.first_entry})</td></tr>
            <tr><td class="table-key">Season Wins</td><td>${teamData.team_championships}</td></tr>
            <tr><td class="table-key">Lifetime<br>Wins/Losses</td><td>${teamData.career_wins_losses[0]} - ${teamData.career_wins_losses[1]}</td></tr>
            <tr><td class="table-key">Lifetime Points</td><td>${teamData.team_career_points}</td></tr>
            <tr><td class="table-key">Lifetime Matches Played</td><td>${teamData.lifetime_matches_played}</td></tr>
        </table>
    `;
}

async function generateTeamBox(teamData, showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    const placeholderLogo = "assets/media/teamemblems/DEFAULT.png";
    const teamNameUpper = teamData.team_name.toUpperCase();
    const logoUrl = `assets/media/teamemblems/hres/${teamNameUpper}.png`;
    teamData.logo_src = logoUrl;

    const extraFields = buildTeamInfoTable(teamData);
    const currentFields = buildTeamInfoTable(teamData, true);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{currentSeason}}", teamData.season)
        .replaceAll("{{teamName}}", teamData.team_name)
        .replace("{{className}}", teamData.class_name)
        .replace("{{teamNameLower}}", teamData.team_name.toLowerCase())
        .replace("{{logoSrc}}", teamData.logo_src)
        .replace("{{placeholderLogo}}", placeholderLogo)
        .replace("{{extraFields}}", extraFields)
        .replace("{{currentFields}}", currentFields);

    document.documentElement.style.setProperty('--highlight-color', `${teamData.team_color}80`);
    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');

    // Dynamically inject .live-dot CSS using --highlight-color as background
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

    showErrorBox(showError);
}

async function editTeamBox(teamData) {
    const currentSeasonInfo = JSTeamBox.querySelector('.current-season-info .team-info-text');
    const extraFieldsInfo = JSTeamBox.querySelector('.team-info-text');
    if (!currentSeasonInfo || !extraFieldsInfo) return;

    extraFieldsInfo.innerHTML = buildTeamInfoTable(teamData);
    currentSeasonInfo.innerHTML = buildTeamInfoTable(teamData, true);
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
            errorBlock.innerHTML = `${retryMsg}Failed to fetch team data from the API, the below information may not be up to date!`;
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

async function getTeamdata(team = "", season = "") {
    const response = await fetch('https://api.umkl.co.uk/teamdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team, season })
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


async function getTeamdataFallback(currentTeam) {
    const response = await fetch(`database/teamdatafallbacks${currentSeason}.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const allTeams = await response.json();
    return allTeams.filter(team => team.team_name === currentTeam);
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cteaminfogeenrate.js %c> %cGenerating team info box`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
    JSTeamBox.innerHTML = "Loading team information...";

    let showError = 0;
    const urlParams = new URLSearchParams(window.location.search);
    let currentTeam = urlParams.get('team');
    document.title = currentTeam;
    teamNameBox.innerText = currentTeam;

    if (!currentTeam) {
        window.location.href = "/pages/teams";
    } else {
        teamNameBox.innerText = currentTeam;
    }

    try {
        teamData = await getTeamdata(currentTeam);
    } catch (error) {
        console.log(error)
        if (error?.error === "Team not found") {
            window.location.href = "/pages/teams";
        }

        console.debug(`%cteaminfogeenrate.js %c> %cAPI failed - using fallback information...`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
        teamData = await getTeamdataFallback(currentTeam);
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
                    teamData = await getTeamdata(currentTeam);
                    showError = 0;
                    await generateTeamBox(teamData[0], showError);
                } catch (err) {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generateTeamBox(teamData[0], showError);

    if (refreshTimer) clearTimeout(refreshTimer);
    const updateFetch = async () => {
        try {
            if (typeof retryCount === 'undefined') {
                window.retryCount = 1;
            } else {
                window.retryCount++;
            }
            console.debug(`%cgetlivedata.js %c> %cRefreshing live data...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
            teamData = await getTeamdata(currentTeam);
            showError = 0;
            await editTeamBox(teamData[0]);
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

    console.debug(`%cteaminfogeenrate.js %c> %cGenerated team info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
});