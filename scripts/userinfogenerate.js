/*
    This script generates a user's info page.
*/

const profileCardFormatHTML = `
    <div class="profile-card-wrapper">
        <div class="profile-card" style="--team-color: #{{color}};">
            <div class="profile-card-content">
                <div class="profile-card-header">
                    <img src="{{PFP}}" alt="{{username}} profile picture" class="profile-card-avatar" 
                        onload="this.style.opacity=1" onerror="this.onerror=null; this.src='assets/media/faq/defaultavatar.avif';"/>
                    <div class="profile-card-user-info">
                        <h3 class="profile-card-username">{{username}}</h3>
                        <p class="profile-card-team"><a href="pages/teams/details/?team={{team}}">{{team}}</a></p>
                    </div>
                </div>
                <div class="profile-card-stats">
                    <div class="stat-item">
                        <span class="stat-label">Career Points</span>
                        <span class="stat-value">{{careerPoints}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Team Wins</span>
                        <span class="stat-value">{{teamWins}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">SP</span>
                        <span class="stat-value">{{sp}}</span>
                    </div>
                </div>
                <div class="profile-card-sp-graph">
                    <p class="graph-title">SP History</p>
                    <div class="sp-graph-container">
                        <canvas id="spGraph" width="350" height="150"></canvas>
                    </div>
                </div>
                <p class="graph-title">Extra stats</p>
                <div class="profile-card-detailed-stats">
                    <div class="stat-item">
                        <span class="stat-label">Matches Played</span>
                        <span class="stat-value">{{matchesPlayed}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">First Places (Podiums)</span>
                        <span class="stat-value">{{firstPlaces}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Highest Finish</span>
                        <span class="stat-value">{{highestFinish}}</span>
                    </div>
                </div>
                <div class="umkl-stamp">UMKL</div>
            </div>
        </div>
    </div>
`;

const userCardBox = document.getElementById("userCardBox")
const teamNameBox = document.getElementById("teamNameBox")
const startYear = 2023;

let matchData, teamData;
const currentSeason = 2;
let fetchedCurrentSeason = currentSeason;

let refreshTimer = null;

let startTime;

function findMatchByEventID(eventID) {
    for (const date in matchData) {
        const matches = matchData[date];
        if (!Array.isArray(matches)) continue;

        const found = matches.find(match => match.eventID === eventID);
        if (found) {
            return { date, match: found };
        }
    }
    return null;
}

function formatDetailedPoints(matches_info) {
    return matches_info
        .map(match_info => {
            const found = findMatchByEventID(match_info.eventID);
            const { date, match } = found;
            return `<a href="pages/matches/?date=${date}">${match.title}</a> - ${match_info.points} points`;
        })
        .join(`,<br>`);
}

function formatSPDetails(sp_detailed) {
    if (!sp_detailed || !sp_detailed.history) return "No SP data";
    return `
        SP from chatting: ${sp_detailed.chat_sp}<br>
        SP gains/losses from matches:
        <ul class="sp-bullet-points">
        ${Object.entries(sp_detailed.history)
        .map(([date, info]) => {
            return `<li>${info.change} SP on ${date} (${info.event})</li>`;
        })
        .join('')}</ul>`;
}

function buildUserInfoTable(data, isCurrent = false) {
    if (isCurrent) {
        return `
            <table class="team-info-table">
                <tr><td class="table-key">Wins/Losses (Position)</td><td>${data.season_wins_losses[0]} - ${data.season_wins_losses[1]} ${data.team_season_points > 0 ? `(${toOrdinal(data.season_position)})` : ''}</td></tr>
                <tr><td class="table-key">Matches Played</td><td>${data.season_matches_played}</td></tr>
                <tr><td class="table-key">Points (Penalties)</td><td>${data.team_season_points} (${data.season_penalties})</td></tr>
            </table>`;
    }
    return `
        <table class="team-info-table">
            <tr><td class="table-key">Current Team</td><td>${data.team}</td></tr>
            <tr><td class="table-key">Team Wins</td><td>${data.team_wins}</td></tr>
            <tr><td class="table-key">Matches Played</td><td>${data.matches_played}</td></tr>
            <tr><td class="table-key">First Places (Podiums)</td><td>${data.first_places}</td></tr>
            <tr><td class="table-key">Highest Finish</td><td>${data.highest_finish}</td></tr>
            <tr><td class="table-key">Career Points</td><td>${data.career_points} <details class="details-box"><summary>Detailed results</summary>${formatDetailedPoints(data.match_data)}</details></td></tr>
            <tr><td class="table-key">SP</td><td>${data.sp} <details class="details-box"><summary>SP details</summary>${formatSPDetails(data.sp_detailed)}</details></td></tr>
        </table>`;
}

function fillInPageTitle(data) {
    document.title = `${makePossessive(data.username)} Profile`;
    teamNameBox.innerText = `${makePossessive(data.username)} Profile`;
}

