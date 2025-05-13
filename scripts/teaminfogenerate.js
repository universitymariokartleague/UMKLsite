/*
    This script generates the team info page for each team's individual page.
    It is similar to teamboxgenerate.js, but it focuses on displaying detailed information
    about a specific team, including their logo, location, institution,
    championships, wins-losses, and lifetime points. HTML elements are created dynamically.
*/

import { isDBLoaded, runSQL } from './database.js';

const teamBoxFormatHTML = `
        <div class="team-info-wrapper">
            <img onload="this.style.opacity={{teamlogoopacity}}" src="{{logoSrc}}" alt="{{teamName}} team logo" class="team-info-logo">
            <hr>
            <div class="team-info-text">
                {{extraFields}}
            </div>
        </div>

        <div class="map">
            <img src="assets/image/map/{{teamNameLower}}_map.png">
        </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const styleSheet = document.createElement("style");

let currentSeason, maxSeason = 1;

async function generateTeamBox(teamData) {
    JSTeamBox.innerHTML = "";

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
            <tr><td class="table-key">First Entry</td><td>Season ${firstEntry} (${2023 + firstEntry}-${2024 + firstEntry})</td></tr>
            <tr><td class="table-key">Championships</td><td>${await getTeamChampionships(teamData.team_id)}</td></tr>
            <tr><td class="table-key">Wins-Losses</td><td>${winslosses[0]}-${winslosses[1]}</td></tr>
            <tr><td class="table-key">Lifetime Points</td><td>${await getTeamCareerPoints(teamData.team_id)}</td></tr>
        </table>
    `;

    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
        .replaceAll("{{className}}", teamData.class_name)
        .replaceAll("{{teamColor}}", teamData.team_color);

    const teamStyleSheet = document.createElement("style");
    teamStyleSheet.innerText = teamBoxStyle;
    document.head.appendChild(teamStyleSheet);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{position}}", teamData.position)
        .replace("{{teamName}}", teamData.team_name)
        .replace("{{teamNameLower}}", teamData.team_name.toLowerCase())
        .replace("{{institution}}", teamData.team_full_name)
        .replace("{{logoSrc}}", teamData.logo_src)
        .replace("{{teamlogoopacity}}", 1)
        .replace("{{extraFields}}", extraFields)

    JSTeamBox.innerHTML += tempTeamBox;
    document.head.appendChild(styleSheet);
}

document.addEventListener("DOMContentLoaded", async () => {
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
    maxSeason = await getCurrentSeason();
    currentSeason = maxSeason;

    let currentTeam = JSTeamBox.dataset.team
    let allTeamData = await getSeasonTeamStandings(currentSeason);
    let teamData = allTeamData.find(team => team.team_name === currentTeam);
    // console.log(allTeamData)
    // let teamData = (await runSQL(`SELECT * FROM team WHERE team_name = '${currentTeam}'`))[0];

    await generateTeamBox(teamData);
    console.debug(`%cteaminfogeenrate.js %c> %cGenerated team info box`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
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

async function getFirstEntry(team_id) {
    const result = await runSQL(`SELECT MIN(season_id)
        FROM season_entry 
        WHERE team_id = ${team_id}`);

        return result[0]["MIN(season_id)"] || 0;
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

async function getTeamPlace(team_id) {
    const result = await runSQL(`
        SELECT place_id
        FROM team
        WHERE team_id = ${team_id}
    `);

    return result[0]?.place_id || null;
}

async function getPlace(place_id) {
    const result = await runSQL(`
        SELECT place_name, country
        FROM uk_places
        WHERE place_id = ${place_id}
    `);

    return `${result[0]?.place_name || "Unknown"}, ${result[0]?.country || "Unknown"}`;
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

async function getTeamChampionships(team_id) {
    let championships = 0;
    const currentSeason = await getCurrentSeason();
    for (let i = 0; i < currentSeason; i++) {
        const standings = await getSeasonTeamStandings(i);
        if (standings.length > 0 && standings[0].team_id === team_id) {
            championships++;
        }
    }
    return championships;
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