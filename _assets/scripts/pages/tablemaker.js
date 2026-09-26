/*
    This script draws a results table in the same style as the one
    posted by the bot after a match, using user-provided scores.
*/
import { createColorPicker } from '/_assets/scripts/components/colorpicker.js';
import { getMatchData, getMatchCache } from '/_assets/scripts/utils/matchdata.js';
import { isWindowsOrLinux, copyImageToClipboard, shareImage, showImagePreview, setOriginalMessage, getOriginalMessage, getIsPopupShowing } from '/_assets/scripts/utils/shareAPIhelper.js';

const TEAM_ICON_DIR = "https://api.umkl.co.uk/teamemblems/";
const OVERLAY_PATH = "/_assets/media/graphics/resultsoverlay.avif";
const FONT = "Montserrat";
const ACCENT_COLOR = "#bc0839";
const WIDTH = 3268;
const HEIGHT = 2430;
const HALF = 1215;
const ROW_SPACING = 192;
const ROW_Y = [118, 1358];
const TEXT_POS = [[465, 945], [465, 2160]];
const SCORE_X_OFFSET = 2300;
const SCORE_Y_OFFSET = -325;
const PENALTY_POS = [[2770, 875], [2770, 875 + HALF]];
const EMBLEM_SIZE = 600;
const PLAYER_MAX_WIDTH = 900;
const TEAM_NAME_MAX_WIDTH = 800;
const MAX_PLAYERS = 6;
const SCORE_MAP = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const STORAGE_KEY = "tableMakerState";

let teamColors = [];
let overlayImage;
const emblemCache = new Map();
let renderQueued = false;
let renderId = 0;

const canvas = document.getElementById("table-canvas");
const ctx = canvas.getContext("2d");
const shareButton = document.getElementById("shareButton");
const downloadButton = document.getElementById("downloadButton");
const clearButton = document.getElementById("clearButton");
const testMatchInput = document.getElementById("test-match");
const teamList = document.getElementById("team-list");
const eventStatus = document.getElementById("event-status");
const teamInputs = [0, 1].map(i => ({
    name: document.getElementById(`team-name-${i}`),
    color: createColorPicker(document.getElementById(`team-color-field-${i}`), { onChange: () => queueRender() }),
    players: document.getElementById(`players-${i}`),
    penalty: document.getElementById(`penalty-${i}`),
}));

const defaultColors = teamInputs.map(inputs => inputs.color.getColor());

setOriginalMessage(shareButton.innerHTML);
loadState();

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

function getEmblem(name) {
    const key = (name || "DEFAULT").toUpperCase();
    if (!emblemCache.has(key)) {
        emblemCache.set(key, loadImage(`${TEAM_ICON_DIR}${encodeURIComponent(key)}?og`)
            .catch(() => key === "DEFAULT" ? null : getEmblem("DEFAULT")));
    }
    return emblemCache.get(key);
}

async function getTeamcolors() {
    const response = await fetch('https://api.umkl.co.uk/teamcolors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: "{}"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
    localStorage.setItem("apiReqsSent", apiReqsSent + 1);
    return response.json();
}

async function findEvent(eventID) {
    let matchData;
    try {
        matchData = await getMatchData();
    } catch {
        matchData = getMatchCache() || {};
    }
    return Object.values(matchData).flat().find(event => event.eventID === eventID);
}

// Player names aren't public, so each placeholder player takes the nth best finish of every race
function getPlaceholderScores(event, teamIndex) {
    const [, points, penalty] = event.results[teamIndex];
    const rawTotal = points + penalty;
    const scores = Array(MAX_PLAYERS).fill(0);
    const races = event.detailedResults || [];

    races.forEach(race => {
        [...(race[teamIndex + 1] || [])].sort((a, b) => a - b).slice(0, MAX_PLAYERS)
            .forEach((position, i) => { scores[i] += SCORE_MAP[position - 1] || 0; });
    });

    if (!races.length) {
        scores.forEach((_, i) => {
            scores[i] = Math.floor(rawTotal / MAX_PLAYERS) + (i < rawTotal % MAX_PLAYERS ? 1 : 0);
        });
    } else {
        // Some stored race positions don't add up to the official total, which takes priority
        scores[MAX_PLAYERS - 1] += rawTotal - scores.reduce((sum, s) => sum + s, 0);
    }
    return scores;
}

async function loadEvent(eventID) {
    eventStatus.textContent = "Loading match results...";
    const event = await findEvent(eventID);
    if (!event?.results?.length) {
        eventStatus.textContent = "Couldn't find the results for that match.";
        return;
    }

    testMatchInput.checked = !!event.testMatch;
    event.teamsInvolved.slice(0, 2).forEach((teamName, i) => {
        const inputs = teamInputs[i];
        const scores = getPlaceholderScores(event, i);
        const color = teamColors.find(t => t.team_name.toLowerCase() === teamName.toLowerCase())?.team_color;
        inputs.name.value = teamName;
        inputs.players.value = scores.map((score, j) => `Player ${i * MAX_PLAYERS + j + 1} ${score}`).join("\n");
        inputs.penalty.value = event.results[i][2];
        if (color) inputs.color.setColor(color);
    });
    eventStatus.textContent = "";
    queueRender();
}

function parsePlayers(text) {
    return text.split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, MAX_PLAYERS)
        .map(line => {
            const match = line.match(/^(.*?)[\s,]+(-?\d+)$/);
            return match
                ? { name: match[1].trim(), score: parseInt(match[2]) }
                : { name: line, score: 0 };
        });
}

