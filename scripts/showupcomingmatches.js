/*
    This script dynamically generates the upcoming matches section
    on the home page of the site.
*/

const upcomingMatchesBox = document.getElementById("upcomingMatchesBox");
const upcomingMatchesError = document.getElementById("upcomingMatchesError");
const MATCH_LENGTH_MINS = 90;
let matchData = [];
let matchDataToUse = [];
let teamColors = [];

let overseasDateDisplay = true; // forced on this page since I can't get it working otherwise 

let refreshTimer = null;

let startTime;

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

async function getTeamColors() {
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

function normalizeMatchData(matchData) {
    const localMatchData = {};

    Object.keys(matchData).forEach(dateKey => {
        matchData[dateKey].forEach(entry => {
            const matchDate = new Date(`${dateKey}T${entry.time}`);

            const localYear = matchDate.getFullYear();
            const localMonth = matchDate.getMonth() + 1;
            const localDay = matchDate.getDate();

            const localDateKey = `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;

            if (!localMatchData[localDateKey]) {
                localMatchData[localDateKey] = [];
            }
            localMatchData[localDateKey].push(entry);
        });
    });

    return localMatchData;
};

function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

async function showUpcomingMatches() {
    const pad = n => String(n).padStart(2, '0');
    const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const getLocalDate = (offsetDays = 0) => {
        const now = new Date();
        now.setDate(now.getDate() + offsetDays);
        return formatDate(now);
    };

    function formatDateWithoutYear(dateStr, locale = "en-GB") {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.toLocaleString(locale, { month: "long" });
        return `${day} ${month}`;
    }

    const todayStr = getLocalDate(0);
    const tomorrowStr = getLocalDate(1);

    if (overseasDateDisplay) {
        matchDataToUse = normalizeMatchData(matchData);
    } else {
        matchDataToUse = matchData;
    }

    const matches = [
        ...(matchDataToUse[todayStr] || []),
        ...(matchDataToUse[tomorrowStr] || [])
    ].filter(match => {
        return !match.endTime;
    });

    upcomingMatchesBox.innerHTML = ``;

    if (matches.length > 0) {
        const locale = localStorage.getItem("locale") || "en-GB";

        let html = `<h2>Upcoming Matches</h2>
        <a href="pages/matches/">View all matches</a>
        <div class="after-title match-container-list">`;

        const sortedMatches = [...matches].sort((a, b) => {
            const timeA = a.time || '00:00:00';
            const timeB = b.time || '00:00:00';
            return timeA.localeCompare(timeB);
        });

        for (const entry of sortedMatches) {
            function createTeamObject(teamName) {
                return {
                    team_name: teamName,
                    class_name: teamName.replace(/\s+/g, ''),
                    link: `pages/teams/details/?team=${teamName}`
                };
            }

            const [team1, team2] = entry.teamsInvolved.map(createTeamObject);

            const matchDateStr = (matchDataToUse[todayStr]?.includes(entry) ? todayStr : tomorrowStr);
            const formattedDate = formatDateWithoutYear(parseLocalDate(matchDateStr));
            
            let timeString = entry.time || '00:00:00';
            const { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone } = formatMatchTime(matchDateStr, timeString, locale);
            
            let formattedLocalDate, dayRelation;
            if (outsideUKTimezone) {
                formattedLocalDate = new Date(`${matchDateStr}T${timeString}`).toLocaleString(locale, { dateStyle: "short" });
                dayRelation = compareDayRelation(formattedLocalDate, matchDateStr);
            }

            let isLive = false;
            if (entry.time) {
                const [hours, minutes] = entry.time.split(':');
                const dateObj = new Date(matchDateStr);
                dateObj.setHours(Number(hours), Number(minutes), 0, 0);

                const now = new Date();
                const matchStart = dateObj;
                const matchEnd = new Date(matchStart.getTime() + MATCH_LENGTH_MINS * 60 * 1000);
                if (now >= matchStart && now <= matchEnd) {
                    isLive = true;
                }
            }

            if (entry.ytLinks) {
                team1.ytLink = entry.ytLinks[0]
                team2.ytLink = entry.ytLinks[1]
            }

            const isoStr = `${matchDateStr}T${entry.time}`;
            const dateObj = new Date(isoStr);
            const londonFormatter = new Intl.DateTimeFormat("en-GB", {
                timeZone: "Europe/London",
                timeZoneName: "short"
            });
            const parts = londonFormatter.formatToParts(dateObj);
            const zoneName = parts.find(p => p.type === "timeZoneName")?.value || "";

            let timeUntilMatch;
            if (!isLive) {
                const now = new Date();
                const diffMs = dateObj.getTime() - now.getTime();

                if (diffMs <= 0) {
                    timeUntilMatch = "0:00:00";
                    isLive = true;
                } else {
                    const totalSeconds = Math.floor(diffMs / 1000);
                    const days = Math.floor(totalSeconds / 86400);
                    const hours = Math.floor((totalSeconds % 86400) / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    timeUntilMatch = `${days > 0 ? `${days.toString()}d ` : ''}${hours.toString()}:${minutes
                        .toString()
                        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                }
            }
            if (!isLive) {
                let interval = setInterval(async () => {
                    const countdownElement = document.getElementById(`matchCountdown${entry.eventID}`);
                    if (!countdownElement) {
                        clearInterval(interval);
                        return;
                    }

                    const now = new Date();
                    const diffMs = dateObj.getTime() - now.getTime();

                    if (diffMs <= 0) {
                        countdownElement.innerHTML = "0:00:00";
                        isLive = true;
                        clearInterval(interval);
                        matchData = await getMatchData();
                        showUpcomingMatches();
                    } else {
                        const totalSeconds = Math.floor(diffMs / 1000);
                        const days = Math.floor(totalSeconds / 86400);
                        const hours = Math.floor((totalSeconds % 86400) / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        countdownElement.innerHTML = `<i class="fa-solid fa-clock"></i> ${days > 0 ? `${days.toString()}d `: ''}${hours.toString()}:${minutes
                            .toString()
                            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                    }
                }, 1000);
            }

            html += `            
            <div class="event-container">
                <div class="team-box-container">
                    <div class="team-background left ${team1.class_name}"></div>
                    <div class="team-background right ${team2.class_name}"></div>
                    ${!entry.testMatch ? `<img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.avif"
                    alt="Team background overlay"
                    onload="this.style.opacity=1" loading="lazy"/>` : ''}
                    
                    ${entry.testMatch ? `<div class="test-match-indicator"><i class="fa-solid fa-test"></i> Test match</div>` : ''}
                    ${isLive ? `<div class="test-match-indicator ${entry.testMatch ? 'push-lower' : ''}"><span style="display:flex"><div class="live-dot"></div>Live</span></div>` : `<div class="test-match-indicator ${entry.testMatch ? 'push-lower' : ''}" id="matchCountdown${entry.eventID}"><i class="fa-solid fa-clock"></i> ${timeUntilMatch}</div>`}
                    
                    <div class="event-overlay">
                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link team-box-underline-hover" href="${team1.link}">
                                <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team1.team_name.toUpperCase()}.avif"
                                alt="${makePossessive(team1.team_name)} team logo"
                                onload="this.style.opacity=1" loading="lazy"
                                onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';"/>
                                <h2>${team1.team_name}</h2>
                            </a>
                            <div class="youtube-box left-team">
                                ${team1.ytLink ? `
                                <a class="no-underline-link-footer fa-brands fa-youtube ${isLive ? 'youtube-live-animation' : 'no-color-link'}"
                                href="${team1.ytLink}" target="_blank" title="Open the livestream"></a>` : ''}
                            </div>
                        </div>

                        <div class="score-box">VS</div>       

                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link team-box-underline-hover" href="${team2.link}">
                                <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team2.team_name.toUpperCase()}.avif"
                                alt="${makePossessive(team1.team_name)} team logo"
                                onload="this.style.opacity=1" loading="lazy"
                                onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';"/>
                                <h2>${team2.team_name}</h2>
                            </a>
                            <div class="youtube-box right-team">
                                ${team2.ytLink ? `
                                <a class="no-underline-link-footer fa-brands fa-youtube ${isLive ? 'youtube-live-animation' : 'no-color-link'}"
                                href="${team2.ytLink}" target="_blank" title="Open the livestream"></a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="match-details-box">
                    <div class="match-detail-container match-date-field">
                        <i class="fa-solid fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="match-date-time-box">
                        <div class="match-detail-container">
                            ${overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ``}
                            <i class="${outsideUKTimezone ? 'local-time-clock' : ''} fa-solid fa-clock"></i>
                            <h2>
                                <span title="${zoneName}">${formattedMatchTime}</span>
                                ${outsideUKTimezone ? `
                                    <span title="Local time" style="display: inline-flex; align-items: center;">
                                    |&nbsp;<i class="overseas-time-clock fa-solid fa-clock"></i>${formattedLocalMatchTime}</span>` : ''}
                            </h2>       
                            ${!overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ``}                     
                            ${isLive ? '<div class="live-dot"></div>' : ''}
                        </div>
                    </div>
                    <p class="match-season">${entry.testMatch ? "<span class='settings-extra-info'>Test match</span>" : `Season ${entry.season}`}</p>
                </div>
                <details class="match-box">
                    <summary>Match details</summary>
                    <p class="match-description">${autoLink(entry.description)}</p>
                </details>
            </div>
            `;
        };
        html += `</div><hr />`;

        upcomingMatchesBox.classList.add('fade-in');
        upcomingMatchesBox.innerHTML += html;
    }
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

function compareDayRelation(dateStr1, dateStr2) {
    function parseDate(str) {
        if (str.includes('/')) {
            const [day, month, year] = str.split('/').map(Number);
            return new Date(year, month - 1, day);
        } else if (str.includes('-')) {
            const [year, month, day] = str.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        throw new Error("Unsupported date format: " + str);
    }

    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);

    const day1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const day2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());

    const diffDays = Math.round((day1 - day2) / (1000 * 60 * 60 * 24));

    if (overseasDateDisplay) {
        if (diffDays === -1) return `Day<br>after`;
        if (diffDays === 1) return `Day<br>before`;
    } else {
        if (diffDays === 1) return `Day<br>after`;
        if (diffDays === -1) return `Day<br>before`;
    }
    return "";
}

function autoLink(text) {
    text = text.replaceAll("\n", "<br>")
    const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
    return text.replace(urlRegex, function (url) {
        let href = url;
        let displayUrl = url;
        let trailingDot = '';
        if (displayUrl.endsWith('.')) {
            displayUrl = displayUrl.slice(0, -1);
            href = href.slice(0, -1);
            trailingDot = '.';
        }
        if (!href.match(/^https?:\/\//)) {
            href = 'http://' + href;
        }
        return `<a href="${href}" target="_blank">${displayUrl}</a>${trailingDot}`;
    });
}

function makePossessive(name) {
    if (!name) return '';
    if (name.endsWith('s') || name.endsWith('S')) {
        return `${name}'`;
    }
    return `${name}'s`;
}

function makeTeamsColorStyles() {
    const styleSheet = document.createElement("style");

    teamColors.forEach((team) => {
        styleSheet.innerText += `
            .${team.team_name.replace(/\s+/g, '')} {
                cursor: pointer;
                background-color: ${team.team_color};
            }
        `
    })

    document.head.appendChild(styleSheet);
}

document.addEventListener('startDayChange', () => {
    showUpcomingMatches();
});

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cshowupcomingmatches.js %c> %cFetching calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");

    try {
        matchData = await getMatchData();
        teamColors = await getTeamColors();
    } catch (error) {
        if (error && error.message && error.message.includes('429')) {
            upcomingMatchesError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.</blockquote>`;
            return;
        } else {
            console.debug(`%cshowupcomingmatches.js %c> %cAPI failed - using fallback information...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
            await getMatchDataFallback();
            await getTeamcolorsFallback();

            upcomingMatchesError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;

            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    if (typeof retryCount === 'undefined') {
                        window.retryCount = 1;
                    } else {
                        window.retryCount++;
                    }
                    matchData = await getMatchData();
                    teamColors = await getTeamColors();
                    upcomingMatchesError.innerHTML = "";
                    makeTeamsColorStyles();
                    showUpcomingMatches();
                } catch (err) {
                    upcomingMatchesError.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${window.retryCount}...</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }

    makeTeamsColorStyles();
    showUpcomingMatches();
    console.debug(`%cshowupcomingmatches.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
});