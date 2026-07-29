/*
    This script generates a user's info page card, along with allowing customisations.
*/
import { isWindowsOrLinux, copyTextToClipboard, getIsPopupShowing, shareImage, showImagePreview, setOriginalMessage } from './shareAPIhelper.js';
import { createDebugLogger } from './debuglogger.js';

const profileCardContentHTML = `
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
    <div class="profile-footer-info">
        <div class="card-help">{{cardExtraText}}</div>
        {{profileCustomisationButton}}
    </div>
`;

const profileCardFormatHTML = `
    <div class="profile-card-wrapper">
        <div class="profile-card" style="--team-color: #{{color}};">
            <img src="assets/media/profile/wordmark_standard.avif" alt="UMKL logo" class="profile-umkl-logo" onload="this.style.opacity=0.9" />
            <div class="profile-card-content">
                {{profileCardContent}}
            </div>
        </div>
    </div>
`;

const userCardBox = document.getElementById("userCardBox")
const teamNameBox = document.getElementById("teamNameBox")

let data, matchData, teamData;
const currentSeason = 2;
const shareResScale = 3;
let cardImageBlob;
let cardCaptureId = 0;
let graphResScale = shareResScale;
let fetchedCurrentSeason = currentSeason;
let takingCardScreenshot = false;
let isFlipping = false;
let currentlyShowingItems = false;

let areProfileItems = false;
let currentEquippedItems = {
    colour: null,
    overlay: null,
    background: null
};
let cardChanged = false;

const rainbowColours = ["#ff9eb5", "#ffcc99", "#fff5a5", "#c5e8d0", "#c9daff"];
const colourMap = {
    "UMKL Red": "#ff0000",
    "Blue": "#0066ff",
    "Rainbow": `linear-gradient(135deg, ${rainbowColours.join(", ")})`
};
const eventIcons = { match: '', testmatch: '' }; // fa-flag-checkered, fa-gear
const backgroundOverlayOpacity = {
    "cheep_cheep": 0.2,
    "cheep_cheep_wrap": 0.2,
    "mario_kart_8": 0.5,
    "mario_kart_8_deluxe": 0.4,
    "mario_kart_8_deluxe_booster_course_pass": 0.3,
    "mario_kart_world": 0.25,
    "super_mario_maker_2": 0.5,
    "super_mario_maker_2_gameplay": 0.6,
    "mario_luigi_dream_team": 0.4,
    "mario_luigi_partners_in_time": 0.4,
};

function getItemFileName(name) {
    return name.replace(/[&:]/g, "").replace(/\s+/g, "_").toLowerCase();
}

function getEquippedColourItem(data) {
    if (currentEquippedItems.colour == null) return null;
    const item = data.profile_items?.[currentEquippedItems.colour];
    return item?.type === "colour" ? item : null;
}

function findTeamMatchOnDate(date, teamName) {
    if (!matchData || !teamName) return null;
    return matchData[date]?.find(entry => entry.teamsInvolved?.includes(teamName)) || null;
}

let refreshTimer = null;
let startTime;

const debugLog = createDebugLogger('userinfogenerate.js', '#ff52dc', '#ffa3ed');

async function umklFetch(url, body = null) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
    localStorage.setItem("apiReqsSent", apiReqsSent + 1);
    return response.json();
}

function fillInPageTitle(data) {
    document.title = `${makePossessive(data.username)} Profile`;
    teamNameBox.innerText = `${makePossessive(data.username)} Profile`;
}

function generateProfileCardContent(data) {
    return profileCardContentHTML
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
        .replace("{{cardExtraText}}", "Use /user-profile to see your own card!")
        .replace("{{profileCustomisationButton}}", areProfileItems ? `<button class="customise-button" id="showCardProfileItemsButton"><span class="fa-solid fa-paintbrush"></span> Customise design</button>` : '');
}

