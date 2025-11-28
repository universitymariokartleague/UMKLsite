/*
    Displays a team's match history
    Shows their next match if they have one
*/

const matchHistoryBox = document.getElementById("JSMatchHistory");

let matchData = [];

function makePossessive(name) {
    if (!name) return '';
    if (name.endsWith('s') || name.endsWith('S')) {
        return `${name}'`;
    }
    return `${name}'s`;
}

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

function uses12HourClock(locale) {
    const test = new Date('1970-01-01T13:00');
    return test.toLocaleTimeString(locale).toLowerCase().includes('pm');
}

function formatMatchTime(date, timeString, locale) {
    const is12Hour = uses12HourClock(locale);

    const isoStr = `${date}T${timeString}`;
    const dateObj = new Date(isoStr);

    const UKTime = new Intl.DateTimeFormat(locale, {
        timeZone: "Europe/London",
        hour: is12Hour ? "numeric" : "2-digit",
        minute: "2-digit",
        hour12: is12Hour,
    }).format(dateObj);

    const localTime = new Intl.DateTimeFormat(locale, {
        hour: is12Hour ? "numeric" : "2-digit",
        minute: "2-digit",
        hour12: is12Hour,
    }).format(dateObj);

    let outsideUKTimezone = checkTimezoneMatches(date, timeString);

    let formattedMatchTime, formattedLocalMatchTime;
    if (outsideUKTimezone) {
        formattedMatchTime = UKTime;
        formattedLocalMatchTime = localTime;
    } else {
        formattedMatchTime = UKTime;
        formattedLocalMatchTime = null;
    }

    if (formattedMatchTime == formattedLocalMatchTime) {
        outsideUKTimezone = false;
    }

    return { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone };
}

function checkTimezoneMatches(dateStr, timeStr) {
    const match = timeStr.match(/([+-]\d{2}):([0-5]\d)$/);
    if (!match) return false;

    const [, offsetH, offsetM] = match;
    const offsetMinutes = parseInt(offsetH, 10) * 60 + parseInt(offsetM, 10) * (offsetH.startsWith("-") ? -1 : 1);

    const [hourStr, minuteStr] = timeStr.split(":");
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);

    const [year, month, day] = dateStr.split("-").map(Number);

    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    const londonTime = new Date(utcDate.toLocaleString("en-GB", { timeZone: "Europe/London" }));
    const londonOffsetMinutes = (londonTime - utcDate) / 60000;

    return offsetMinutes !== londonOffsetMinutes;
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
        await getMatchDataFallback();
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

        const locale = localStorage.getItem("locale") || "en-GB";
        let timeString = match.time || '00:00:00';
        const { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone } = formatMatchTime(match.matchDate, timeString, locale);

        const block = `
            <div class="team-match-card ${match.testMatch ? "test-match" : ""}" href="">
                <div class="match-card-wrapper">
                    <img src="${getEmblem(otherTeam)}" 
                        alt="${makePossessive(otherTeam)} emblem"
                        class="team-match-emblem" width="40" height="40"
                        onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';">
                    <h2>${otherTeam}</h2>
                    <div class="match-score ${resultClass}">
                        ${scoreHTML}
                    </div>
                </div>
                <hr>
                <div class="match-details-wrapper">
                    <span id="match-season"><a href="pages/matches/?date=${match.matchDate}">${match.testMatch ? 'Test match' : `Season ${match.season}`}</a></span>
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