function readTeams() {
    return teamInputs.map((inputs, i) => {
        const players = parsePlayers(inputs.players.value || inputs.players.placeholder)
            .sort((a, b) => b.score - a.score);
        const penalty = Math.max(0, parseInt(inputs.penalty.value) || 0);
        return {
            name: inputs.name.value.trim() || inputs.name.placeholder,
            color: inputs.color.getColor(),
            players,
            penalty,
            total: players.reduce((sum, p) => sum + p.score, 0) - penalty,
        };
    });
}

function setFont(size, weight) {
    ctx.font = `${weight} ${size}px "${FONT}"`;
}

function drawText(text, x, y, size, color, align = "center", weight = 700, shadow = false) {
    setFont(size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    if (shadow) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
    }
    ctx.fillText(text, x, y);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
}

function drawRoundedRect(x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
}

function truncate(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const ellipsisWidth = ctx.measureText("...").width;
    while (text && ctx.measureText(text).width + ellipsisWidth > maxWidth) {
        text = text.slice(0, -1);
    }
    return text + "...";
}

// Competition ranking across both teams, so tied scores share a position
function getPositions(teams) {
    const allScores = teams.flatMap(t => t.players.map(p => p.score));
    return score => 1 + allScores.filter(s => s > score).length;
}

async function render() {
    const id = ++renderId;
    const teams = readTeams();
    if (teams[1].total > teams[0].total) teams.reverse();
    const [emblems] = await Promise.all([
        Promise.all(teams.map(t => getEmblem(t.name))),
        document.fonts.load(`700 100px "${FONT}"`),
        document.fonts.load(`600 100px "${FONT}"`),
    ]);
    // A newer render started while this one was waiting on emblems
    if (id !== renderId) return;
    const positionOf = getPositions(teams);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    teams.forEach((team, i) => {
        ctx.fillStyle = team.color;
        ctx.fillRect(0, i * HALF, WIDTH, HALF);
    });

    if (overlayImage) ctx.drawImage(overlayImage, 0, 0, WIDTH, HEIGHT);

    if (testMatchInput.checked) {
        drawRoundedRect(210, 1150, 500, 125, 15, "#fff");
        drawText("Test Match", 460, 1212, 75, ACCENT_COLOR, "center", 600);
    }

    teams.forEach((team, i) => {
        const [x, y] = TEXT_POS[i];

        let nameSize = 135;
        setFont(nameSize, 700);
        while (ctx.measureText(team.name).width > TEAM_NAME_MAX_WIDTH && nameSize > 10) {
            nameSize -= 5;
            setFont(nameSize, 700);
        }
        drawText(team.name, x, y, nameSize, "#fff", "center", 700, true);
        drawText(`${team.total}`, x + SCORE_X_OFFSET, y + SCORE_Y_OFFSET, 425, "#fff", "center", 700, true);

        if (team.penalty > 0) {
            const [px, py] = PENALTY_POS[i];
            drawRoundedRect(px - 250, py - 50, 500, 100, 12, "#fff");
            drawText(`Penalty: -${team.penalty}`, px, py + 2, 70, ACCENT_COLOR, "center", 600);
        }

        team.players.forEach((player, j) => {
            const rowY = ROW_Y[i] + j * ROW_SPACING;
            drawText(`${positionOf(player.score)}`, 1022, rowY, 75, "#fff");
            setFont(100, 700);
            drawText(truncate(player.name, PLAYER_MAX_WIDTH), 1110, rowY, 100, team.color, "left");
            drawText(`${player.score}`, 2200, rowY, 100, team.color, "right", 600);
        });

        if (emblems[i]) {
            ctx.drawImage(emblems[i], x - EMBLEM_SIZE / 2, y - 700, EMBLEM_SIZE, EMBLEM_SIZE);
        }
    });

    drawText(`±${Math.abs(teams[0].total - teams[1].total)}`, 2770, HALF + 2, 100, ACCENT_COLOR);
}

