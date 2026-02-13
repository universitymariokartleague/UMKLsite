/*
    This script generates a user's info page card, along with allowing customisations.
*/
import { isWindowsOrLinux, copyTextToClipboard, getIsPopupShowing, shareImage, showImagePreview, setOriginalMessage } from './shareAPIhelper.js';

const profileCardFormatHTML = `
    <div class="profile-card-wrapper">
        <div class="profile-card" style="--team-color: #{{color}};">
            <img src="assets/media/brand/guidelines/wordmark_standard.avif" alt="UMKL logo" class="profile-umkl-logo" onload="this.style.opacity=0.75" />
            <div class="card-timestamp"><span class="fa-solid fa-clock"></span> {{timestamp}}</div>
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
                        <canvas id="spGraph"></canvas>
                    </div>
                </div>
                <p class="graph-title">Extra stats</p>
                <div class="profile-card-detailed-stats">
                    <div class="stat-item">
                        <span class="stat-label">Matches <br>Played</span>
                        <span class="stat-value">{{matchesPlayed}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">First Places <br>(Podiums)</span>
                        <span class="stat-value">{{firstPlaces}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Highest <br>Finish</span>
                        <span class="stat-value">{{highestFinish}}</span>
                    </div>
                </div>
                <div class="card-help">{{cardExtraText}}</div>
                {{profileCustomisationButton}}
            </div>
        </div>
    </div>
`;

const profileCardContentFormatHTML = `
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
            <canvas id="spGraph"></canvas>
        </div>
    </div>
    <p class="graph-title">Extra stats</p>
    <div class="profile-card-detailed-stats">
        <div class="stat-item">
            <span class="stat-label">Matches <br>Played</span>
            <span class="stat-value">{{matchesPlayed}}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">First Places <br>(Podiums)</span>
            <span class="stat-value">{{firstPlaces}}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Highest <br>Finish</span>
            <span class="stat-value">{{highestFinish}}</span>
        </div>
    </div>
    <div class="card-help">{{cardExtraText}}</div>
    {{profileCustomisationButton}}
`;

const userCardBox = document.getElementById("userCardBox")
const teamNameBox = document.getElementById("teamNameBox")
const startYear = 2023;

let data, matchData, teamData;
const currentSeason = 2;
const shareResScale = 3;
let cardImageBlob;
let graphResScale = 2;
let fetchedCurrentSeason = currentSeason;
let takingCardScreenshot = false;
let isFlipping = false;
let currentlyShowingItems = false;

let areProfileItems = false;
let availableItems = [];
let currentEquippedItems = {
    colour: null,
    overlay: null,
    background: null
};

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

function fillInPageTitle(data) {
    document.title = `${makePossessive(data.username)} Profile`;
    teamNameBox.innerText = `${makePossessive(data.username)} Profile`;
}

function generateProfileCardHTML(data) {
    return profileCardFormatHTML
        .replace("{{PFP}}", data.pfp.replace("png", "webp").replace("gif", "webp"))
        .replaceAll("{{username}}", data.username)
        .replaceAll("{{team}}", data.team || "No Team")
        .replace("{{careerPoints}}", data.career_points || "0")
        .replace("{{matchesPlayed}}", data.matches_played || "0")
        .replace("{{sp}}", data.sp || "0")
        .replace("{{color}}", data.color || "ccc")
        .replace("{{teamWins}}", data.team_wins || "0")
        .replace("{{firstPlaces}}", data.first_places || "0")
        .replace("{{highestFinish}}", data.highest_finish || "N/A")
        .replace("{{timestamp}}", new Date(data.timestamp).toLocaleString("en-GB", { hour: '2-digit', minute: '2-digit' }) + " " + new Date(data.timestamp).toLocaleDateString("en-GB"))
        .replace("{{cardExtraText}}", "Use /profile to see your own card!")
        .replace("{{profileCustomisationButton}}", areProfileItems ? `<button class="customise-button" id="showCardProfileItemsButton"><span class="fa-solid fa-paintbrush"></span> Customise profile</button>` : '');
}