async function generateProfileBox(data, showError) {
    userCardBox.innerHTML = "";
    userCardBox.classList.remove('fade-in');

    try {
        teamData = (await getTeamdata(data.team, fetchedCurrentSeason))[0]
    } catch (error) {
        console.debug(`%cuserinfogenerate.js %c> %c${data.username} does not belong to a team`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    }

    let currentFields = `${data.username} doesn't belong to a team!`

    if (teamData) currentFields = buildUserInfoTable(teamData, true);

    let tempProfileCard = profileCardFormatHTML
        .replace("{{PFP}}", data.pfp.replace("png", "webp"))
        .replaceAll("{{username}}", data.username)
        .replaceAll("{{team}}", data.team || "No Team")
        .replace("{{careerPoints}}", data.career_points || "0")
        .replace("{{matchesPlayed}}", data.matches_played || "0")
        .replace("{{sp}}", data.sp || "0")
        .replace("{{color}}", data.color || "ccc")
        .replace("{{teamWins}}", data.team_wins || "0")
        .replace("{{firstPlaces}}", data.first_places || "0")
        .replace("{{highestFinish}}", data.highest_finish || "N/A");

    if (teamData) {
        document.documentElement.style.setProperty('--highlight-color', `#${data.color}80`);
    }
    
    userCardBox.innerHTML = tempProfileCard;
    userCardBox.classList.add('fade-in');

    setTimeout(() => createSPGraph(data, `#${data.color}`), 100);
    addCard3DEffect();

    function addCard3DEffect() {
        const card = document.querySelector(".profile-card");

        const MAX_ROT = 8;
        const SMOOTH = 0.04;

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        document.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();

            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const dx = (e.clientX - cx) / (window.innerWidth / 2) * -1;
            const dy = (e.clientY - cy) / (window.innerHeight / 2) * -1;

            targetY = dx * -MAX_ROT;
            targetX = dy * MAX_ROT;
        });

        function animate() {
            currentX += (targetX - currentX) * SMOOTH;
            currentY += (targetY - currentY) * SMOOTH;

            card.style.transform =
                `perspective(900px)
                translateY(-5px)
                rotateX(${currentX}deg)
                rotateY(${currentY}deg)`;

            requestAnimationFrame(animate);
        }

        animate();

        document.addEventListener("mouseleave", () => {
            targetX = 0;
            targetY = 0;
        });

        const glare = document.createElement("div");
        glare.style.position = "absolute";
        glare.style.inset = "0";
        glare.style.pointerEvents = "none";
        glare.style.mixBlendMode = "overlay";
        card.appendChild(glare);

        document.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            glare.style.background =
                `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.4), transparent 60%)`;
        });
    }

    (function injectLiveDotStyle() {
        const style = document.createElement('style');
        style.textContent = `
            .live-dot {
                background-color: #${data.color};
                box-shadow: 0 0 0 0 #${data.color}80;
            }
            @keyframes live-dot-pulse {
                0% {
                    box-shadow: 0 0 0 0 #${data.color}80;
                }
                70% {
                    box-shadow: 0 0 0 8px #${data.color}00;
                }
                100% {
                    box-shadow: 0 0 0 0 #${data.color}00;
                }
            }
        `;
        document.head.appendChild(style);
    })();

    showErrorBox(showError);
}

const makePossessive = name =>
    !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

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

function toOrdinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    switch (v % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
    }
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

