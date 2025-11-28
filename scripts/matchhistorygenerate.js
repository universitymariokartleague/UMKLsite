/*
    Displays a team's match history
    Shows their next match if they have one
*/

const matchHistoryBox = document.getElementById("JSMatchHistory");

let matchData = [];

function getTeamFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("team");
}

function getEmblem(teamName) {
    return `assets/media/teamemblems/${teamName.toUpperCase()}.avif`;
}

function getScoreForTeam(match, teamName) {
    if (!match.results || !match.teamsInvolved) return null;

    const teams = match.teamsInvolved;
    const score = match.results;

    const teamIndex = teams.indexOf(teamName);

    if (teamIndex === -1) {
        return null
    };

    const otherIndex = teamIndex === 0 ? 1 : 0;


    if (!score[teamIndex] || !score[otherIndex]) return null;

    const teamScore = score[teamIndex][1];
    const otherScore = score[otherIndex][1];

    return {
        teamScore,
        otherScore
    };
}


function getResultClass(teamScore, otherScore) {
    if (teamScore > otherScore) return "win";
    if (teamScore < otherScore) return "loss";
    return "draw";
}


async function getMatchData() {
    const res = await fetch("https://api.umkl.co.uk/matchdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
    });

    if (!res.ok) throw new Error("API failed");
    return res.json();
}

async function getMatchDataFallback() {
    const res = await fetch("database/matchdatafallback.json");
    if (!res.ok) throw new Error("Fallback failed");
    return res.json();
}

function normalizeMatchData(matchData) {
    const flat = [];

    Object.keys(matchData).forEach(dateKey => {
        matchData[dateKey].forEach(entry => {
            flat.push({
                ...entry,
                matchDate: dateKey
            });
        });
    });

    return flat;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatTime(dateStr, timeStr) {
    if (!timeStr) return "TBC";
    const d = new Date(`${dateStr}T${timeStr}`);
    return d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function showTeamMatches() {
    const teamName = getTeamFromURL();

    if (!teamName) {
        matchHistoryBox.innerHTML = "<b>Error:</b> No team specified.";
        return;
    }

    try {
        matchData = await getMatchData();
    } catch {
        matchData = await getMatchDataFallback();
    }

    const allMatches = normalizeMatchData(matchData);

    const teamMatches = allMatches.filter(match =>
        match.teamsInvolved?.includes(teamName)
    );

    if (teamMatches.length === 0) {
        matchHistoryBox.innerHTML = `<p>No matches found for ${teamName}.</p>`;
        return;
    }

    teamMatches.sort((a, b) => {
        const aDate = new Date(`${a.matchDate}T${a.time || "00:00:00"}`);
        const bDate = new Date(`${b.matchDate}T${b.time || "00:00:00"}`);
        return bDate - aDate;
    });

    const now = new Date();

    let upcomingHTML = `<h2>Next Match</h2>`;
    let completedHTML = `<h2>Match History</h2>`;

    let hasUpcomingMatches = false;
    let hasCompletedMatches = false;

    teamMatches.forEach(match => {
        const matchDateTime = new Date(`${match.matchDate}T${match.time || "00:00:00"}`);
        const isCompleted = matchDateTime < now || match.endTime;

        const otherTeam = match.teamsInvolved.find(t => t !== teamName) || "TBC";

        const scoreData = getScoreForTeam(match, teamName);

        let scoreHTML = "Upcoming";
        let resultClass = "draw";

        if (scoreData) {
            scoreHTML = `${scoreData.teamScore} - ${scoreData.otherScore}`;
            resultClass = getResultClass(scoreData.teamScore, scoreData.otherScore);
        }

        const block = `
            <div class="team-match-card ${match.testMatch ? "test-match" : ""}" href="">

                <div class="match-card-wrapper">
                    <img src="${getEmblem(otherTeam)}" 
                        alt="${otherTeam} Emblem"
                        class="team-match-emblem"
                        width="40" height="40"
                        onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';">

                    <h2>${otherTeam}</h2>

                    <div class="match-score ${resultClass}">
                        ${scoreHTML}
                    </div>
                </div>
                <hr>

                <div class="match-details-wrapper">
                    <span id="match-season">${match.testMatch ? 'Test Match' : `Season ${match.season}`}</span>
                    <span id="match-date">${formatDate(match.matchDate)}</span>
                </div>

            </div>
        `;


        if (isCompleted) {
            hasCompletedMatches = true;
            completedHTML += block;
        } else {
            hasUpcomingMatches = true;
            upcomingHTML += block;
        }
    });

    if (!hasUpcomingMatches) upcomingHTML += `<p>No upcoming matches.</p>`;
    if (!hasCompletedMatches) completedHTML += `<p>No previous matches.</p>`;

    matchHistoryBox.innerHTML = `
        <div class="team-match-history">
            ${hasUpcomingMatches ? upcomingHTML + "<hr>" : ""}
            ${completedHTML}
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", showTeamMatches);
