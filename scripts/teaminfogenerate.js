/*
    This script generates the team info page for each team's individual page.
    It is similar to teamboxgenerate.js, but it focuses on displaying detailed information
    about a specific team, including their logo, location, institution,
    championships, wins-losses, and lifetime points. HTML elements are created dynamically.
*/

import { isDBLoaded, runSQL } from './database.js';

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
let currentSeason, maxSeason = 1;

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
    maxSeason = await getCurrentSeason();
    currentSeason = maxSeason;

    let currentTeam = JSTeamBox.dataset.team
    let allTeamData = await getSeasonTeamStandings(currentSeason);
    let teamData = allTeamData.find(team => team.team_name === currentTeam);

    await generateTeamBox(teamData);
    console.debug(`%cteaminfogeenrate.js %c> %cGenerated team info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
}

async function getCurrentSeason() {
    /** Fetch the ID of the most recent season from the database. */
    const result = await runSQL(`
        SELECT MAX(season_id)
        FROM season`
    )

    return result[0]["MAX(season_id)"];
}

function toOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

async function getFirstEntry(team_id) {
    const result = await runSQL(`SELECT MIN(season_id)
        FROM season_entry 
        WHERE team_id = ${team_id}`);

        return result[0]["MIN(season_id)"] || 0;
}

async function getTeamWinsAndLossesForSeason(team_id, season_id) {
    const tournaments = await runSQL(`
        SELECT tournament_id FROM tournament_entry
        WHERE team_id = ${team_id}
        AND tournament_id IN (SELECT tournament_id FROM tournament WHERE season_id = ${season_id})
    `);
    let wins = 0, losses = 0;
    for (const tournament of tournaments) {
        const results = await getTournamentTeamResults(tournament["tournament_id"], 1);
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

async function getSeasonPenalties(team_id, season_id) {
    const result = await runSQL(`SELECT SUM(penalty_amount) as total_penalties
        FROM penalty
        JOIN tournament_entry ON penalty.tournament_entry_id = tournament_entry.tournament_entry_id
        JOIN tournament ON tournament_entry.tournament_id = tournament.tournament_id
        WHERE tournament_entry.team_id = ${team_id}
        AND tournament.season_id = ${season_id}`);
    return result[0]?.total_penalties || 0;
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
    for (let i = 1; i < currentSeason; i++) {
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