function saveState() {
    const state = {
        testMatch: testMatchInput.checked,
        teams: teamInputs.map(inputs => ({
            name: inputs.name.value,
            color: inputs.color.getColor(),
            players: inputs.players.value,
            penalty: inputs.penalty.value,
        })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    let state;
    try {
        state = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
        return;
    }
    if (!state?.teams) return;
    testMatchInput.checked = !!state.testMatch;
    state.teams.slice(0, 2).forEach((team, i) => {
        const inputs = teamInputs[i];
        inputs.name.value = team.name ?? "";
        inputs.players.value = team.players ?? "";
        inputs.penalty.value = team.penalty ?? 0;
        if (team.color) inputs.color.setColor(team.color);
    });
}

function clearState() {
    if (!confirm("Clear all table data?")) return;
    localStorage.removeItem(STORAGE_KEY);
    testMatchInput.checked = false;
    teamInputs.forEach((inputs, i) => {
        inputs.name.value = "";
        inputs.players.value = "";
        inputs.penalty.value = 0;
        inputs.color.setColor(defaultColors[i]);
    });
    queueRender();
}

function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(async () => {
        renderQueued = false;
        saveState();
        await render();
    });
}

function canvasToBlob() {
    return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

function getFilename() {
    const [a, b] = readTeams().map(t => t.name.replaceAll(" ", "_"));
    return `results_${a}_vs_${b}.png`;
}

async function shareButtonPressed() {
    if (getIsPopupShowing()) return;
    await render();
    const blob = await canvasToBlob();
    const [a, b] = readTeams().map(t => t.name);
    const message = `Check out the results for ${a} vs ${b}!`;

    if (isWindowsOrLinux() || !navigator.canShare) {
        const success = await copyImageToClipboard(blob);
        shareButton.innerText = success ? "Image copied to clipboard!" : "Failed to copy!";
        if (success) {
            showImagePreview(blob, blob.url, message);
        } else {
            setTimeout(() => { shareButton.innerHTML = getOriginalMessage(); }, 2000);
        }
    } else {
        await shareImage(`${a} vs ${b} Results`, message, blob, getFilename());
    }
}

async function downloadButtonPressed() {
    await render();
    const url = URL.createObjectURL(await canvasToBlob());
    const link = document.createElement("a");
    link.href = url;
    link.download = getFilename();
    link.click();
    URL.revokeObjectURL(url);
}

teamInputs.forEach(inputs => {
    inputs.name.addEventListener("input", () => {
        const match = teamColors.find(t => t.team_name.toLowerCase() === inputs.name.value.trim().toLowerCase());
        if (match) inputs.color.setColor(match.team_color);
        queueRender();
    });
    [inputs.players, inputs.penalty].forEach(el => el.addEventListener("input", queueRender));
});
testMatchInput.addEventListener("change", queueRender);
shareButton.addEventListener("click", shareButtonPressed);
downloadButton.addEventListener("click", downloadButtonPressed);
clearButton.addEventListener("click", clearState);

document.addEventListener("DOMContentLoaded", async () => {
    try {
        overlayImage = await loadImage(OVERLAY_PATH);
    } catch (error) {
        console.error(error);
    }
    queueRender();

    try {
        teamColors = await getTeamcolors();
        teamList.innerHTML = teamColors.map(t => `<option value="${t.team_name}"></option>`).join("");
    } catch (error) {
        console.error("Failed to fetch team colours:", error);
    }

    const eventID = new URLSearchParams(window.location.search).get("eventID");
    if (eventID) await loadEvent(eventID);
});