function generateProfileCardContent(data) {
    return profileCardContentFormatHTML
        .replace("{{PFP}}", data.pfp.replace("png", "webp").replace("gif", "webp"))
        .replaceAll("{{username}}", data.username)
        .replaceAll("{{team}}", data.team || "No Team")
        .replace("{{careerPoints}}", data.career_points || "0")
        .replace("{{matchesPlayed}}", data.matches_played || "0")
        .replace("{{sp}}", data.sp || "0")
        .replace("{{color}}", data.color || "ccc")
        .replace("{{teamWins}}", data.team_wins || "0")
        .replace("{{firstPlaces}}", data.first_places || "0")
        .replace("{{highestFinish}}", data.highest_finish || "N/A")
        .replace("{{timestamp}}", new Date(data.timestamp).toLocaleString("en-GB", { hour: '2-digit', minute: '2-digit' }) + " " + new Date(data.timestamp).toLocaleDateString("en-GB"))
        .replace("{{cardExtraText}}", "Use /profile to see your own card!")
        .replace("{{profileCustomisationButton}}", areProfileItems ? `<button class="customise-button" id="showCardProfileItemsButton"><span class="fa-solid fa-paintbrush"></span> Customise profile</button>` : '');
}

let profileCustomizeButtonHandler = null;

function cleanupProfileEventListeners() {
    if (profileCustomizeButtonHandler) {
        const button = document.getElementById("showCardProfileItemsButton");
        if (button) {
            button.removeEventListener("click", profileCustomizeButtonHandler);
        }
        profileCustomizeButtonHandler = null;
    }
}

function attachProfileEventListeners() {
    cleanupProfileEventListeners();

    if (areProfileItems) {
        const showCardProfileItemsButton = document.getElementById("showCardProfileItemsButton");
        if (showCardProfileItemsButton) {
            profileCustomizeButtonHandler = () => { 
                showCardProfileItems(); 
            };
            showCardProfileItemsButton.addEventListener("click", profileCustomizeButtonHandler);
        }
    }
}

let card3DEffectActive = false;
let card3DAnimationId = null;
let card3DMouseMoveHandler = null;
let card3DMouseLeaveHandler = null;
let card3DGlareMouseMoveHandler = null;

function cleanupCard3DEffect() {
    if (card3DMouseMoveHandler) {
        document.removeEventListener("mousemove", card3DMouseMoveHandler);
        card3DMouseMoveHandler = null;
    }
    if (card3DMouseLeaveHandler) {
        document.removeEventListener("mouseleave", card3DMouseLeaveHandler);
        card3DMouseLeaveHandler = null;
    }
    if (card3DGlareMouseMoveHandler) {
        document.removeEventListener("mousemove", card3DGlareMouseMoveHandler);
        card3DGlareMouseMoveHandler = null;
    }
    if (card3DAnimationId) {
        cancelAnimationFrame(card3DAnimationId);
        card3DAnimationId = null;
    }
    
    const existingGlare = document.querySelector(".profile-card > div[style*='mix-blend-mode: overlay']");
    if (existingGlare) {
        existingGlare.remove();
    }
    
    card3DEffectActive = false;
}

function addCard3DEffect() {
    cleanupCard3DEffect();
    
    const card = document.querySelector(".profile-card");
    if (!card) return;

    const MAX_ROT = 8;
    const SMOOTH = 0.04;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    card3DMouseMoveHandler = (e) => {
        const rect = card.getBoundingClientRect();

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = (e.clientX - cx) / (window.innerWidth / 2) * -1;
        const dy = (e.clientY - cy) / (window.innerHeight / 2) * -1;

        targetY = dx * -MAX_ROT;
        targetX = dy * MAX_ROT;
    };

    card3DMouseLeaveHandler = () => {
        targetX = 0;
        targetY = 0;
    };

    function animate() {
        currentX += (targetX - currentX) * SMOOTH;
        currentY += (targetY - currentY) * SMOOTH;

        const rotateX = takingCardScreenshot ? 0 : currentX;
        const rotateY = takingCardScreenshot ? 0 : currentY;
        
        if (!isFlipping) {
            card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        } 

        card3DAnimationId = requestAnimationFrame(animate);
    }

    // Add event listeners
    document.addEventListener("mousemove", card3DMouseMoveHandler);
    document.addEventListener("mouseleave", card3DMouseLeaveHandler);

    // Create and add glare element
    const glare = document.createElement("div");
    glare.style.position = "absolute";
    glare.style.inset = "0";
    glare.style.pointerEvents = "none";
    glare.style.mixBlendMode = "overlay";
    card.appendChild(glare);

    card3DGlareMouseMoveHandler = (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        glare.style.background =
            `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.4), transparent 60%)`;
    };

    document.addEventListener("mousemove", card3DGlareMouseMoveHandler);

    animate();
    card3DEffectActive = true;
}

