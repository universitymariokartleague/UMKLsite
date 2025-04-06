import { isDBLoaded, runSQL } from './database.js';

const teamBoxFormatHTML = `
    <button href="#" class="{{className}} teamBox">
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
        <div class="Institution">{{institution}}</div>
    </button>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const styleSheet = document.createElement("style");

let dbLoaded = false;
const season_id = 2;
let currentSeason = season_id;

async function generateTeamBox(team, cached) {
    team.logo_src = `assets/team_emblems/${team.team_name.toUpperCase()}.png`
    team.class_name = team.team_name.replace(/\s+/g, '')

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
            if (dbLoaded) team.points_override = await getTeamSeasonPoints(team.team_id, season_id);
            generateTeamBox(team, cached);
        }
        document.head.appendChild(styleSheet);
        cacheTeamData(JSON.stringify(teamData));
    } catch (error) {
        JSTeamBox.innerHTML = error;
    }
}

function cacheTeamData(teamData) {
    if (dbLoaded) {
        localStorage.setItem("cachedTeamData", teamData)
        console.log(`%cteamboxgenerate.js %c> %cCached team data`, "color:#9452ff", "color:#fff", "color:#c29cff");
    }
}

function checkCache() {
    if (localStorage.getItem("cachedTeamData")) {
        console.log(`%cteamboxgenerate.js %c> %cGenerating team boxes using cached data...`, "color:#9452ff", "color:#fff", "color:#c29cff");
        generateTeamBoxes(JSON.parse(localStorage.getItem("cachedTeamData")), true)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    waitForDBToInit()
});

async function waitForDBToInit() {
    dbLoaded = await isDBLoaded();
    console.log(`%cteamboxgenerate.js %c> %c${dbLoaded ? "Database loaded" : "Database is loading..."}`, "color:#9452ff", "color:#fff", "color:#c29cff");
    if (!dbLoaded) {
        setTimeout(waitForDBToInit, 100); // Check again after 1 second
    } else {
        dbDoneLoading()
    }
}

async function dbDoneLoading() {
    // let teamData = await getSeasonTeamStandings(season_id)
    let teamData = await runSQL("SELECT * FROM team")
    console.log(`%cteamboxgenerate.js %c> %cGenerating team boxes using SQL...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBoxes(teamData, false)
}

async function getTeamSeasonPoints(teamId, season_id) {
    /** Calculate the total points for a team in a specific season. */
    const result = await runSQL(`
        SELECT SUM(points) as total_points
        FROM tournament_result, tournament_entry, tournament
        WHERE team_id = ${teamId}
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
        console.log(`%cteamboxgenerate.js %c> %cNo teams found for season ${season_id}`, "color:#9452ff", "color:#fff", "color:#ff6b6b");
        return [];
    }

    // Get points for each team and build standings
    for (const team of teamData) {
        const teamPoints = await getTeamSeasonPoints(team.team_id, season_id);
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

// extra
const s1Button = document.getElementById("s1-button");
s1Button.addEventListener('click', switchSeasons)

async function switchSeasons() {
    if (currentSeason == 2) {
        currentSeason = 1;
    } else {
        currentSeason = 2;
    }
    generateTeamBoxes(await getSeasonTeamStandings(currentSeason), false)
}