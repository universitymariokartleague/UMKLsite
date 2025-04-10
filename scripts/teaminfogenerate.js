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

    let winslosses = await getTeamWinsAndLosses(teamData.team_id);

    let extraData = `
        Season ${currentSeason} points: ${await getTeamSeasonPoints(teamData.team_id, currentSeason)}<br/>
        Lifetime points: ${await getTeamCareerPoints(teamData.team_id)}<br/>
        Current season position: ${getOrdinal(teamData.season_position)}<br/>
        Matches played: ${await getTeamMatchesPlayed(teamData.team_id, currentSeason)}<br/>
        Wins/Losses: ${winslosses[0]}/${winslosses[1]}<br/>
    `

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

    let currentTeam = JSTeamBox.dataset.team
    let allTeamData = await getSeasonTeamStandings(currentSeason);
    let teamData = allTeamData.find(team => team.team_name === 'York');
    console.log(allTeamData)
    // let teamData = (await runSQL(`SELECT * FROM team WHERE team_name = '${currentTeam}'`))[0];
    

    console.debug(`%cteaminfogenerate.js %c> %cGenerating team boxes using SQL...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    generateTeamBox(teamData); //attempt to retrieve playlist file from audioStatus class data
}

function getOrdinal(num) {
    const suffixes = ["th", "st", "nd", "rd"];
    const value = num % 100;
    return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

async function getCurrentSeason() {
    /** Fetch the ID of the most recent season from the database. */
    const result = await runSQL(`
        SELECT MAX(season_id)
        FROM season`
    )

    return result[0]["MAX(season_id)"];
}

async function getTeamCareerPoints(team_id) {
    /** Calculate the total career points for a team across all tournaments. */
    const result = await runSQL(`SELECT SUM(points)
        FROM tournament_result, tournament_entry
        WHERE team_id = ${team_id}
        AND tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
        AND approved = 1
    `);

    return result[0]["SUM(points)"] || 0;
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
    let standings = [];

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
    standings.sort((a, b) => b.points - a.points);

    // Add position to each team in standings
    standings.forEach((team, index) => {
        team.season_position = index + 1;
    });

    return standings;
}

async function getTeamMatchesPlayed(team_id, season_id) {
    /** Return the amount of matches a team has played in a specific season. */
    const result = await runSQL(`
        SELECT COUNT(DISTINCT te.tournament_id)
        FROM tournament_result tr
        JOIN tournament_entry te ON tr.tournament_entry_id = te.tournament_entry_id
        JOIN tournament t ON te.tournament_id = t.tournament_id
        WHERE te.team_id = ${team_id} AND t.season_id = ${season_id}
    `)

    return result[0]["COUNT(DISTINCT te.tournament_id)"] || 0;
}

async function getTeamTournaments(team_id) {
    /** Fetch all tournament IDs for a specific team. */
    return await runSQL(`SELECT tournament_id FROM tournament_entry WHERE team_id = ${team_id}`)
}

async function getTournamentTeamResults(tournament_id, approved) {
    /** Get tournament results for teams with total points */
    if (!tournament_id) return [];

    return await runSQL(`
        SELECT team_id, tp.total_points
        FROM (
            SELECT te.team_id, SUM(tr.points) AS total_points
            FROM tournament_result tr
            JOIN tournament_entry te ON tr.tournament_entry_id = te.tournament_entry_id
            WHERE te.tournament_id = ${tournament_id} AND tr.approved = ${approved}
            GROUP BY te.team_id
        ) tp
        ORDER BY tp.total_points DESC
    `);
}

async function getTeamWinsAndLosses(team_id) {
    /** Calculate the number of tournament wins and losses for a specific team. */
    const tournaments = await getTeamTournaments(team_id);
    let wins = 0, losses = 0;

    for (const tournament of tournaments) {
        const results = await getTournamentTeamResults(tournament["tournament_id"], 1);
        console.log(results)
        if (results.length > 0) {
            if (results[0]["team_id"] === team_id) {
                wins++;
            } else {
                losses++;
            }
        }
    }

    return [wins, losses];
}