/*
    This script dynamically generates the upcoming matches section
    on the home page of the site.
*/

const upcomingMatchesBox = document.getElementById("upcomingMatchesBox");
const upcomingMatchesError = document.getElementById("upcomingMatchesError");
const MATCH_LENGTH_MINS = 90;
let matchData = {};
let teamColors = {};

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

function showUpcomingMatch() {
    const getUKDate = (offsetDays = 0) => {
        const now = new Date();

        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        const parts = formatter.formatToParts(now);
        let year = parseInt(parts.find(p => p.type === 'year').value);
        let month = parseInt(parts.find(p => p.type === 'month').value);
        let day = parseInt(parts.find(p => p.type === 'day').value);

        day += offsetDays;

        const ukDate = new Date(Date.UTC(year, month - 1, day));

        return ukDate;
    };

    const todayUK = getUKDate(0);
    const tomorrowUK = getUKDate(1);
    
    const pad = n => String(n).padStart(2, '0');
    const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = formatDate(todayUK);
    const tomorrowStr = formatDate(tomorrowUK);

    // Get all matches from today and tomorrow
    const now = new Date();
    const matches = [
        ...(matchData[todayStr] || []),
        ...(matchData[tomorrowStr] || [])
    ].filter(match => {
        const [hours, minutes] = match.time.split(':').map(Number);
        const matchDateStr = (matchData[todayStr]?.includes(match) ? todayStr : tomorrowStr);
        const matchDate = new Date(matchDateStr);
        matchDate.setHours(hours, minutes, 0, 0);
        return (now - matchDate) <= MATCH_LENGTH_MINS * 60 * 1000;
    });

    upcomingMatchesBox.innerHTML = ``;

    if (matches.length > 0) {
        const locale = localStorage.getItem("locale") || "en-GB";

        let html = `<h2>Upcoming Matches</h2>
        <a href="pages/matches/">View all matches</a>
        <div class="after-title match-container-list">`;
        matches.forEach(entry => {
            function createTeamObject(teamName) {
                return {
                    team_name: teamName,
                    class_name: teamName.replace(/\s+/g, ''),
                    link: `pages/teams/details/?team=${teamName}`
                };
            }

            const [team1, team2] = entry.teamsInvolved.map(createTeamObject);
            
            const matchDateStr = (matchData[todayStr]?.includes(entry) ? todayStr : tomorrowStr);
            const formattedDate = new Date(matchDateStr).toLocaleDateString(locale, { dateStyle: 'long' });

            function uses12HourClock(locale) {
                const test = new Date('1970-01-01T13:00');
                return test.toLocaleTimeString(locale).toLowerCase().includes('pm');
            }
            let timeString = entry.time || '00:00:00';
            const is12Hour = uses12HourClock(locale);
            const dateObj = new Date(`1970-01-01T${timeString}`)
            let formattedMatchTime = dateObj.toLocaleTimeString(locale, {
                hour: is12Hour ? 'numeric' : '2-digit',
                minute: '2-digit',
                hour12: is12Hour,
            });

            const outsideUKTimezone = checkTimezoneMatches(timeString);
            let formattedLocalMatchTime;
            if (outsideUKTimezone) {
                const timeOnly = timeString.replace(/([+-]\d{2}:\d{2})$/, '');
                formattedLocalMatchTime = new Date(`1970-01-01T${timeOnly}`).toLocaleTimeString(locale, {
                    hour: is12Hour ? 'numeric' : '2-digit',
                    minute: '2-digit',
                    hour12: is12Hour,
                });
                let temp = formattedMatchTime
                formattedMatchTime = formattedLocalMatchTime
                formattedLocalMatchTime = temp
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

            html += `            
            <div class="event-container">
                <div class="team-box-container">
                    <div class="team-background left ${team1.class_name}"></div>
                    <div class="team-background right ${team2.class_name}"></div>
                    <img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.png" 
                    onload="this.style.opacity=1" loading="lazy"/>
                    
                    <div class="event-overlay">
                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link" href="${team1.link}">
                                <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team1.team_name.toUpperCase()}.png"
                                onload="this.style.opacity=1" loading="lazy"
                                onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                <h2>${team1.team_name}</h2>
                            </a>
                            <div class="youtube-box left-team">
                                ${team1.ytLink ? `
                                <a class="no-color-link no-underline-link-footer fa-brands fa-youtube"
                                href="${team1.ytLink}" target="_blank" title="View the archived livestream"></a>` : ''}
                            </div>
                        </div>

                        <div class="score-box">VS</div>       

                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link" href="${team2.link}">
                                <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team2.team_name.toUpperCase()}.png"
                                onload="this.style.opacity=1" loading="lazy"
                                onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                <h2>${team2.team_name}</h2>
                            </a>
                            <div class="youtube-box right-team">
                                ${team2.ytLink ? `
                                <a class="no-color-link no-underline-link-footer fa-brands fa-youtube"
                                href="${team2.ytLink}" target="_blank" title="View the archived livestream"></a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="match-details-box">
                    <div class="match-date-time-box">
                        <div class="match-detail-container">
                            <i class="fa-solid fa-calendar-days"></i>
                            <h2>${formattedDate}</h2>
                        </div>
                        <div class="match-detail-container">
                            <i class="${outsideUKTimezone ? 'local-time-clock' : ''} fa-solid fa-clock"></i>
                            <h2>
                                <span>${formattedMatchTime}</span>
                                ${outsideUKTimezone ? `
                                    <span title="Local time" style="display: inline-flex; align-items: center;">
                                    (<i class="overseas-time-clock fa-solid fa-clock"></i>${formattedLocalMatchTime})</span>` : ''}
                            </h2>                            
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
        });
        html += `</div><hr />`;

        upcomingMatchesBox.classList.add('fade-in');
        upcomingMatchesBox.innerHTML += html;
    }
}

function checkTimezoneMatches(timeString) {
    const offset = new Date().getTimezoneOffset();
    const sign = offset <= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const formattedOffset = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
    
    const match = timeString.match(/([+-]\d{2}:\d{2})$/);
    const extractedOffset = match ? match[1] : null;

    return formattedOffset != extractedOffset;
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
    showUpcomingMatch();
});

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cshowupcomingmatches.js %c> %cFetching calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    
    try {
        matchData = await getMatchData();
        teamColors = await getTeamcolors();
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
                teamColors = await getTeamcolors();
                upcomingMatchesError.innerHTML = "";
                makeTeamsColorStyles();
                showUpcomingMatch();
            } catch (err) {
                upcomingMatchesError.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${window.retryCount}...</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
                refreshTimer = setTimeout(retryFetch, 2000);
            }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }

    makeTeamsColorStyles();
    showUpcomingMatch();
    console.debug(`%cshowupcomingmatches.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
});