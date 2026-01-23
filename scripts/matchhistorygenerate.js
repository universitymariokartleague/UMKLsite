/*
    This script displays a team's match history,
    and shows their next match if they have one.
*/

import { generate6v6ScoreCalculatorLink } from './matchhelper.js';

const matchHistoryBox = document.getElementById("JSMatchHistory");
const MATCH_LENGTH_MINS = 90;

let matchData = [];
let startTime;

const makePossessive = name =>
    !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

const getTeamFromURL = () =>
    new URLSearchParams(window.location.search).get("team");

const getEmblem = teamName =>
    `assets/media/teamemblems/${teamName.toUpperCase()}.avif`;

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

const getResultClass = (t, o) =>
    t > o ? "win" : t < o ? "loss" : "draw";

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

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, {
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
    startTime = performance.now();
    console.debug(`%cteaminfogenerate.js %c> %cGenerating team info box`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
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
    const locale = localStorage.getItem("locale") || "en-GB";
    const textColor = getComputedStyle(document.body).getPropertyValue('--highlight-color').slice(0, -2);

    const style = document.createElement('style');
    style.innerHTML = `
        a.team-link-color:link { color: ${textColor}!important }
        a.team-link-color:visited { color: ${textColor}!important }
        a.team-link-color:hover { color: ${textColor}!important }
    `
    document.head.appendChild(style);

    let upcomingBlocks = [];
    let completedBlocks = [];

    teamMatches.forEach(match => {
        const matchDateTime = new Date(`${match.matchDate}T${match.time || "00:00:00"}`);
        const isCompleted = matchDateTime < now || match.endTime;

        const otherTeam = match.teamsInvolved.find(t => t !== teamName) || "TBC";

        const scoreData = getScoreForTeam(match, teamName);

        let scoreHTML = "Upcoming";
        let resultClass = "draw";
        let matchDetailsLink = '';

        if (scoreData) {
            scoreHTML = `${scoreData.teamScore} - ${scoreData.otherScore}`;
            resultClass = getResultClass(scoreData.teamScore, scoreData.otherScore);
            matchDetailsLink = generate6v6ScoreCalculatorLink(match);
        }

        let timeString = match.time || '00:00:00';
        const { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone } = formatMatchTime(match.matchDate, timeString, locale);

        let isLive = false;
        if (match.time) {
            const [hours, minutes] = match.time.split(':');
            const dateObj = new Date(match.matchDate);
            dateObj.setHours(Number(hours), Number(minutes), 0, 0);

            const matchStart = dateObj;
            const matchEnd = new Date(matchStart.getTime() + MATCH_LENGTH_MINS * 60 * 1000);
            if (now >= matchStart && now <= matchEnd) {
                isLive = true;
                scoreHTML = `<span style="display:flex; color:${textColor}"><div class="live-dot live-dot-adjusted"></div>Live</span>`;
                resultClass = "live";
            }
        }

        const otherTeamLink = `pages/teams/details/?team=${otherTeam}`;

        const block = `
            <div class="team-match-card ${match.testMatch ? "test-match" : ""}" href="">
                <div class="match-card-wrapper">
                    <a href="${otherTeamLink}">    
                        <img src="${getEmblem(otherTeam)}" 
                            alt="${makePossessive(otherTeam)} emblem"
                            class="team-match-emblem" width="40" height="40"
                            onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';">
                    </a>
                    <h2 class="team-title"><a href="${otherTeamLink}">${otherTeam}</a></h2>
                    <div class="match-score ${resultClass}">
                        ${matchDetailsLink ? `<a href="${matchDetailsLink}" title="View detailed results">${scoreHTML}</a>` : scoreHTML}
                    </div>
                </div>
                <hr>
                <div class="match-details-wrapper">
                    <span id="match-season">${match.testMatch ? 'Test match' : `Season ${match.season}`}</span>
                    <span id="match-date"><a class="team-link-color" href="pages/matches/?date=${match.matchDate}">${formattedMatchTime} ${formatDate(match.matchDate, locale)}</a></span>
                </div>
            </div>
        `;

        if (isCompleted) {
            completedBlocks.push(block);
        } else {
            upcomingBlocks.push(block);
        }
    });

    matchHistoryBox.innerHTML = `
        <div class="team-match-history">
            ${upcomingBlocks.length ? `<h2>Next Match</h2>${upcomingBlocks.join("")}<hr>` : ''}
            <h2>Match History</h2>
            ${completedBlocks.length ? completedBlocks.join("") : "<p>No previous matches.</p>"}
        </div>`;

    matchHistoryBox.classList.add('fade-in');

    console.debug(`%cmatchhistorygenerate.js %c> %cGenerated match history in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9b87ff", "color:#fff", "color:#c8bdff");
}

document.addEventListener('startDayChange', () => {
    showTeamMatches();
});

document.addEventListener("DOMContentLoaded", showTeamMatches);