async function generateProfileBox(data, showError) {
    userCardBox.innerHTML = "";

    try {
        teamData = (await getTeamdata(data.team, fetchedCurrentSeason))[0]
    } catch (error) {
        console.debug(`%cuserinfogenerate.js %c> %c${data.username} does not belong to a team`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    }

    cleanupCard3DEffect();
    cleanupProfileEventListeners();

    let tempProfileCard = generateProfileCardHTML(data);

    if (teamData) {
        document.documentElement.style.setProperty('--highlight-color', `#${data.color}80`);
    }
    
    userCardBox.innerHTML = tempProfileCard;

    attachProfileEventListeners();

    createSPGraph(data, `#${data.color}`);
    addCard3DEffect();

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

    canvas.width = canvas.clientWidth * graphResScale;
    canvas.height = canvas.clientHeight * graphResScale;

    const ctx = canvas.getContext('2d');
    const spData = data.sp_detailed;

    if (!spData || !spData.history || Object.keys(spData.history).length === 0) {
        ctx.fillStyle = '#111111';
        ctx.font = `${12 * graphResScale}px Montserrat`;
        ctx.fillText('No history available', 5, 10 * graphResScale);
        return;
    }

    const history = spData.history;
    const dates = Object.keys(history).sort();
    
    const firstDate = new Date(dates[0]);
    const fakeStartDate = new Date(firstDate.getTime() - (60 * 24 * 60 * 60 * 1000)); // 2 months before
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

    const padding = 22 * graphResScale;
    const graphWidth = canvas.width - (padding * 2) - (5 * graphResScale);
    const graphHeight = canvas.height - (padding * 2);

    const maxValue = Math.max(...extendedValues);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = graphResScale;
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
        if (normalized <= 1) rounded = 1;
        else if (normalized <= 2) rounded = 2;
        else if (normalized <= 5) rounded = 5;
        else rounded = 10;
        
        return rounded * magnitude;
    };
    
    const gridMax = getGraphRoundNumber(maxValue);

    // Draw graph and y-axis labels
    ctx.strokeStyle = '#cccccc';
    ctx.fillStyle = '#666';
    ctx.font = `${10 * graphResScale}px Montserrat`;
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
        ctx.fillText(label, padding - 2 * graphResScale, y + 3 * graphResScale);
    }
    ctx.setLineDash([]);

    // Draw graph line
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 1.5 * graphResScale;
    ctx.beginPath();

    extendedDates.forEach((_, index) => {
        const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
        const x = padding + timeRatio * graphWidth;
        const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;

        ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw dates on the x-axis
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
        ctx.font = `${10 * graphResScale}px Montserrat`;
        
        displayIndices.forEach(index => {
            const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
            const x = padding + timeRatio * graphWidth;
            const date = extendedDates[index];
            const dateObj = new Date(date);
            const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear().toString().slice(-2)}`;

            ctx.save();
            ctx.translate(x, canvas.height - padding + 7 * graphResScale);
            ctx.rotate(-Math.PI / 10);
            ctx.textAlign = 'right';
            ctx.fillText(formattedDate, 0, 0);
            ctx.restore();
        });
    }

    // Draw values
    if (extendedDates.length > 0) {
        ctx.fillStyle = teamColor;
        ctx.font = `${11 * graphResScale}px Montserrat`;
        ctx.textAlign = 'center';
        
        displayIndices.forEach(index => {
            const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
            const x = padding + timeRatio * graphWidth;
            const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;
            
            ctx.fillText(extendedValues[index], x, y - 7 * graphResScale);
        });
    }

    // Draw points
    ctx.fillStyle = teamColor;
    extendedDates.forEach((_, index) => {
        const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
        const x = padding + timeRatio * graphWidth;
        const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;
        
        if (index > 0) {
            ctx.beginPath();
            ctx.arc(x, y, 4 * graphResScale, 0, 2 * Math.PI);
            ctx.fill();
        }
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

window.addEventListener("resize", async () => {
    if (data) { 
        createSPGraph(data, `#${data.color}`);
    }
});