function createSPGraph(data, teamColor) {
    const canvas = document.getElementById('spGraph');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const spData = data.sp_detailed;

    if (!spData || !spData.history || Object.keys(spData.history).length === 0) {
        ctx.fillStyle = '#111111';
        ctx.font = '12px Montserrat';
        ctx.textAlign = 'center';
        ctx.fillText('No SP history available', canvas.width / 2, canvas.height / 2);
        return;
    }

    const history = spData.history;
    const dates = Object.keys(history).sort();
    
    const firstDate = new Date(dates[0]);
    const fakeStartDate = new Date(firstDate.getTime() - (90 * 24 * 60 * 60 * 1000)); // 3 months before
    const fakeDateStr = fakeStartDate.toISOString().split('T')[0];
    const extendedDates = [fakeDateStr, ...dates];
    const extendedValues = [0];
    
    const dateTimestamps = extendedDates.map(date => new Date(date).getTime());
    const fakeStartTime = dateTimestamps[0];
    const maxTime = dateTimestamps[dateTimestamps.length - 1];
    const timeRange = maxTime - fakeStartTime || 1;
    
    let cumulative = 0;
    extendedDates.forEach((date, index) => {
        if (index === 0) {
            extendedValues[0] = 0;
            return;
        }
        const timeRatio = (dateTimestamps[index] - dateTimestamps[index - 1]) / timeRange;
        const chatSpForPeriod = Math.round(spData.chat_sp * timeRatio);
        cumulative += history[date].change + chatSpForPeriod;
        extendedValues.push(index === extendedDates.length - 1 ? data.sp : Math.round(cumulative));
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 25;
    const graphWidth = canvas.width - (padding * 2);
    const graphHeight = canvas.height - (padding * 2);

    const maxValue = Math.max(...extendedValues);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    const getGraphRoundNumber = (max) => {
        const exponent = Math.floor(Math.log10(max));
        const magnitude = Math.pow(10, exponent);
        const normalized = max / magnitude;
        
        let rounded;
        if (normalized <= 1.5) rounded = 1;
        else if (normalized <= 3) rounded = 2;
        else if (normalized <= 7) rounded = 5;
        else rounded = 10;
        
        return rounded * magnitude;
    };
    
    const gridMax = getGraphRoundNumber(maxValue);

    ctx.strokeStyle = '#ccc';
    ctx.fillStyle = '#666';
    ctx.font = '9px Montserrat';
    ctx.textAlign = 'right';
    ctx.setLineDash([2, 2]);
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (graphHeight / 5) * i;
        const value = Math.round(gridMax * (1 - i / 5));
        
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        
        let label;
        if (value >= 1000) {
            label = (value / 1000) + 'K';
        } else {
            label = value.toString();
        }
        ctx.fillText(label, padding - 5, y + 3);
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    extendedDates.forEach((_, index) => {
        const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
        const x = padding + timeRatio * graphWidth;
        const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;

        ctx.lineTo(x, y);
    });
    ctx.stroke();

    const maxLabels = 8;
    const labelStep = Math.max(1, Math.floor(extendedDates.length / maxLabels));
    const displayIndices = [];
    
    for (let i = 1; i < extendedDates.length; i += labelStep) {
        displayIndices.push(i);
    }
    if (displayIndices[displayIndices.length - 1] !== extendedDates.length - 1) {
        displayIndices.push(extendedDates.length - 1);
    }

    if (extendedDates.length > 0) {
        ctx.fillStyle = '#666';
        ctx.font = '8px Montserrat';
        
        displayIndices.forEach(index => {
            const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
            const x = padding + timeRatio * graphWidth;
            const date = extendedDates[index];
            
            ctx.save();
            ctx.translate(x, canvas.height - padding + 10);
            ctx.rotate(-Math.PI / 15);
            ctx.textAlign = 'right';
            ctx.fillText(date, 0, 0);
            ctx.restore();
        });
    }

    if (extendedDates.length > 0) {
        ctx.fillStyle = teamColor;
        ctx.font = '9px Montserrat';
        ctx.textAlign = 'center';
        
        displayIndices.forEach(index => {
            const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
            const x = padding + timeRatio * graphWidth;
            const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;
            
            ctx.fillText(extendedValues[index], x, y - 8);
        });
    }

    ctx.fillStyle = teamColor;
    extendedDates.forEach((_, index) => {
        const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
        const x = padding + timeRatio * graphWidth;
        const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
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

async function getTeamdata(team, season) {
    console.debug(`%cuserinfogenerate.js %c> %cFetching playerdata from the API...`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    return fetch('https://api.umkl.co.uk/teamdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            team: `${team}`,
            season: `${season}`
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
    console.debug(`%cuserinfogenerate.js %c> %cGenerating player info box`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");

    let showError = 0;
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('d')) window.location.href = "/";
    const compressed = urlParams.get('d');
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    const data = JSON.parse(json);

    let mappedProfileItems = [];
    if (urlParams.has('u')) {
        const uParam = urlParams.get('u');
        try {
            const response = await fetch('database/profileunlockitems.json');
            const unlockItems = await response.json();
            
            mappedProfileItems = uParam.split('').map((char, index) => {
                if (char === '1' && index < unlockItems.length) {
                    return unlockItems[index];
                }
                return null;
            }).filter(item => item !== null);
        } catch (error) {
            console.error('Error fetching profile unlock items:', error);
        }
    }

    data.profile_items = mappedProfileItems;
    data.profile_items_readable = mappedProfileItems.map(item => 
        typeof item === 'object' ? item.name || JSON.stringify(item) : item
    ).join(', ');

    console.log(data);
    fillInPageTitle(data)

    try {
        matchData = await getMatchData();
        fetchedCurrentSeason = parseInt(await getCurrentSeason());
    } catch (error) {
        console.debug(`%cuserinfogenerate.js %c> %cAPI failed - retrying...`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
        await getMatchDataFallback();
        showError = 1;

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
                    fetchedCurrentSeason = parseInt(await getCurrentSeason());
                    matchData = await getMatchData();
                    showError = 0;
                    await generateProfileBox(data, showError);
                } catch (err) {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generateProfileBox(data, showError);

    console.debug(`%cuserinfogenerate.js %c> %cGenerated user info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
});