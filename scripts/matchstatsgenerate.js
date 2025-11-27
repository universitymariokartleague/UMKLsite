/*
    This script generates stats about matches.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        {{trackCounts}}
    </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const startYear = 2023;

const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const maxPos = scoreMap.length

let matchData, teamColors;
const currentSeason = 2;
let fetchedCurrentSeason = currentSeason;

const UPDATEINVERVAL = 30000;
let refreshTimer = null;

let startTime;

const testMatchesCheckbox = document.getElementById("testMatches");
const pointsDiffCheckbox = document.getElementById("pointsDiff");
const teamFrequencyCheckbox = document.getElementById("teamFrequency");
const daysPlayedCheckbox = document.getElementById("daysPlayed");

function buildTrackCountDiv(data) {
    const sorted = Object.entries(data).sort((a, b) => b[1].count - a[1].count);
    const maxCount = sorted[0]?.[1].count;

    let teamFrequencyString;
    let datesPlayedString;

    const resultString = sorted
        .map(([track, stats]) => {
            const avgDiff = (stats.totalDiff / stats.count).toFixed(1);
            
            if (teamFrequencyCheckbox.checked) {
                const sortedTeams = Object.entries(stats.teamCounts)
                    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

                teamFrequencyString = '<b>Frequency for teams</b><br/>' + sortedTeams
                    .map(([team, count]) => `${team}: ${count}`)
                    .join("<br>");
            }

            if (daysPlayedCheckbox.checked) {
                datesPlayedString = '<b>Dates played on</b><br/>' + 
                    stats.matchDates
                        .map(date => `<a target="_blank" href="pages/matches?date=${date}">${date}</a>`)
                        .join("<br>");
            }
            
            return `
                <div class="track-item">
                    <img class="track-icon" onload="this.style.opacity=1" loading="lazy" src="assets/media/courses/mk8dxicons/${track.replaceAll(' ', '_').replaceAll("'", '').toLowerCase()}.avif" alt="The icon for ${track}">
                    <span class="track-label">
                        ${stats.count === maxCount ? "☆ " : ""}<b>${track}</b><br>
                        Played ${stats.count} ${stats.count === 1 ? "time" : "times"}<br>
                        ${teamFrequencyCheckbox.checked ? `<hr style="margin:4px 0 4px 0;" />${teamFrequencyString}` : ''}
                        ${pointsDiffCheckbox.checked ? `<hr style="margin:4px 0 4px 0;" /><span class="settings-extra-info">Avg diff: ${avgDiff}</span>` : ''}
                        ${daysPlayedCheckbox.checked ? `<hr style="margin:4px 0 4px 0;" />${datesPlayedString}` : ''}
                    </span>
                </div>
            `;
        })
        .join("");

    const length = Object.keys(data).length;

    return `
        <div class="title">
            <h2>Track Frequency</h2>
            <p class="p-no-spacing">${length}/96 total tracks played</p>
            ${testMatchesCheckbox.checked ? '<span class="settings-extra-info">(including test matches)</span>' : ''}
        </div>
        <div class="track-frequency">
            ${resultString}
        </div>
    `;
}

async function generateMatchStatsBox(showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    const trackStats = {};

    for (const date in matchData) {
        const matches = matchData[date];
        for (const match of matches) {
            if (!match.detailedResults) continue;
            if (!testMatchesCheckbox.checked && match.testMatch === true) continue;

            const teams = match.teamsInvolved || [];

            for (const result of match.detailedResults) {
                const track = result.track;

                const score1 = result["1"].reduce((sum, pos) => sum + calculateScore(pos), 0);
                const score2 = result["2"].reduce((sum, pos) => sum + calculateScore(pos), 0);
                const difference = Math.abs(score1 - score2);

                if (!trackStats[track]) {
                    trackStats[track] = {
                        count: 0,
                        totalDiff: 0,
                        matchDates: [],
                        teamCounts: {}
                    };
                }

                trackStats[track].count++;
                trackStats[track].totalDiff += difference;

                if (!trackStats[track].matchDates.includes(date)) {
                    trackStats[track].matchDates.push(date);
                }

                teams.forEach(team => {
                    if (!trackStats[track].teamCounts[team]) {
                        trackStats[track].teamCounts[team] = 0;
                    }
                    trackStats[track].teamCounts[team]++;
                });
            }
        }
    }

    const extraFields = buildTrackCountDiv(trackStats);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{trackCounts}}", extraFields);

    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');

    showErrorBox(showError);
}

function showErrorBox(showError) {
    let errorBlock = document.getElementById("team-api-error");
    const mainElem = document.querySelector("main");

    if (showError === 1 || showError === 2) {
        if (!errorBlock) {
            errorBlock = document.createElement("blockquote");
            errorBlock.className = "fail";
            errorBlock.id = "team-api-error";
            if (mainElem) mainElem.appendChild(errorBlock);
        }
        if (showError === 1) {
            const retryMsg = window.retryCount ? `<b>API error - Retrying: attempt ${window.retryCount}</b><br>` : "<b>API error</b><br>";
            errorBlock.innerHTML = `${retryMsg}Failed to fetch user data from the API, the below information may not be up to date!`;
        } else {
            errorBlock.innerHTML = "<b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.";
        }
    } else if (errorBlock) {
        errorBlock.remove();
    }
}

function calculateScore(position) {
    return scoreMap[position - 1] || 1; // Default to 1 if position is out of range
}

async function getMatchData() {
    return fetch('https://api.umkl.co.uk/matchdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: "{}"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

async function getMatchDataFallback() {
    const response = await fetch(`database/matchdatafallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    matchData = await response.json();
}

async function getTeamcolors() {
    return fetch('https://api.umkl.co.uk/teamcolors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: "{}"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

async function getTeamcolorsFallback() {
    const response = await fetch(`database/teamcolorsfallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    teamColors = await response.json();
}

async function getCurrentSeason() {
    return fetch('https://api.umkl.co.uk/seasoninfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            season: 0
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cmatchstatsgenerate.js %c> %cGenerating match stats box`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    JSTeamBox.innerHTML = "Loading match information...";

    let showError = 0;

    try {
        fetchedCurrentSeason = await getCurrentSeason();
        matchData = await getMatchData();
        teamColors = await getTeamcolors();
    } catch (error) {
        console.debug(`%cmatchstatsgenerate.js %c> %cAPI failed - using fallback information...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        await getMatchDataFallback();
        await getTeamcolorsFallback();

        if (error && error.message && error.message.includes('429')) {
            showError = 2;
        } else {
            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    if (typeof retryCount === 'undefined') {
                        window.retryCount = 1;
                    } else {
                        window.retryCount++;
                    }
                    fetchedCurrentSeason = await getCurrentSeason();
                    matchData = await getMatchData();
                    teamColors = await getTeamcolors();
                    showError = 0;
                    makeTeamsColorStyles();
                    await generateMatchStatsBox(showError);
                } catch (err) {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generateMatchStatsBox(showError);

    console.debug(`%cmatchstatsgenerate.js %c> %cGenerated match stats box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
});

testMatchesCheckbox.addEventListener("click", async function () {
    await generateMatchStatsBox();
});

pointsDiffCheckbox.addEventListener("click", async function () {
    await generateMatchStatsBox();
});

teamFrequencyCheckbox.addEventListener("click", async function () {
    await generateMatchStatsBox();
});

daysPlayedCheckbox.addEventListener("click", async function () {
    await generateMatchStatsBox();
});