document.addEventListener('keydown', async (event) => {
    const key = event.key.toLowerCase();

    if (key == 's') {
        if (currentlyShowingItems) {
            goBackToProfile();
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        await generateCardImage();
    }
});

async function preloadCardImage() {
    const node = document.getElementById("userCardBox");
    const profileCard = document.querySelector(".profile-card");

    const originalTransition = profileCard.style.transition;
    profileCard.style.transition = 'none';

    takingCardScreenshot = true;
    graphResScale = shareResScale;
    createSPGraph(data, `#${data.color}`);

    try {
        const rect = profileCard.getBoundingClientRect();

        let showCardProfileItemsButton = document.getElementById("showCardProfileItemsButton");
        showCardProfileItemsButton.style.display = 'none';

        let cardHelpDiv = document.querySelector('.card-help');
        cardHelpDiv.style.width = '85%';

        let dataURL;

        setTimeout(async () => {
            dataURL = await htmlToImage.toPng(node, {
                pixelRatio: shareResScale,
                width: rect.width + 40,
                height: node.scrollHeight + 40, 
                style: {
                    transform: `translateX(-145px)`
                }
            });

            showCardProfileItemsButton.style.display = '';
            cardHelpDiv.style.width = '';

            const response = await fetch(dataURL);
            cardImageBlob = await response.blob();
        }, 5)
    } catch (err) {
        console.error("Capture failed:", err);
    }

    profileCard.style.transition = originalTransition;
    takingCardScreenshot = false;
    graphResScale = 2;
    createSPGraph(data, `#${data.color}`);
}

async function generateCardImage() {
    try {
        if (getIsPopupShowing()) return;
        const useClipboard = isWindowsOrLinux() || !navigator.canShare;

        const blob = cardImageBlob;

        const message = `Check out the UMKL profile for ${data.username}!`

        if (useClipboard) {
            const success = await copyTextToClipboard(message);
            shareButton.innerText = success ? "Copied to clipboard!" : "Failed to copy!";
            showImagePreview(blob, blob.url, message)
        } else {
            await shareImage(
                `${data.username} UMKL Profile`,
                message,
                blob,
                `${data.username.replaceAll(" ", "_")}_UMKL_profile.png`
            )
        }

        console.debug(`%cuserinfogenerate.js %c> %cCopied image to clipboard!`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    } catch (err) {
        console.error("Failed to copy to clipboard!:", err);
    }
}

function showCardProfileItems() {    
    if (!isFlipping && !currentlyShowingItems) {
        const profileCard = document.querySelector(".profile-card");
        const profileCardContent = document.querySelector(".profile-card-content");

        try {
            isFlipping = true;
            currentlyShowingItems = true;

            profileCard.style.transform = 'rotateY(90deg)';
            profileCard.style.transition = 'transform 0.25s ease-in-out';
            profileCard.style.transformStyle = 'preserve-3d';
            
            setTimeout(() => {
                profileCard.style.transform = 'rotateY(90deg)';
                
                setTimeout(() => {
                    profileCardContent.innerHTML = `
                        <div class="items-interface-wrapper">
                            <div class="items-interface">
                                <div class="items-header">
                                    <h3 class="items-title">Equip Profile Items</h3>
                                    <div class="items-categories">
                                        <button class="category-button active" data-category="all">All</button>
                                        <button class="category-button" data-category="colour">Colours</button>
                                        <button class="category-button" data-category="overlay">Overlays</button>
                                        <button class="category-button" data-category="background">Backgrounds</button>
                                    </div>
                                </div>
                                <div class="items-grid" id="itemsGrid">No items...</div>
                                <div class="items-footer">
                                    <div class="items-actions">
                                        <button class="button-cancel" onclick="goBackToProfile()">Cancel</button>
                                        <button class="button-save" onclick="saveItemEquips()">Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    document.querySelector(".profile-umkl-logo")?.remove();
                    document.querySelector(".card-timestamp")?.remove();
                    populateItemsGrid('all');
                    attachCategoryListeners();
                    profileCard.style.transform = 'rotateY(0deg)';
                }, 240);
            }, 50);

            setTimeout(() => {
                profileCard.style.transition = 'transform 0.1s ease-out';
                isFlipping = false;
            }, 400)
        } catch (err) {
            isFlipping = false;
            console.error("Loading card items failed:", err);
        }
    }
}

async function goBackToProfile() {    
    const profileCard = document.querySelector(".profile-card");
    const profileCardContent = document.querySelector(".profile-card-content");

    isFlipping = true;
    currentlyShowingItems = false;

    profileCard.style.transform = 'rotateY(90deg)';
    profileCard.style.transition = 'transform 0.25s ease-in-out';
    profileCard.style.transformStyle = 'preserve-3d';
    
    setTimeout(() => {
        profileCard.style.transform = 'rotateY(90deg)';

        setTimeout(async () => {
            cleanupCard3DEffect();
            cleanupProfileEventListeners();
            
            profileCardContent.innerHTML = generateProfileCardContent(data);
            
            const logoHTML = `<img src="assets/media/brand/guidelines/wordmark_standard.avif" alt="UMKL logo" class="profile-umkl-logo" onload="this.style.opacity=0.75" />`;
            const timestampHTML = `<div class="card-timestamp"><span class="fa-solid fa-clock"></span> ${new Date(data.timestamp).toLocaleString("en-GB", { hour: '2-digit', minute: '2-digit' }) + " " + new Date(data.timestamp).toLocaleDateString("en-GB")}</div>`;
            
            profileCard.insertAdjacentHTML('afterbegin', logoHTML);
            profileCard.insertAdjacentHTML('afterbegin', timestampHTML);
            
            profileCard.style.transform = 'rotateY(0deg)';

            createSPGraph(data, `#${data.color}`);
            attachProfileEventListeners();
            addCard3DEffect();
        }, 240);
    }, 50);

    setTimeout(() => {
        profileCard.style.transition = 'transform 0.1s ease-out';
        isFlipping = false;
        // preloadCardImage();
    }, 400)
}

function populateItemsGrid(category) {
    const grid = document.getElementById("itemsGrid");
    const filteredItems = category === "all"
        ? data.profile_items 
        : data.profile_items.filter(item => item.type === category);

    grid.innerHTML = "";

    availableItems = data.profile_items
    filteredItems.forEach((item, index) => {
        const isEquipped = isItemEquipped(item);
        const itemElement = createItemElement(item, index, isEquipped);
        grid.appendChild(itemElement);
    });
}

function createItemElement(item, index, isEquipped) {
    const div = document.createElement("div");
    div.className = `item-card ${isEquipped ? "equipped" : ""}`;
    div.dataset.itemType = item.type;
    div.dataset.itemIndex = index;
    div.style.cursor = "pointer";
    div.onclick = () => toggleItemEquip(item.type, index);

    div.innerHTML = `
        <img class="item-preview" src="assets/media/profile/${item.name.replace(/ /g, '_').toLowerCase()}.avif"
            onload="this.style.opacity=1" onerror="this.onerror=null;>
        <div class="item-info">
            <h4 class="item-name">${item.name}</h4>
            <span class="item-type"><span class="fa-solid fa-${item.type}"></span> ${item.type}</span>
        </div>
    `;

    return div;
}

function toggleItemEquip(type, itemIndex) {    
    if (currentEquippedItems[type] === itemIndex) {
        currentEquippedItems[type] = null;
    } else {
        currentEquippedItems[type] = itemIndex;
    }
    
    const activeCategory = document.querySelector(".category-button.active").dataset.category;
    populateItemsGrid(activeCategory);
}

function isItemEquipped(item) {
    return currentEquippedItems[item.type] === availableItems.indexOf(item);
}

function attachCategoryListeners() {
    const categoryBtns = document.querySelectorAll(".category-button");
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            populateItemsGrid(btn.dataset.category);
        });
    });
}

