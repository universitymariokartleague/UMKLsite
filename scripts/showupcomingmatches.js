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
    const pad = n => String(n).padStart(2, '0');
    const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = new Date();
    const todayStr = formatDate(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    // get all matches from today and tomorrow, filter out matches more than 2 hours ago
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
            let timeString = entry.time || '00:00';
            if (/^\d{2}:\d{2}$/.test(timeString)) timeString += ':00';
            const formattedMatchTime = new Date(`1970-01-01T${timeString}`).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit'});
            
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
            html += `            
            <div class="event-container">
                <div class="team-box-container">
                        <div class="team-background left ${team1.class_name}"></div>
                        <div class="team-background right ${team2.class_name}"></div>
                        <img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.png" alt="Team Overlay"/>

                    <div class="event-overlay">

                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link" href="${team1.link}">
                                <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team1.team_name.toUpperCase()}.png"
                                onload="this.style.opacity=1"
                                onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                <h2>${team1.team_name}</h2>
                            </a>
                        </div>
                    
                        <div class="score-box">${resultsHTML ? formatResults(entry.results) : "VS"}</div>       

                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link" href="${team2.link}">
                                <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team2.team_name.toUpperCase()}.png"
                                onload="this.style.opacity=1" 
                                onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                <h2>${team2.team_name}</h2>
                            </a>
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
                            <i class="fa-solid fa-clock"></i>
                            <h2>${formattedMatchTime}${isLive ? '<div class="live-dot"></div>' : ''}</h2>
                        </div>
                    </div>
                        <p class="match-season">${entry.testMatch ? "<span class='settings-extra-info'>Test Match</span>" : `Season ${entry.season}`}</p>
                </div>
            </div>
            `;
        });
        html += `</div><hr />`;

        upcomingMatchesBox.classList.add('fade-in');
        upcomingMatchesBox.innerHTML += html;
    }
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