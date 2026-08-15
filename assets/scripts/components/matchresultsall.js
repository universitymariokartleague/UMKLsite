import { generate6v6ScoreCalculatorLink } from '/assets/scripts/utils/matchhelper.js';

const allMatchesBox = document.getElementById("JSAllMatches");
let normalizedMatches = [];

const CACHE_KEY = 'matchDataCache';
const getMatchCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; } };
const setMatchCache = (data) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} };

const getEmblem = teamName => ({
    avif: `https://api.umkl.co.uk/teamemblems/${teamName.toUpperCase()}`,
    png: `https://api.umkl.co.uk/teamemblems/${teamName.toUpperCase()}?og`
});

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

function generateAllMatches(selectedSeason) {
    let filteredMatches = normalizedMatches;
    if (selectedSeason) {
        filteredMatches = normalizedMatches.filter(match => String(match.season) === String(selectedSeason));
    }

    if (filteredMatches.length === 0) {
        allMatchesBox.innerHTML = `<p>No matches found${selectedSeason ? ` for Season ${selectedSeason}` : ''}.</p>`;
        return;
    }

    filteredMatches = filteredMatches.slice().sort((a, b) => {
        const aDate = new Date(`${a.matchDate}T${a.time || "00:00:00"}`);
        const bDate = new Date(`${b.matchDate}T${b.time || "00:00:00"}`);
        return bDate - aDate;
    });

    const locale = localStorage.getItem("locale") || "en-GB";

    const rowsHTML = filteredMatches.map(match => {
        const teams = match.teamsInvolved || ["TBC", "TBC"];
        const teamA = teams[0] || "TBC";
        const teamB = teams[1] || "TBC";

        let scoreDisplay = "Upcoming";
        let winningTeam = "TBD";
        if (match.results && Array.isArray(match.results[0]) && Array.isArray(match.results[1])) {
            const scoreA = Number(match.results[0][1]);
            const scoreB = Number(match.results[1][1]);
            scoreDisplay = `${scoreA} - ${scoreB}`;
            if (!Number.isNaN(scoreA) && !Number.isNaN(scoreB)) {
                if (scoreA > scoreB) {
                    winningTeam = teamA;
                } else if (scoreB > scoreA) {
                    winningTeam = teamB;
                } else {
                    winningTeam = "Draw";
                }
            }
        }

        const emblemA = getEmblem(teamA);
        const emblemB = getEmblem(teamB);
        const emblemWinner = getEmblem(winningTeam);
        const matchCalculatorLink = generate6v6ScoreCalculatorLink(match);
        const hrefAttr = matchCalculatorLink ? ` data-href="${matchCalculatorLink}"` : '';

        return `
            <tr class="standings-row"${hrefAttr}>
                <td class="column-team fixed-width-column">
                    <div class="match-team team-a">
                        <span class="team-name">${teamA}</span>
                        <picture>
                            <source srcset="${emblemA.avif}" type="image/avif">
                            <img loading="lazy" src="${emblemA.png}" class="team-logo" alt="${teamA} logo">
                        </picture>
                    </div>
                </td>
                <td class="column-vs">VS</td>
                <td class="column-team">
                    <div class="match-team team-b">
                        <picture>
                            <source srcset="${emblemB.avif}" type="image/avif">
                            <img loading="lazy" src="${emblemB.png}" class="team-logo" alt="${teamB} logo">
                        </picture>
                        <span class="team-name">${teamB}</span>
                    </div>
                </td>

                <td class="column-date">${formatDate(match.matchDate, locale)}</td>
                <td class="column-score">
                    <strong>${scoreDisplay}</strong>
                </td>
                <td class="column-winner">
                    <div class="match-team">
                        <picture>
                            <source srcset="${emblemWinner.avif}" type="image/avif">
                            <img loading="lazy" src="${emblemWinner.png}" class="team-logo" alt="${teamB} logo">
                        </picture>
                        <span class="team-name">${winningTeam}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    allMatchesBox.innerHTML = `
        <table class="standings-table">
            <thead>
                <tr>
                    <th class="column-team"></th>
                    <th class="column-vs">Match</th>
                    <th class="column-team"></th>
                    <th class="column-date">Date</th>
                    <th class="column-score">Score</th>
                    <th class="column-winner">Winner</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;
}

allMatchesBox?.addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-href]");
    if (row) window.location.href = row.dataset.href;
});

async function renderAllMatches() {
    const seasonSelect = document.getElementById("season-select");
    const getSelectedSeason = () => seasonSelect ? seasonSelect.value : null;

    seasonSelect?.addEventListener("change", () => {
        generateAllMatches(getSelectedSeason());
    });

    const cached = getMatchCache();
    if (cached) {
        normalizedMatches = normalizeMatchData(cached);
        generateAllMatches(getSelectedSeason());
    }

    try {
        const fresh = await getMatchData();
        setMatchCache(fresh);
        normalizedMatches = normalizeMatchData(fresh);
        generateAllMatches(getSelectedSeason());
    } catch (error) {
        if (!cached) {
            allMatchesBox.innerHTML = `<p>Failed to load match data.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", renderAllMatches);