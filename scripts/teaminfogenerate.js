/*
    This script generates the team info page for each team's individual page.
    It is similar to teamboxgenerate.js, but it focuses on displaying detailed information
    about a specific team, including their logo, location, institution,
    championships, wins-losses, and lifetime points. HTML elements are created dynamically.
*/

import { isDBLoaded, runSQL } from './database.js';
import {
    getCurrentSeason,
    toOrdinal,
    getFirstEntry,
    getTeamWinsAndLossesForSeason,
    getSeasonPenalties,
    getTeamCareerPoints,
    getTeamPlace,
    getPlace,
    getTeamSeasonPoints,
    getSeasonTeamStandings,
    getTeamChampionships,
    getTeamMatchesPlayed,
    getTeamTournaments,
    getTournamentTeamResults,
    getTeamWinsAndLosses
} from './teamboxhelper.js';

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        <img src="{{logoSrc}}" alt="{{teamName}} team logo" class="team-info-logo">
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

    </div>

    <div class="map {{className}}">
        <img src="assets/image/map/{{teamNameLower}}_map.png">
    </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const startYear = 2023;

let currentSeason = 1;

let startTime;

async function generateTeamBox(teamData) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    try {
        teamData.logo_src = `assets/image/teamemblems/${teamData.team_name.toUpperCase()}.png`
        teamData.class_name = teamData.team_name.replace(/\s+/g, '')
    } catch (error) {
        JSTeamBox.innerHTML = `<div class="codeBox">No team data available!<br/>${error.stack}</div>`;
    }

    let winslosses = await getTeamWinsAndLosses(teamData.team_id);
    let teamPlace = await getPlace(await getTeamPlace(teamData.team_id));
    let firstEntry = await getFirstEntry(teamData.team_id)

    let extraFields = `
        <table class="team-info-table">
            <tr><td class="table-key">Location</td><td>${teamPlace}</td></tr>
            <tr><td class="table-key">Institution</td><td>${teamData.team_full_name}</td></tr>
            <tr><td class="table-key">First Entry</td><td>Season ${firstEntry} (${startYear + firstEntry}-${startYear + 1 + firstEntry})</td></tr>
            <tr><td class="table-key">Championships</td><td>${await getTeamChampionships(teamData.team_id)}</td></tr>
            <tr><td class="table-key">Wins-Losses</td><td>${winslosses[0]}-${winslosses[1]}</td></tr>
            <tr><td class="table-key">Lifetime Points</td><td>${await getTeamCareerPoints(teamData.team_id)}</td></tr>
        </table>
    `;

    let currentFields = `
        <table class="team-info-table">
            <tr><td class="table-key">Matches Played</td><td>${await getTeamMatchesPlayed(teamData.team_id, currentSeason)}</td></tr>
            <tr><td class="table-key">Wins-Losses</td><td>${(await getTeamWinsAndLossesForSeason(teamData.team_id, currentSeason))[0]}-${(await getTeamWinsAndLossesForSeason(teamData.team_id, currentSeason))[1]}</td></tr>
            <tr><td class="table-key">Points</td><td>${await getTeamSeasonPoints(teamData.team_id, currentSeason)} (${toOrdinal(teamData.season_position)})</td></tr>
            <tr><td class="table-key">Penalties</td><td>${await getSeasonPenalties(teamData.team_id, currentSeason)}</td></tr>
        </table>
    `;

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{teamName}}", teamData.team_name)
        .replace("{{className}}", teamData.class_name)
        .replace("{{teamNameLower}}", teamData.team_name.toLowerCase())
        .replace("{{logoSrc}}", teamData.logo_src)
        .replace("{{extraFields}}", extraFields)
        .replace("{{currentFields}}", currentFields)

    const highlightColor = `${teamData.team_color}80`;
    document.documentElement.style.setProperty('--highlight-color', highlightColor);
    const teamStyleSheet = document.createElement("style");
    document.head.appendChild(teamStyleSheet);
    JSTeamBox.innerHTML += tempTeamBox;
    JSTeamBox.classList.add('fade-in');
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    await waitForDBToInit();
    await getTeamData();
});

async function waitForDBToInit() {
    while (!(await isDBLoaded())) {
        console.debug(`%cteaminfogenerate.js %c> %cDatabase is loading...`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    console.debug(`%cteaminfogenerate.js %c> %cDatabase loaded`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
}

async function getTeamData() {
    console.debug(`%cteaminfogeenrate.js %c> %cGenerating team info box using SQL...`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
    currentSeason = await getCurrentSeason();

    let currentTeam = JSTeamBox.dataset.team
    let allTeamData = await getSeasonTeamStandings(currentSeason);
    let teamData = allTeamData.find(team => team.team_name === currentTeam);

    await generateTeamBox(teamData);
    console.debug(`%cteaminfogeenrate.js %c> %cGenerated team info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
}