function generateProfileCardHTML(data) {
    return profileCardFormatHTML.replace("{{profileCardContent}}", generateProfileCardContent(data));
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

let profileButtonTimeout = null;

function attachProfileEventListeners() {
    cleanupProfileEventListeners();

    if (areProfileItems) {
        const showCardProfileItemsButton = document.getElementById("showCardProfileItemsButton");
        if (showCardProfileItemsButton) {
            profileCustomizeButtonHandler = () => {
                if (profileButtonTimeout) clearTimeout(profileButtonTimeout);
                profileButtonTimeout = setTimeout(() => {
                    showCardProfileItems();
                }, 50);
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

let spGraphMouseMoveHandler = null;
let spGraphMouseLeaveHandler = null;

function cleanupCard3DEffect() {
    const handlers = [card3DMouseMoveHandler, card3DMouseLeaveHandler, card3DGlareMouseMoveHandler];
    const events = ["mousemove", "mouseleave", "mousemove"];

    handlers.forEach((handler, i) => {
        if (handler) {
            document.removeEventListener(events[i], handler);
        }
    });

    card3DMouseMoveHandler = card3DMouseLeaveHandler = card3DGlareMouseMoveHandler = null;

    if (card3DAnimationId) {
        cancelAnimationFrame(card3DAnimationId);
        card3DAnimationId = null;
    }

    document.querySelector(".profile-card > div[style*='mix-blend-mode: overlay']")?.remove();
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
        debugLog(`${data.username} does not belong to a team`);
    }

    cleanupCard3DEffect();
    cleanupProfileEventListeners();

    let tempProfileCard = generateProfileCardHTML(data);

    if (teamData) {
        document.documentElement.style.setProperty('--highlight-color', `#${data.color}80`);
    }

    userCardBox.innerHTML = tempProfileCard;

    attachProfileEventListeners();

    createSPGraph(data);
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

async function getCurrentSeason() {
    return umklFetch('https://api.umkl.co.uk/seasoninfo', { season: 0 });
}

async function createSPGraph(data) {
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
    const extendedChanges = [0];

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
        const dailyChange = history[date].reduce((sum, event) => sum + event.change, 0);
        cumulative += dailyChange + chatSpForPeriod;
        extendedValues.push(index === extendedDates.length - 1 ? data.sp : Math.round(cumulative));
        extendedChanges.push(dailyChange + chatSpForPeriod);
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

    let lineColour = `#${data.color}`;
    const equippedColour = getEquippedColourItem(data);
    if (equippedColour) {
        if (equippedColour.name === "Rainbow") {
            const gradient = ctx.createLinearGradient(padding, 0, canvas.width - padding, 0);
            rainbowColours.forEach((colour, i) => gradient.addColorStop(i / (rainbowColours.length - 1), colour));
            lineColour = gradient;
        } else {
            lineColour = colourMap[equippedColour.name] || equippedColour.name;
        }
    }

    // Draw graph line
    ctx.strokeStyle = lineColour;
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
    const maxLabels = 4;
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
            ctx.translate(x, canvas.height - padding + 9 * graphResScale);
            ctx.rotate(-Math.PI / 10);
            ctx.textAlign = 'right';
            ctx.fillText(formattedDate, 0, 0);
            ctx.restore();
        });
    }

    // Draw values
    if (extendedDates.length > 0) {
        ctx.fillStyle = lineColour;
        ctx.font = `${11 * graphResScale}px Montserrat`;
        ctx.textAlign = 'center';

        displayIndices.forEach(index => {
            const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
            const x = padding + timeRatio * graphWidth;
            const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;

            const topY = padding + 10 * graphResScale;
            const textOffset = y - topY < 20 * graphResScale ? 15 * graphResScale : -8 * graphResScale;
            ctx.fillText(extendedValues[index], x, y + textOffset);
        });
    }

    // Draw points
    const pointDetails = [];
    ctx.fillStyle = lineColour;
    extendedDates.forEach((date, index) => {
        const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
        const x = padding + timeRatio * graphWidth;
        const y = canvas.height - padding - (extendedValues[index] / gridMax) * graphHeight;

        if (index > 0) {
            ctx.beginPath();
            ctx.arc(x, y, 3 * graphResScale, 0, 2 * Math.PI);
            ctx.fill();

            const eventType = history[date]?.[0]?.event;
            let matchInfo = null;
            const teamMatch = findTeamMatchOnDate(date, data.team);
            if (teamMatch?.eventID && teamMatch?.teamsInvolved) {
                matchInfo = { eventID: teamMatch.eventID, teamsInvolved: teamMatch.teamsInvolved };
            }

            pointDetails.push({
                x, y, date,
                change: extendedChanges[index],
                cumulative: extendedValues[index],
                eventType,
                matchInfo
            });
        }
    });

    const iconY = 10 * graphResScale;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${9 * graphResScale}px "Font Awesome 6 Free"`;

    const minIconSpacing = 12 * graphResScale;
    let lastIconX = -Infinity;

    extendedDates.forEach((date, index) => {
        if (index === 0) return;
        const icon = eventIcons[history[date]?.[0]?.event];
        if (!icon) return;

        const timeRatio = (dateTimestamps[index] - fakeStartTime) / timeRange;
        const x = padding + timeRatio * graphWidth;

        if (x - lastIconX < minIconSpacing) return;
        lastIconX = x;

        ctx.fillStyle = '#666';
        ctx.fillText(icon, x, iconY);
    });

    // Hover tooltips on the points
    const container = canvas.parentElement;
    let tooltip = container.querySelector('.sp-graph-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'sp-graph-tooltip';
        container.appendChild(tooltip);
    }

    const eventLabels = { match: 'Match', testmatch: 'Test Match' };

    let hideTimeout = null;
    const cancelHide = () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    };
    const scheduleHide = () => {
        cancelHide();
        hideTimeout = setTimeout(() => {
            tooltip.style.opacity = '0';
            canvas.style.cursor = 'default';
        }, 150);
    };
    const isOverTooltip = (e) => {
        const tooltipRect = tooltip.getBoundingClientRect();
        return e.clientX >= tooltipRect.left && e.clientX <= tooltipRect.right &&
            e.clientY >= tooltipRect.top && e.clientY <= tooltipRect.bottom;
    };

    if (spGraphMouseMoveHandler) container.removeEventListener('mousemove', spGraphMouseMoveHandler);
    if (spGraphMouseLeaveHandler) container.removeEventListener('mouseleave', spGraphMouseLeaveHandler);

    spGraphMouseMoveHandler = (e) => {
        if (isOverTooltip(e)) {
            cancelHide();
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        let closest = null;
        let closestDist = Infinity;
        pointDetails.forEach(point => {
            const dist = Math.hypot(point.x - mouseX, point.y - mouseY);
            if (dist < closestDist) {
                closestDist = dist;
                closest = point;
            }
        });

        if (closest && closestDist <= 14 * graphResScale) {
            cancelHide();

            const dateObj = new Date(closest.date);
            const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
            const label = eventLabels[closest.eventType] || 'SP update';

            const titleLine = closest.matchInfo
                ? `<a href="pages/matches/?graphEventID=${closest.matchInfo.eventID}">${closest.matchInfo.teamsInvolved.join(' VS ')}</a>`
                : `<strong>${label}</strong>`;
            const testMatchLine = (closest.matchInfo && closest.eventType === 'testmatch') ? '<br>Test Match' : '';

            tooltip.innerHTML = `${titleLine}${testMatchLine}<br>${formattedDate}`;
            tooltip.style.opacity = '1';

            const pointContainerX = (rect.left - containerRect.left) + closest.x / scaleX;
            const pointContainerY = (rect.top - containerRect.top) + closest.y / scaleY;
            tooltip.classList.toggle('sp-graph-tooltip-below', pointContainerY < 90);
            tooltip.style.left = `${pointContainerX}px`;
            tooltip.style.top = `${pointContainerY}px`;
            canvas.style.cursor = 'pointer';
        } else {
            scheduleHide();
        }
    };

    spGraphMouseLeaveHandler = (e) => {
        if (isOverTooltip(e)) return;
        scheduleHide();
    };

    container.addEventListener('mousemove', spGraphMouseMoveHandler);
    container.addEventListener('mouseleave', spGraphMouseLeaveHandler);
}

async function getMatchData() {
    return umklFetch('https://api.umkl.co.uk/matchdata', {});
}

async function getTeamdata(team, season) {
    return umklFetch('https://api.umkl.co.uk/teamdata', { team: `${team}`, season: `${season}` });
}

window.addEventListener("resize", () => {
    if (data) {
        createSPGraph(data);
    }
});

document.addEventListener('keydown', async (event) => {
    const key = event.key.toLowerCase();

    if (key == 's') {
        if (currentlyShowingItems) {
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        await generateCardImage();
    }
});

async function preloadCardImage() {
    const captureId = ++cardCaptureId;
    const node = document.getElementById("userCardBox");
    const profileCard = document.querySelector(".profile-card");

    const originalTransition = profileCard.style.transition;
    profileCard.style.transition = 'none';

    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    takingCardScreenshot = true;
    createSPGraph(data);

    let wrapper;
    try {
        await new Promise(resolve => setTimeout(resolve, 50));

        const nodeRect = node.getBoundingClientRect();
        const rect = profileCard.getBoundingClientRect();

        // capture from a detached clone instead of the live card
        const clone = node.cloneNode(true);

        clone.style.width = `${nodeRect.width}px`;
        const clonedCanvas = clone.querySelector('canvas');
        const clonedProfileCard = clone.querySelector('.profile-card');
        const clonedButton = clone.querySelector('.customise-button');
        const clonedCardHelp = clone.querySelector('.card-help');

        const originalCanvas = document.getElementById('spGraph');
        if (clonedCanvas && originalCanvas) {
            const canvasSize = getComputedStyle(originalCanvas);
            clonedCanvas.style.width = canvasSize.width;
            clonedCanvas.style.height = canvasSize.height;
            clonedCanvas.getContext('2d').drawImage(originalCanvas, 0, 0);
        }

        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

        clonedProfileCard?.classList.add('capturing-screenshot');
        if (clonedButton) clonedButton.style.display = 'none';
        if (clonedCardHelp) {
            clonedCardHelp.style.display = 'block';
            if (!isMobile) clonedCardHelp.style.width = '100%';
        }

        wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            height: '0',
            overflow: 'hidden',
            pointerEvents: 'none'
        });
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        const dataURL = await htmlToImage.toPng(clone, {
            pixelRatio: shareResScale,
            width: Math.round(isMobile ? rect.width : rect.width + 40),
            height: Math.round(node.scrollHeight + 40),
            style: {
                transform: isMobile ? 'none' : `translateX(-150px)`
            }
        });

        const response = await fetch(dataURL);
        const blob = await response.blob();
        // A newer capture may have started while this one was occuring
        if (captureId === cardCaptureId) cardImageBlob = blob;
    } catch (err) {
        console.error("Capture failed:", err);
    }

    wrapper?.remove();
    cardChanged = false;
    profileCard.style.transition = originalTransition;
    takingCardScreenshot = false;
    setTimeout(() => {
        graphResScale = 2;
        createSPGraph(data);
        graphResScale = shareResScale;
    }, 100);
}

async function generateCardImage() {
    try {
        if (getIsPopupShowing()) return;
        const useClipboard = isWindowsOrLinux() || !navigator.canShare;

        let blob = cardImageBlob;
        const maxAttempts = 50;
        let attempts = 0;
        while (!blob && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            blob = cardImageBlob;
            attempts++;
        }

        if (!blob) {
            console.error("cardImageBlob is still empty after waiting");
            return;
        }

        const message = `Check out the UMKL profile for ${data.username}!`;

        if (useClipboard) {
            const success = await copyTextToClipboard(message);
            shareButton.innerText = success ? "Copied to clipboard!" : "Failed to copy!";
            showImagePreview(blob, undefined, message)
        } else {
            await shareImage(
                `${data.username} UMKL Profile`,
                message,
                blob,
                `${data.username.replaceAll(" ", "_")}_UMKL_profile.png`
            )
        }

        debugLog('Copied image to clipboard!');
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

            const logoHTML = `<img src="assets/media/profile/wordmark_standard.avif" alt="UMKL logo" class="profile-umkl-logo" onload="this.style.opacity=0.9" />`;

            profileCard.insertAdjacentHTML('afterbegin', logoHTML);

            profileCard.style.transform = 'rotateY(0deg)';

            createSPGraph(data);
            attachProfileEventListeners();
            addCard3DEffect();
            applyEquippedItemsToCard();
        }, 240);
    }, 50);

    setTimeout(() => {
        profileCard.style.transition = 'transform 0.1s ease-out';
        isFlipping = false;
        if (cardChanged) preloadCardImage();
    }, 550)
}

function populateItemsGrid(category) {
    const grid = document.getElementById("itemsGrid");
    const filteredItems = category === "all"
        ? data.profile_items
        : data.profile_items.filter(item => item.type === category);

    grid.innerHTML = "";

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
        <img class="item-preview" src="assets/media/profile/${getItemFileName(item.name)}.avif"
            onload="this.style.opacity=1" onerror="this.onerror=null; this.style.display='none';"/>
        <div class="item-info">
            <h4 class="item-name">${item.name}</h4>
            <span class="item-type"><span class="fa-solid fa-${item.type}"></span> ${item.type}</span>
        </div>
    `;

    return div;
}

function toggleItemEquip(type, itemIndex) {
    const filteredItems = document.querySelector(".category-button.active").dataset.category === "all"
        ? data.profile_items
        : data.profile_items.filter(item => item.type === type);
    const item = filteredItems[itemIndex];
    const globalIndex = data.profile_items.indexOf(item);

    if (currentEquippedItems[type] === globalIndex) {
        currentEquippedItems[type] = null;
    } else {
        currentEquippedItems[type] = globalIndex;
    }

    const activeCategory = document.querySelector(".category-button.active").dataset.category;
    populateItemsGrid(activeCategory);
}

function isItemEquipped(item) {
    return currentEquippedItems[item.type] === data.profile_items.indexOf(item);
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
    if (isFlipping) return;

    const equippedItemsData = {};
    Object.keys(currentEquippedItems).forEach(type => {
        if (currentEquippedItems[type] !== null) {
            equippedItemsData[type] = data.profile_items[currentEquippedItems[type]];
        }
    });

    equippedItemsData["username"] = data.username;
    cardChanged = true;
    debugLog(`Saving equipped items: ${JSON.stringify(equippedItemsData)}`);

    localStorage.setItem("userProfileSettings", JSON.stringify(equippedItemsData));

    goBackToProfile()
}

// Make functions globally accessible for onclick handlers
window.saveItemEquips = saveItemEquips;
window.goBackToProfile = goBackToProfile;

function loadEquippedItems() {
    try {
        const saved = localStorage.getItem("userProfileSettings");
        if (!saved) return;

        const equipped = JSON.parse(saved);
        if (equipped.username !== data.username) return;

        for (const type of ['background', 'overlay', 'colour']) {
            if (equipped[type]) {
                currentEquippedItems[type] = data.profile_items.findIndex(item => item.name === equipped[type].name);
            }
        }
    } catch (e) {
        console.error("Error loading equipped items:", e);
    }
}

function applyEquippedItemsToCard() {
    const profileCard = document.querySelector(".profile-card");
    if (!profileCard) return;

    profileCard.style.backgroundImage = "";
    profileCard.querySelector(".profile-card-overlay")?.remove();

    if (currentEquippedItems.background != null) {
        const item = data.profile_items[currentEquippedItems.background];
        if (item?.type === "background") {
            const bgFileName = getItemFileName(item.name);
            const overlayOpacity = backgroundOverlayOpacity[bgFileName] ?? 0.3;
            profileCard.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, ${overlayOpacity}), rgba(255, 255, 255, ${overlayOpacity})), url('assets/media/profile/${bgFileName}.avif')`;
            profileCard.style.backgroundSize = "cover";
            profileCard.style.backgroundPosition = "center";
        }
    }

    if (currentEquippedItems.overlay != null) {
        const item = data.profile_items[currentEquippedItems.overlay];
        if (item?.type === "overlay") {
            const overlayFileName = getItemFileName(item.name);
            let existingOverlay = profileCard.querySelector(".profile-card-overlay");
            if (!existingOverlay) {
                existingOverlay = document.createElement("div");
                existingOverlay.className = "profile-card-overlay";
                profileCard.appendChild(existingOverlay);
            }
            Object.assign(existingOverlay.style, {
                backgroundImage: `url('assets/media/profile/${overlayFileName}.avif')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "absolute",
                inset: "0",
                pointerEvents: "none",
                zIndex: "1",
                opacity: "0.1"
            });
        }
    }

    profileCard.style.setProperty('--team-color', `#${data.color}`);
    if (currentEquippedItems.colour != null) {
        const item = data.profile_items[currentEquippedItems.colour];
        if (item?.type === "colour") {
            if (item.name === "Rainbow") {
                profileCard.style.border = "3px solid transparent";
                profileCard.style.background = `linear-gradient(145deg, rgba(255,255,255,0.85), rgba(255,255,255,0.7)) padding-box, ${colourMap["Rainbow"]} border-box`;
            } else {
                profileCard.style.setProperty('--team-color', colourMap[item.name] || item.name);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    debugLog('Generating player info box');

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
            const response = await fetch('assets/media/profile/profileunlockitems.json');
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
    console.log(data);

    loadEquippedItems();

    fillInPageTitle(data);

    try {
        matchData = await getMatchData();
        fetchedCurrentSeason = parseInt(await getCurrentSeason());
    } catch (error) {
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
                    applyEquippedItemsToCard();
                } catch (err) {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generateProfileBox(data, showError);

    applyEquippedItemsToCard();

    const shareButton = document.getElementById("shareButton");

    setOriginalMessage(shareButton.innerHTML);
    preloadCardImage();
    shareButton.addEventListener("click", async () => {
        if (cardChanged && currentlyShowingItems) {
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        await generateCardImage();
    });

    debugLog(`Generated user info box in ${(performance.now() - startTime).toFixed(2)}ms`);
});
