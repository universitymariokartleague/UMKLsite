/*
    This script generates the team boxes on the teams page. These boxes display
    information about each team, including their team name, logo, position, points,
    and institution. The script fetches data from the database and creates the
    HTML elements dynamically. It also handles caching of the data to improve performance.
*/

import { isDBLoaded, runSQL } from './database.js';
import {
    toOrdinal,
    getCurrentSeason,
    getSeasonStatus,
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
const styleSheet = document.createElement("style");
const seasonPicker = document.getElementById("season-select")
const currentSeasonText = document.getElementById("current-season")

let listView = localStorage.getItem("teamsListView") == 1 || false;

const startYear = 2023;
let dbLoaded = false;
let firstLoad = true;
let currentSeason, maxSeason = 1;

let startTime;

async function generateTeamBox(team, cached, count) {
    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
        .replaceAll("{{className}}", team.class_name)
        .replaceAll("{{teamColor}}", team.team_color);

    styleSheet.innerText += teamBoxStyle;

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{position}}", team.position)
        .replace("{{points}}", `${team.points_override ? team.points_override : (team.points ? team.points : "0")}` )
        .replaceAll("{{teamName}}", team.team_name)
        .replace("{{institution}}", team.team_full_name)
        .replaceAll("{{className}}", team.class_name)
        .replace("{{linkName}}", team.link_name)
        .replace("{{logoSrc}}", team.logo_src)
        .replace("{{teamlogoopacity}}", cached);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tempTeamBox;

    JSTeamBox.appendChild(tempDiv);
    if (firstLoad) {
        tempDiv.style.opacity = 0;
        setTimeout(() => {
            tempDiv.style.transition = "opacity 0.2s ease-in-out";
            tempDiv.style.opacity = 1;
        }, count * 25);
    }
}

async function generateTeamBoxes(teamData, cached) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.add('fade-in');
    listView = localStorage.getItem("teamsListView") == 1 || false;

    for (let i = 0; i < teamData.length; i++) {
        const team = teamData[i];
        team.position = i + 1;
        if (dbLoaded) team.points_override = await getTeamSeasonPoints(team.team_id, currentSeason);
        team.logo_src = `assets/image/teamemblems/${team.team_name.toUpperCase()}.png`
        team.class_name = team.team_name.replace(/\s+/g, '')
        team.link_name = team.team_name.replace(/\s+/g, '-').toLowerCase()
    }

    if (listView) {
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
            
            const matchesPlayed = await getTeamMatchesPlayed(team.team_id, currentSeason);
            const winsAndLosses = cached ? ["     ","     "] : await getTeamWinsAndLossesForSeason(team.team_id, currentSeason);
            [
                team.position, 
                `<div class="team-name-grid-flex">
                    <img src="${team.logo_src}" alt="${team.team_name} team logo" class="team-logo-grid">
                        <div class="team-text-flex">
                        <h3>${team.team_name}</h3>
                    <span class="team-list-full-institution">${team.team_full_name}</span>
                    </div>
                </div>`, 
                `${matchesPlayed}`,
                `${winsAndLosses[0]} - ${winsAndLosses[1]}`,
                `${team.points_override ? team.points_override : (team.points ? team.points : "0")}`,
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
        JSTeamBox.classList.add('teamBoxContainer');

        try {
            for (let i = 0; i < teamData.length; i++) {
                const team = teamData[i];
                team.position = i + 1;
                if (dbLoaded) team.points_override = await getTeamSeasonPoints(team.team_id, currentSeason);
                generateTeamBox(team, cached, i);
            }
            document.head.appendChild(styleSheet);
        } catch (error) {
            JSTeamBox.innerHTML = error.stack;
        }
    }

    cacheTeamData(JSON.stringify(teamData));
    setTimeout(() => {
        firstLoad = false;
    }, 100);
}

function cacheTeamData(teamData) {
    if (dbLoaded) {
        localStorage.setItem("cachedTeamData", teamData)
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        localStorage.setItem("lastCached", timestamp);
        console.debug(`%cteamboxgenerate.js %c> %cGenerated and cached team data in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9452ff", "color:#fff", "color:#c29cff");
    }
}

function checkCache() {
    if (localStorage.getItem("cachedTeamData")) {
        console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes using cached data...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        generateTeamBoxes(JSON.parse(localStorage.getItem("cachedTeamData")), true)
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    await waitForDBToInit();
    await readTeamsData()
});

document.addEventListener('listViewChange', async () => {
    let teamData = await getSeasonTeamStandings(currentSeason)
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes using SQL...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBoxes(teamData, false)
});

async function waitForDBToInit() {
    while (!(await isDBLoaded())) {
        console.debug(`%cteamboxgenerate.js %c> %cDatabase is loading...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    console.debug(`%cteamboxgenerate.js %c> %cDatabase loaded`, "color:#9452ff", "color:#fff", "color:#c29cff");
    dbLoaded = true;
}

async function readTeamsData() {
    maxSeason = await getCurrentSeason();
    currentSeason = maxSeason;
    generateSeasonPicker();
    updateSeasonText();
    let teamData = await getSeasonTeamStandings(currentSeason)
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes using SQL...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBoxes(teamData, false)
}

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
    currentSeason = this.value;
    await updateSeasonText();
    console.debug(`%cteamboxgenerate.js %c> %cSelected season ${currentSeason}`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBoxes(await getSeasonTeamStandings(currentSeason), false)
});

async function updateSeasonText() {
    const seasonStatus = await getSeasonStatus(currentSeason);
    currentSeasonText.innerText = `${seasonStatus} (${(startYear + Number(currentSeason))}-${(startYear + 1 + Number(currentSeason))})`;
}

checkCache();
generateListViewButton();

function generateListViewButton() {
    const listViewButton = document.getElementById("listViewButton");

    function updateButton() {
        const isListView = localStorage.getItem("teamsListView") == 1;
        listViewButton.innerHTML = `<span class="fa-solid ${isListView ? 'fa-table-cells-large' : 'fa-bars'}"></span> ${isListView ? 'Switch to grid' : 'Switch to list'}`;
    }

    updateButton();

    listViewButton.onclick = () => {
        firstLoad = false;
        const isListView = localStorage.getItem("teamsListView") == 1;
        localStorage.setItem("teamsListView", isListView ? 0 : 1);
        updateButton();
        document.dispatchEvent(new CustomEvent('listViewChange'));
    };
}