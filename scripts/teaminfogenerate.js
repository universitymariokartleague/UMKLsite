import { isDBLoaded, runSQL } from './database.js';

const teamBoxFormatHTML = `
    <button class="{{className}} teamBox">
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

async function generateTeamBox(teamData) {
    JSTeamBox.innerHTML = "";

    console.log(teamData.team_color)

    teamData.logo_src = `assets/team_emblems/${teamData.team_name.toUpperCase()}.png`
    teamData.class_name = teamData.team_name.replace(/\s+/g, '')

    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
        .replaceAll("{{className}}", teamData.class_name)
        .replaceAll("{{teamColor}}", teamData.team_color);

    styleSheet.innerText += teamBoxStyle;

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{position}}", teamData.position)
        .replace("{{points}}", `${teamData.points_override ? teamData.points_override : (teamData.points ? teamData.points : "0")} PTS` )
        .replaceAll("{{teamName}}", teamData.team_name)
        .replace("{{institution}}", teamData.team_full_name)
        .replaceAll("{{className}}", teamData.class_name)
        .replace("{{logoSrc}}", teamData.logo_src)
        .replace("{{teamlogoopacity}}", 1);

    JSTeamBox.innerHTML += tempTeamBox;
    document.head.appendChild(styleSheet);
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
    } catch (error) {
        JSTeamBox.innerHTML = error;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    waitForDBToInit()
});

async function waitForDBToInit() {
    dbLoaded = await isDBLoaded();
    console.debug(`%cteamboxgenerate.js %c> %c${dbLoaded ? "Database loaded" : "Database is loading..."}`, "color:#9452ff", "color:#fff", "color:#c29cff");
    if (!dbLoaded) {
        setTimeout(waitForDBToInit, 100); // Check again after 1 second
    } else {
        dbDoneLoading()
    }
}

async function dbDoneLoading() {
    let currentTeam = JSTeamBox.dataset.team

    let teamData = await runSQL(`SELECT * FROM team WHERE team_name = '${currentTeam}'`)
    console.debug(`%cteamboxgenerate.js %c> %cGenerating team boxes using SQL...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    
    let totalPoints = getTeamCareerPoints(teamData[0].team_id);
    
    generateTeamBox(teamData[0]); //attempt to retrieve playlist file from audioStatus class data
}

async function getTeamCareerPoints(teamId) {
    /** Calculate the total career points for a team across all tournaments. */
    const result = await runSQL(`SELECT SUM(points)
        FROM tournament_result, tournament_entry
        WHERE team_id = ${teamId}
        AND tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
        AND approved = 1
    `);

    return result[0]?.total_points || 0;
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

// async function 