/*
    This script generates the team info page for each team's individual page.
    It is similar to teamboxgenerate.js, but it focuses on displaying detailed information
    about a specific team, including their logo, location, institution,
    championships, wins-losses, and lifetime points. HTML elements are created dynamically.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        <img width=200 height=200 src="{{logoSrc}}" alt="{{teamName}} team logo" class="team-info-logo">
        <hr>
        <div class="team-info-text">
            {{extraFields}}
        </div>
        <div class="current-season-info">
            <div class="heading-wrapper" style="margin-left: 3px;">
                <h2>Season 2</h2>
                <div class="green-dot"></div>
            </div>
            <div class="team-info-text">
                {{currentFields}}
            </div>
        </div>
        {{errorMessage}}
    </div>

    <div class="map {{className}}">
        <img src="assets/image/map/{{teamNameLower}}_map.png">
    </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const startYear = 2023;

let teamData = [];
const currentSeason = 2;

let startTime;

async function generateTeamBox(teamData, showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    try {
        teamData.logo_src = `assets/image/teamemblems/${teamData.team_name.toUpperCase()}.png`
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
        .replace("{{teamName}}", teamData.team_name)
        .replace("{{className}}", teamData.class_name)
        .replace("{{teamNameLower}}", teamData.team_name.toLowerCase())
        .replace("{{logoSrc}}", teamData.logo_src)
        .replace("{{extraFields}}", extraFields)
        .replace("{{currentFields}}", currentFields)
        .replace("{{errorMessage}}", showError ? `<blockquote style="margin-top:5px;margin-bottom:0px;padding:5px;" class="fail">Failed to fetch team data from the API, the above information may not be up to date!</blockquote>` : "");

    const highlightColor = `${teamData.team_color}80`;
    document.documentElement.style.setProperty('--highlight-color', highlightColor);
    const teamStyleSheet = document.createElement("style");
    document.head.appendChild(teamStyleSheet);
    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');
}

function toOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

async function getTeamdata(team = "", season = 0) {
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

    let showError = false;
    let currentTeam = JSTeamBox.dataset.team
    try {
        teamData = await getTeamdata(currentTeam);
    } catch (error) {
        console.debug(`%cteaminfogeenrate.js %c> %cAPI failed - using fallback information...`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
        teamData = await getTeamdataFallback(currentTeam);
        showError = true;
    }
    await generateTeamBox(teamData[0], showError);

    console.debug(`%cteaminfogeenrate.js %c> %cGenerated team info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
});