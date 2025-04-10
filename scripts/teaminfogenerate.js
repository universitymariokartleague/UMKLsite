import { isDBLoaded, runSQL } from './database.js';

const teamBoxFormatHTML = `
    <button class="{{className}} teamBox">
        <div class="positionBox">
            <div class="team-position">{{institution}}</div>
        </div>
        <hr>
        <div class="{{className}} team">
            <span>{{teamName}}</span>
            <img onload="this.style.opacity={{teamlogoopacity}}" src="{{logoSrc}}" alt="{{teamName}} team logo" class="team-logo">
        </div>
        <hr>
        <div class="institution">{{extraData}}</div>
    </button>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const styleSheet = document.createElement("style");

let dbLoaded = false;
let currentSeason, maxSeason = 1;

async function generateTeamBox(teamData) {
    JSTeamBox.innerHTML = "";

    console.log(teamData)

    teamData.logo_src = `assets/team_emblems/${teamData.team_name.toUpperCase()}.png`
    teamData.class_name = teamData.team_name.replace(/\s+/g, '')

    let extraData = `
        Life time points: ${await getTeamCareerPoints(teamData.team_id)}<br/>
        Season ${currentSeason} points: ${await getTeamSeasonPoints(teamData.team_id, currentSeason)}<br/>`

    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
        .replaceAll("{{className}}", teamData.class_name)
        .replaceAll("{{teamColor}}", teamData.team_color);

    styleSheet.innerText += teamBoxStyle;

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{position}}", teamData.position)
        .replaceAll("{{teamName}}", teamData.team_name)
        .replace("{{institution}}", teamData.team_full_name)
        .replaceAll("{{className}}", teamData.class_name)
        .replace("{{logoSrc}}", teamData.logo_src)
        .replace("{{teamlogoopacity}}", 1)
        .replace("{{extraData}}", extraData);

    JSTeamBox.innerHTML += tempTeamBox;
    document.head.appendChild(styleSheet);
}

document.addEventListener("DOMContentLoaded", () => {
    waitForDBToInit()
});

async function waitForDBToInit() {
    dbLoaded = await isDBLoaded();
    console.debug(`%cteaminfogenerate.js %c> %c${dbLoaded ? "Database loaded" : "Database is loading..."}`, "color:#9452ff", "color:#fff", "color:#c29cff");
    if (!dbLoaded) {
        setTimeout(waitForDBToInit, 100); // Check again after 0.1 seconds
    } else {
        dbDoneLoading()
    }
}

async function dbDoneLoading() {
    maxSeason = await getCurrentSeason();
    currentSeason = maxSeason;

    console.log(currentSeason)

    let currentTeam = JSTeamBox.dataset.team
    let teamData = (await runSQL(`SELECT * FROM team WHERE team_name = '${currentTeam}'`))[0];
    
    console.debug(`%cteaminfogenerate.js %c> %cGenerating team boxes using SQL...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBox(teamData); //attempt to retrieve playlist file from audioStatus class data
}

async function getCurrentSeason() {
    /** Fetch the ID of the most recent season from the database. */
    const result = await runSQL(`
        SELECT MAX(season_id)
        FROM season`
    )

    return result[0]["MAX(season_id)"];
}

async function getTeamCareerPoints(teamId) {
    /** Calculate the total career points for a team across all tournaments. */
    const result = await runSQL(`SELECT SUM(points)
        FROM tournament_result, tournament_entry
        WHERE team_id = ${teamId}
        AND tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
        AND approved = 1
    `);

    return result[0]["SUM(points)"] || 0;
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