import { generate6v6ScoreCalculatorLink } from '/assets/scripts/utils/matchhelper.js';
import { getMatchData, normalizeMatchData, getMatchCache, setMatchCache } from '/assets/scripts/utils/matchdata.js';

const matchHistoryBox = document.getElementById("JSMatchHistory");
let matchData = [];

const getTeamFromURL = () => new URLSearchParams(window.location.search).get("team");

const getEmblem = teamName => ({
    avif: `https://api.umkl.co.uk/teamemblems/${teamName.toUpperCase()}`,
    png: `https://api.umkl.co.uk/teamemblems/${teamName.toUpperCase()}`
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

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

function generateTeamMatches(teamName) {
    const allMatches = normalizeMatchData(matchData);
    const teamMatches = allMatches.filter(match => match.teamsInvolved?.includes(teamName));

    if (teamMatches.length === 0) {
        matchHistoryBox.innerHTML = `<p style="margin-top: 0px;">No matches found for ${teamName}.</p>`;
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

        let winStatus = "-";

        if (scoreData) {
            if (scoreData.teamScore > scoreData.otherScore) {
                winStatus = "W";
            } else if (scoreData.teamScore < scoreData.otherScore) {
                winStatus = "L";
            } else {
                winStatus = "D";
            }
        }

        const resultClass = { W: "result-win", L: "result-loss", D: "result-draw" }[winStatus] || "";

        const matchCalculatorLink = generate6v6ScoreCalculatorLink(match);
        const rowClickAttr = matchCalculatorLink ? `onclick="window.location.href='${matchCalculatorLink}'"` : '';

        return `
            <tr class="standings-row${match.testMatch ? " test-match-row" : ""}" ${rowClickAttr}>
                <td class="column-team">
                    <div class="match-team">
                        <picture>
                            <source srcset="${getEmblem(otherTeam).avif}" type="image/avif">
                            <img loading="lazy" src="${getEmblem(otherTeam).png}" class="team-logo" alt="${otherTeam} logo">
                        </picture>
                        <div class="match-team-info">
                            <span class="team-name">${otherTeam}</span>
                            <span class="team-date">${formatDate(match.matchDate, locale)}</span>
                            <span class="team-season-mobile">${match.testMatch ? "Test match" : `Season ${match.season}`}</span>
                        </div>
                    </div>
                </td>
                <td class="column-season">${match.testMatch ? "Test match" : `Season ${match.season}`}</td>
                <td class="column-result">
                    ${winStatus}
                </td>
                <td class="column-points">
                    <strong class="result-badge ${resultClass}">${scoreData ? scoreData.teamScore : "-"}</strong>
                </td>

            </tr>
        `;
    }).join("");

    matchHistoryBox.innerHTML = `
        <div class="match-history-table-wrapper">
            <table class="standings-table match-history-table">
                <thead>
                    <tr>
                        <th class="column-team">Team</th>
                        <th class="column-season">Season</th>
                        <th class="column-result"><span class="th-full">Result</span><span class="th-short">W/L</span></th>
                        <th class="column-points"><span class="th-full">Points</span><span class="th-short">Pts</span></th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>
        </div>
    `;
}

async function showTeamMatches() {
    if (!matchHistoryBox) return;

    const teamNameFromURL = getTeamFromURL();
    if (!teamNameFromURL) return;

    const cached = getMatchCache();
    if (cached) {
        matchData = cached;
        generateTeamMatches(teamNameFromURL);
    }

    try {
        const fresh = await getMatchData();
        setMatchCache(fresh);
        matchData = fresh;
        generateTeamMatches(teamNameFromURL);
    } catch (error) {
        if (!cached) {
            matchHistoryBox.innerHTML = `<p>Failed to load match history.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", showTeamMatches);
