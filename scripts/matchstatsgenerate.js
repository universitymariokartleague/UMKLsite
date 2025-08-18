/*
    This script generates a user's info page.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        <div class="team-info-text">
            {{extraFields}}
        </div>
    </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const teamNameBox = document.getElementById("teamNameBox")
const startYear = 2023;

let matchData, teamColors;
const currentSeason = 2;
let fetchedCurrentSeason = currentSeason;

const UPDATEINVERVAL = 30000;
let refreshTimer = null;

let startTime;

function buildUserInfoTable(data) {
    const resultString = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .map(([track, count]) => `${track}: ${count}`)
        .join("<br>");

    return `
        <table class="team-info-table">
            <tr><td class="table-key">Track Frequency</td><td>${resultString}</td></tr>
        </table>`;
}

async function generateMatchStatsBox(showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    const trackCounts = {};

    for (const date in matchData) {
        const matches = matchData[date];
        for (const match of matches) {
            if (!match.detailedResults) continue;
            for (const result of match.detailedResults) {
                const track = result.track;
                trackCounts[track] = (trackCounts[track] || 0) + 1;
            }
        }
    }

    console.log(trackCounts);

    const extraFields = buildUserInfoTable(trackCounts);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{currentSeason}}", fetchedCurrentSeason)
        .replace("{{extraFields}}", extraFields);

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
            return response.json();
        });
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cmatchstatsgenerate.js %c> %cGenerating match stats box`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    JSTeamBox.innerHTML = "Loading match information...";

    let showError = 0;

    try {
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