const upcomingMatchesBox = document.getElementById("upcomingMatchesBox");
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

    // get all matches from today and tomorrow
    const matches = [
        ...(matchData[todayStr] || []),
        ...(matchData[tomorrowStr] || [])
    ];

    if (matches.length == 0) {
        upcomingMatchesBox.innerHTML += ``;
    } else {
        const locale = localStorage.getItem("locale") || "en-GB";

        let html = `<h2>Upcoming Matches</h2>
        <a href="pages/matches/">View All Matches</a>
        <div class="after-title match-container-list">`;
        matches.forEach(match => {
            const matchDateStr = (matchData[todayStr]?.includes(match) ? todayStr : tomorrowStr);
            const formattedDate = new Date(matchDateStr).toLocaleDateString(locale, { dateStyle: 'long' });
            const teams = match.teamsInvolved || [];
            html += `<div class="match-container">
            <div class="team-box">
                <a href="pages/teams/${teams[0].toLowerCase()}/" class="no-color-link no-underline-link">
                <img class="team-box-image" src="assets/image/teamemblems/${teams[0].toUpperCase()}.png" />
                <h3>${teams[0]}</h3>
                </a>
            </div>
            <div class="vs-box"><h1>VS</h1></div>
            <div class="team-box">
                <a href="pages/teams/${teams[1].toLowerCase()}/" class="no-color-link no-underline-link">
                <img class="team-box-image" src="assets/image/teamemblems/${teams[1].toUpperCase()}.png" />
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
                    <h3>${match.time}</h3>
                </div>
                </div>
            </div>
            </div>`;
        });
        html += `</div><hr />`;
        upcomingMatchesBox.innerHTML += html;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cshowupcomingmatches.js %c> %cFetching calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    
    try {
        matchData = await getMatchData();
    } catch (error) {
        console.debug(`%cshowupcomingmatches.js %c> %cAPI failed - using fallback information...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        await getMatchDataFallback();

        upcomingMatchesBox.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
    
        if (refreshTimer) clearTimeout(refreshTimer);
        const retryFetch = async () => {
            try {
                if (typeof retryCount === 'undefined') {
                    window.retryCount = 1;
                } else {
                    window.retryCount++;
                }
                matchData = await getMatchData();
                upcomingMatchesBox.innerHTML = ""
                showUpcomingMatch();
            } catch (err) {
                upcomingMatchesBox.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${window.retryCount}...</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
                refreshTimer = setTimeout(retryFetch, 2000);
            }
        };
        refreshTimer = setTimeout(retryFetch, 2000);
    }

    showUpcomingMatch();
    console.debug(`%cshowupcomingmatches.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
});