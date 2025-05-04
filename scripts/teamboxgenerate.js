import { isDBLoaded, runSQL } from './database.js';

const teamBoxFormatHTML = `
    <button onClick="location.href='pages/teams/{{LinkName}}/'" class="{{className}} teamBox">
        <div class="positionBox">
            <div class="team-position">{{position}}</div>
            <div class="team-points">{{points}}</div>
        </div>
        <hr>
        <div class="{{className}} team">
            <span>{{teamName}}</span>
            <img onload="this.style.opacity={{teamlogoopacity}}" src="{{logoSrc}}" alt="{{teamName}} team logo" class="team-logo">
        </div>
        <hr>
        <div class="institution">{{institution}}</div>
    </button>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const styleSheet = document.createElement("style");
const seasonPicker = document.getElementById("season-select")
const currentSeasonText = document.getElementById("current-season")

let dbLoaded = false;
let currentSeason, maxSeason = 1;

async function generateTeamBox(team, cached) {
    team.logo_src = `assets/image/teamemblems/${team.team_name.toUpperCase()}.png`
    team.class_name = team.team_name.replace(/\s+/g, '')
    team.link_name = team.team_name.replace(/\s+/g, '-').toLowerCase()

    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
        .replaceAll("{{className}}", team.class_name)
        .replaceAll("{{teamColor}}", team.team_color);

    styleSheet.innerText += teamBoxStyle;

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{position}}", team.position)
        .replace("{{points}}", `${team.points_override ? team.points_override : (team.points ? team.points : "0")} PTS` )
        .replaceAll("{{teamName}}", team.team_name)
        .replace("{{institution}}", team.team_full_name)
        .replaceAll("{{className}}", team.class_name)
        .replace("{{LinkName}}", team.link_name)
        .replace("{{logoSrc}}", team.logo_src)
        .replace("{{teamlogoopacity}}", cached ? 0 : 1);

    JSTeamBox.innerHTML += tempTeamBox;
}

async function generateTeamBoxes(teamData, cached) {
    JSTeamBox.innerHTML = "";
    try {
        for (let i = 0; i < teamData.length; i++) {
            const team = teamData[i];
            team.position = i + 1;
            if (dbLoaded) team.points_override = await getTeamSeasonPoints(team.team_id, currentSeason);
            generateTeamBox(team, cached);
        }
        document.head.appendChild(styleSheet);
        cacheTeamData(JSON.stringify(teamData));
    } catch (error) {
        JSTeamBox.innerHTML = error.stack;
    }
}

function cacheTeamData(teamData) {
    if (dbLoaded) {
        localStorage.setItem("cachedTeamData", teamData)
        console.debug(`%cteamboxgenerate.js %c> %cCached team data`, "color:#9452ff", "color:#fff", "color:#c29cff");
    }
}

function checkCache() {
    if (localStorage.getItem("cachedTeamData")) {
        console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes using cached data...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        generateTeamBoxes(JSON.parse(localStorage.getItem("cachedTeamData")), true)
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await waitForDBToInit();
    await readTeamsData()
});

async function waitForDBToInit() {
    while (!(await isDBLoaded())) {
        console.debug(`%cteamboxgenerate.js %c> %cDatabase is loading...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait for 0.05 seconds
    }
    console.debug(`%cteamboxgenerate.js %c> %cDatabase loaded`, "color:#9452ff", "color:#fff", "color:#c29cff");
}

async function readTeamsData() {
    // let teamData = await getSeasonTeamStandings(season_id)
    maxSeason = await getCurrentSeason();
    currentSeason = maxSeason;
    generateSeasonPicker();
    updateSeasonText();
    // let teamData = await runSQL("SELECT * FROM team")
    let teamData = await getSeasonTeamStandings(currentSeason)
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes using SQL...`, "color:#9452ff", "color:#fff", "color:#c29cff");

    console.log(await runSQL("SELECT team_name, team_color FROM team"))

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

async function getCurrentSeason() {
    /** Fetch the ID of the most recent season from the database. */
    const result = await runSQL(`
        SELECT MAX(season_id)
        FROM season`
    )

    return result[0]["MAX(season_id)"];
}

async function getSeasonStatus(season_id) {
    /** Fetch the status of a specific season from the database. */
    const result = await runSQL(`
        SELECT season_id
        FROM season
    `);

    if (result.length > season_id) {
        return "Concluded";
    }
    else {
        const matches = await runSQL(`
            SELECT *
            FROM tournament
            WHERE season_id = ${season_id}
        `);

        if (matches.length === 0) {
            return "Upcoming";
        } else {
            return "Ongoing";
        }
    }
}

async function getTeamSeasonPoints(team_id, season_id) {
    /** Calculate the total points for a team in a specific season. */
    const result = await runSQL(`
        SELECT SUM(points) as total_points
        FROM tournament_result, tournament_entry, tournament
        WHERE team_id = ${team_id}
        AND tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
        AND tournament_entry.tournament_id = tournament.tournament_id
        AND approved = 1
        AND season_id = ${season_id}
    `);

    return result[0]?.total_points || 0;
}

async function getSeasonTeamStandings(season_id) {
    /** Get the standings of all teams in a specific season, sorted by points. */
    const standings = [];

    // Get team data for the season
    const teamData = await runSQL(`
        SELECT team.team_id, team_name, team_full_name, team_color 
        FROM team, season_entry 
        WHERE season_id = ${season_id} 
        AND team.team_id = season_entry.team_id
    `);

    if (!teamData || teamData.length === 0) {
        console.debug(`%cteamboxgenerate.js %c> %cNo teams found for season ${season_id}`, "color:#9452ff", "color:#fff", "color:#ff6b6b");
        return [];
    }

    // Get points for each team and build standings
    for (const team of teamData) {
        const teamPoints = await getTeamSeasonPoints(team.team_id, currentSeason);
        standings.push({
            team_id: team.team_id,
            team_name: team.team_name,
            team_full_name: team.team_full_name,
            team_color: team.team_color,
            points: teamPoints
        });
    }

    // Sort by points in descending order
    return standings.sort((a, b) => b.points - a.points);
}

checkCache();

// season picker
seasonPicker.addEventListener("change", async function () {
    currentSeason = this.value;
    await updateSeasonText();
    console.debug(`%cteamboxgenerate.js %c> %cSelected season ${currentSeason}`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBoxes(await getSeasonTeamStandings(currentSeason), false)
});

async function updateSeasonText() {
    const seasonStatus = await getSeasonStatus(currentSeason);
    currentSeasonText.innerText = `${seasonStatus} (${(2023 + Number(currentSeason))}-${(2024 + Number(currentSeason))})`;
}