function saveItemEquips() {
    const equippedItemsData = {};
    Object.keys(currentEquippedItems).forEach(type => {
        if (currentEquippedItems[type] !== null) {
            equippedItemsData[type] = availableItems[currentEquippedItems[type]];
        }
    });

    equippedItemsData["username"] = data.username;
    console.debug(`%cuserinfogenerate.js %c> %cSaving equipped items: ${JSON.stringify(equippedItemsData)}`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
    localStorage.setItem("userProfileSettings", JSON.stringify(equippedItemsData));

    goBackToProfile()
}

// Make functions globally accessible for onclick handlers
window.saveItemEquips = saveItemEquips;
window.goBackToProfile = goBackToProfile;

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cuserinfogenerate.js %c> %cGenerating player info box`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");

    let showError = 0;
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('d')) window.location.href = "/";
    const compressed = urlParams.get('d');
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    data = JSON.parse(json);

    let mappedProfileItems = [];
    if (urlParams.has('u')) {
        areProfileItems = true;
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
    fillInPageTitle(data);

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

    const shareButton = document.getElementById("shareButton");

    setOriginalMessage(shareButton.innerHTML);
    preloadCardImage();
    shareButton.addEventListener("click", async () => {
        if (currentlyShowingItems) {
            goBackToProfile();
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        await generateCardImage();
    });

    console.debug(`%cuserinfogenerate.js %c> %cGenerated user info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#ff52dc", "color:#fff", "color:#ffa3ed");
});