import { generate6v6ScoreCalculatorLink } from '/assets/scripts/utils/matchhelper.js';

const matchHistoryBox = document.getElementById("JSMatchHistory");
const teamEmblemBox = document.getElementById("teamEmblemBox");
let matchData = [];
let teamNameFromURL;

const CACHE_KEY = 'matchDataCache';
const getMatchCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; } };
const setMatchCache = (data) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} };

const getTeamFromURL = () => new URLSearchParams(window.location.search).get("team");

const getEmblem = teamName => ({
    avif: `https://api.umkl.co.uk/teamemblems/${teamName.toUpperCase()}`,
    png: `https://api.umkl.co.uk/teamemblems/${teamName.toUpperCase()}?og`
});

function getScoreForTeam(match, teamName) {
    const results = match.results;
    if (!results || !match.teamsInvolved) return null;

    const teams = match.teamsInvolved;
    const idx = teams.indexOf(teamName);
    if (idx === -1) return null;

    const opp = idx === 0 ? 1 : 0;
    if (!Array.isArray(results[idx]) || results[idx].length < 2) return null;

    return {
        teamScore: results[idx][1],
        otherScore: results[opp][1]
    };
}

async function getMatchData() {
    return fetch('https://api.umkl.co.uk/matchdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: "{}"
    }).then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    });
}

function normalizeMatchData(matchData) {
    const flat = [];
    Object.keys(matchData).forEach(dateKey => {
        matchData[dateKey].forEach(entry => {
            flat.push({ ...entry, matchDate: dateKey });
        });
    });
    return flat;
}

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

function populateTeamDropdown(currentTeam) {
    const teamSelect = document.getElementById("team-select");
    if (!teamSelect) return;

    const allMatches = normalizeMatchData(matchData);
    const teamsSet = new Set();

    allMatches.forEach(match => {
        if (Array.isArray(match.teamsInvolved)) {
            match.teamsInvolved.forEach(team => teamsSet.add(team));
        }
    });

    const sortedTeams = Array.from(teamsSet).sort((a, b) => a.localeCompare(b));

    teamSelect.innerHTML = 
    `<option value="All">All</option>` +
    sortedTeams.map(team => `
        <option value="${team}" ${team.toLowerCase() === currentTeam?.toLowerCase() ? 'selected' : ''}>
            ${team}
        </option>
    `).join('');
}

function generateTeamMatches(teamName, selectedSeason) {
    const allMatches = normalizeMatchData(matchData);

    let teamMatches = allMatches.filter(match => match.teamsInvolved?.includes(teamName));
    if (selectedSeason) {
        teamMatches = teamMatches.filter(match => String(match.season) === String(selectedSeason));
    }

    if (teamMatches.length === 0) {
        matchHistoryBox.innerHTML = `<p>No matches found for ${teamName}${selectedSeason ? ` in Season ${selectedSeason}` : ''}.</p>`;
        return;
    }

    teamMatches.sort((a, b) => {
        const aDate = new Date(`${a.matchDate}T${a.time || "00:00:00"}`);
        const bDate = new Date(`${b.matchDate}T${b.time || "00:00:00"}`);
        return bDate - aDate;
    });

    const locale = localStorage.getItem("locale") || "en-GB";

    const rowsHTML = teamMatches.map(match => {
        const otherTeam = match.teamsInvolved.find(t => t !== teamName) || "TBC";
        const scoreData = getScoreForTeam(match, teamName);
        
        let scoreDisplay = "Upcoming";
        let winStatus = "-";

        if (scoreData) {
            scoreDisplay = `${scoreData.teamScore} - ${scoreData.otherScore}`;
            if (scoreData.teamScore > scoreData.otherScore) {
                winStatus = "W";
            } else if (scoreData.teamScore < scoreData.otherScore) {
                winStatus = "L";
            } else {
                winStatus = "D";
            }
        }

        const matchCalculatorLink = generate6v6ScoreCalculatorLink(match);
        const rowClickAttr = matchCalculatorLink ? `onclick="window.location.href='${matchCalculatorLink}'"` : '';

        return `
            <tr class="standings-row" ${rowClickAttr}>
                <td class="column-team">
                    <div class="match-team">
                        <picture>
                            <source srcset="${getEmblem(otherTeam).avif}" type="image/avif">
                            <img loading="lazy" src="${getEmblem(otherTeam).png}" class="team-logo" alt="${otherTeam} logo">
                        </picture>
                        <span class="team-name">${otherTeam}</span>
                    </div>
                </td>
                <td class="column-date">${formatDate(match.matchDate, locale)}</td>
                <td class="column-result">
                    ${winStatus}
                </td>
                <td class="column-points">
                    <strong>${scoreData.teamScore}</strong>
                </td>

            </tr>
        `;
    }).join("");

    matchHistoryBox.innerHTML = `
        <table class="standings-table">
            <thead>
                <tr>
                    <th class="column-team">Opponent</th>
                    <th class="column-opponent">Date</th>
                    <th class="column-result">Result</th>
                    <th class="column-points">Points</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;
}



async function showTeamMatches() {
    teamNameFromURL = getTeamFromURL();

    if (!teamNameFromURL) {
        window.location.href = "/results/";
        return;
    }

    document.title = `${teamNameFromURL} Results | UMKL`;
    
    const headingElem = document.getElementById("results-heading-team");
    if (headingElem) {
        headingElem.textContent = `${teamNameFromURL} Results`;
    }

    const seasonSelect = document.getElementById("season-select");
    const getSelectedSeason = () => seasonSelect ? seasonSelect.value : null;

    const teamSelect = document.getElementById("team-select");

    // Fill emblem box with team colour and emblem
    if (teamEmblemBox && teamNameFromURL) {

        const em = getEmblem(teamNameFromURL);
        teamEmblemBox.innerHTML = `
            <picture>
                <source srcset="${em.avif}" type="image/avif">
                <img loading="lazy" src="${em.png}" alt="${teamNameFromURL} emblem" />
            </picture>
        `;
    }

    seasonSelect?.addEventListener("change", () => {
        generateTeamMatches(teamNameFromURL, getSelectedSeason());
    });

    teamSelect?.addEventListener("change", (e) => {
        const selectedTeam = e.target.value;
        if (selectedTeam == "All") {
            window.location.href = `/standings/`;
        }
        else if (selectedTeam && selectedTeam !== teamNameFromURL) {
            window.location.href = `/standings/details/?team=${encodeURIComponent(selectedTeam)}`;
        }

    });

    const cached = getMatchCache();
    if (cached) {
        matchData = cached;
        populateTeamDropdown(teamNameFromURL);
        generateTeamMatches(teamNameFromURL, getSelectedSeason());
    }

    try {
        const fresh = await getMatchData();
        setMatchCache(fresh);
        matchData = fresh;
        populateTeamDropdown(teamNameFromURL);
        generateTeamMatches(teamNameFromURL, getSelectedSeason());
    } catch (error) {
        if (!cached) {
            matchHistoryBox.innerHTML = `<p>Failed to load match history.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", showTeamMatches);