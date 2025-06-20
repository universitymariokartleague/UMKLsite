/*
    This script generates the team info page for each team's individual page.
    It is similar to teamboxgenerate.js, but it focuses on displaying detailed information
    about a specific team, including their logo, location, institution,
    championships, wins-losses, and lifetime points. HTML elements are created dynamically.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        <img width=200 height=200 src="{{logoSrc}}" alt="{{teamName}}'s team logo" title="{{teamName}}'s team logo"  class="team-info-logo">
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
const startYear = 2023;

let teamData = [];
const currentSeason = 2;

let refreshTimer = null;

let startTime;

async function generateTeamBox(teamData, showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    try {
        teamData.logo_src = `assets/image/teamemblems/hres/${teamData.team_name.toUpperCase()}.png`
        teamData.class_name = teamData.team_name.replace(/\s+/g, '')
    } catch (error) {
        JSTeamBox.innerHTML = `<blockquote class="fail">No team data available!<br/>${error.stack}</blockquote>`;
    }

    let firstEntry = teamData.first_entry

    let extraFields = `
        <table class="team-info-table">
            <tr><td class="table-key">Location</td><td>${teamData.team_place}</td></tr>
            <tr><td class="table-key">Institution</td><td>${teamData.team_full_name}</td></tr>
            <tr><td class="table-key">First Entry</td><td>Season ${firstEntry} (${startYear + firstEntry}-${startYear + 1 + firstEntry})</td></tr>
            <tr><td class="table-key">Championships</td><td>${teamData.team_championships}</td></tr>
            <tr><td class="table-key">Wins-Losses</td><td>${teamData.career_wins_losses[0]} - ${teamData.career_wins_losses[1]}</td></tr>
            <tr><td class="table-key">Lifetime Points</td><td>${teamData.team_career_points}</td></tr>
        </table>
    `;

    let currentFields = `
        <table class="team-info-table">
            <tr><td class="table-key">Matches Played</td><td>${teamData.season_matches_played}</td></tr>
            <tr><td class="table-key">Wins-Losses</td><td>${teamData.season_wins_losses[0]} - ${teamData.season_wins_losses[1]}</td></tr>
            <tr><td class="table-key">Points</td><td>${teamData.team_season_points} (${toOrdinal(teamData.season_position)})</td></tr>
            <tr><td class="table-key">Penalties</td><td>${teamData.season_penalties}</td></tr>
        </table>
    `;

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{currentSeason}}", teamData.season)
        .replaceAll("{{teamName}}", teamData.team_name)
        .replace("{{className}}", teamData.class_name)
        .replace("{{teamNameLower}}", teamData.team_name.toLowerCase())
        .replace("{{logoSrc}}", teamData.logo_src)
        .replace("{{extraFields}}", extraFields)
        .replace("{{currentFields}}", currentFields)

    const highlightColor = `${teamData.team_color}80`;
    document.documentElement.style.setProperty('--highlight-color', highlightColor);
    const teamStyleSheet = document.createElement("style");
    document.head.appendChild(teamStyleSheet);
    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');

    let errorBlock = document.getElementById("team-api-error");
    switch (showError) {
        case 1:
            if (!errorBlock) {
                errorBlock = document.createElement("blockquote");
                errorBlock.className = "fail";
                errorBlock.id = "team-api-error";
                const mainElem = document.querySelector("main");
                if (mainElem) {
                    mainElem.appendChild(errorBlock);
                }
            }
            if (window.retryCount) {
                errorBlock.innerHTML = `<b>API error - Retrying: attempt ${window.retryCount}</b><br>Failed to fetch team data from the API, the below information may not be up to date!`;
            } else {
                errorBlock.innerHTML = "<b>API error</b><br>Failed to fetch team data from the API, the below information may not be up to date!";
            }
            break;
        case 2:
            if (!errorBlock) {
                errorBlock = document.createElement("blockquote");
                errorBlock.className = "fail";
                errorBlock.id = "team-api-error";
                const mainElem = document.querySelector("main");
                if (mainElem) {
                    mainElem.appendChild(errorBlock);
                }
            }
            errorBlock.innerHTML = "<b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.";
            break;
        default:
            if (errorBlock) {
                errorBlock.remove();
            }
            break;
    }
}

function toOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

async function getTeamdata(team = "", season = "") {
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

async function getTeamdataFallback(currentTeam) {
    const response = await fetch(`database/teamdatafallbacks${currentSeason}.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const allTeams = await response.json();
    // Filter to only the current team
    return allTeams.filter(team => team.team_name === currentTeam);
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cteaminfogeenrate.js %c> %cGenerating team info box`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
    JSTeamBox.innerHTML = "Loading team information...";

    let showError = 0;
    let currentTeam = JSTeamBox.dataset.team
    try {
        teamData = await getTeamdata(currentTeam);
    } catch (error) {
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
                    await generateTeamBox(teamData[0], showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generateTeamBox(teamData[0], showError);

    console.debug(`%cteaminfogeenrate.js %c> %cGenerated team info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
});