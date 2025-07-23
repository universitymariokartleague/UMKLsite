/*
    This script dynamically generates the upcoming matches section
    on the home page of the site.
*/

const upcomingMatchesBox = document.getElementById("upcomingMatchesBox");
const MATCH_LENGTH_MINS = 90;
let matchData = {};

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
        matches.forEach(match => {
            const matchDateStr = (matchData[todayStr]?.includes(match) ? todayStr : tomorrowStr);
            const formattedDate = new Date(matchDateStr).toLocaleDateString(locale, { dateStyle: 'long' });
            const teams = match.teamsInvolved || [];
            let formattedTime = match.time;
            let isLive = false;
            if (match.time) {
                const [hours, minutes] = match.time.split(':');
                const dateObj = new Date(matchDateStr);
                dateObj.setHours(Number(hours), Number(minutes), 0, 0);
                formattedTime = dateObj.toLocaleTimeString(locale, { timeStyle: 'short' });

                const now = new Date();
                const matchStart = dateObj;
                const matchEnd = new Date(matchStart.getTime() + MATCH_LENGTH_MINS * 60 * 1000);
                if (now >= matchStart && now <= matchEnd) {
                    isLive = true;
                }
            }
            html += `<div class="match-container">
                <div class="team-box">
                    <a href="pages/teams/details/?team=${teams[0]}" class="no-color-link no-underline-link">
                    <img class="team-box-image" src="assets/media/teamemblems/${teams[0].toUpperCase()}.png" />
                    <h3>${teams[0]}</h3>
                    </a>
                </div>
                <div class="vs-box"><h1>VS</h1></div>
                <div class="team-box">
                    <a href="pages/teams/details/?team=${teams[1]}" class="no-color-link no-underline-link">
                    <img class="team-box-image" src="assets/media/teamemblems/${teams[1].toUpperCase()}.png" />
                    <h3>${teams[1]}</h3>
                    </a>
                </div>
                <div class="info-container">
                    <div class="match-details-box">
                        <div class="match-detail-container">
                            <i class="fa-solid fa-calendar-days"></i>
                            <h3>${formattedDate}</h3>
                        </div>
                        <div class="match-detail-container">
                            <i class="fa-solid fa-clock"></i>
                            <h3><div class="heading-wrapper">${formattedTime}${isLive ? '<div class="live-dot"></div>' : ''}</div></h3>
                        </div>
                    </div>
                    <span>
                        <a href="https://www.youtube.com/@universitymariokartleague/streams" target="_blank">Watch here</a> | 
                        <a href="pages/matches/?date=${matchDateStr}">View details</a>
                    </span>
                    <span class="settings-extra-info">${match.testMatch ? "This is a test match" : ""}</span>
                </div>
            </div>`;
        });
        html += `</div><hr />`;

        upcomingMatchesBox.classList.add('fade-in');
        upcomingMatchesBox.innerHTML += html;
    }
}

document.addEventListener('startDayChange', () => {
    showUpcomingMatch();
});

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cshowupcomingmatches.js %c> %cFetching calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    
    try {
        matchData = await getMatchData();
    } catch (error) {
        if (error && error.message && error.message.includes('429')) {
            upcomingMatchesBox.innerHTML = `<blockquote class="fail"><b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.</blockquote><hr>`;
            return;
        } else {
            console.debug(`%cshowupcomingmatches.js %c> %cAPI failed - using fallback information...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
            await getMatchDataFallback();

            upcomingMatchesBox.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote><hr>`;

            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
            try {
                if (typeof retryCount === 'undefined') {
                window.retryCount = 1;
                } else {
                window.retryCount++;
                }
                matchData = await getMatchData();
                upcomingMatchesBox.innerHTML = "";
                showUpcomingMatch();
            } catch (err) {
                upcomingMatchesBox.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${window.retryCount}...</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote><hr>`;
                refreshTimer = setTimeout(retryFetch, 2000);
            }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }

    showUpcomingMatch();
    console.debug(`%cshowupcomingmatches.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
});