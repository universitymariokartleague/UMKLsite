/*
    This script draws a results table in the same style as the one
    posted by the bot after a match, using user-provided scores.
    Supports 6v6, 4v4v4 and 3v3v3v3 matches.
*/
import { createColorPicker } from '/_assets/scripts/components/colorpicker.js';
import { getMatchData, getMatchCache } from '/_assets/scripts/utils/matchdata.js';
import { readResultsScreenshot, groupPlayersByTag } from '/_assets/scripts/utils/resultsocr.js';
import { TEAM_TAGS } from '/_assets/scripts/utils/teamtags.js';
import { isWindowsOrLinux, copyImageToClipboard, shareImage, showImagePreview, setOriginalMessage, getOriginalMessage, getIsPopupShowing } from '/_assets/scripts/utils/shareAPIhelper.js';

const TEAM_ICON_DIR = "https://api.umkl.co.uk/teamemblems/";
const BACKGROUND_PATH = "/_assets/media/graphics/resultsbackground.avif";
const FONT = "Montserrat";
const ACCENT_COLOR = "#bc0839";
const WIDTH = 3268;
const HEIGHT = 2430;
const TOTAL_PLAYERS = 12;
const MAX_TEAMS = 4;
const SCORE_MAP = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const STORAGE_KEY = "tableMakerState";
const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/tesseract.esm.min.js";

const ROW_X = 941;
const ROW_WIDTH = 1301;
const ROW_HEIGHT = 162;
const ROW_SPACING = 192;
const POSITION_X = 1022;
const PLAYER_NAME_X = 1110;
const PLAYER_SCORE_X = 2200;
const PLAYER_MAX_WIDTH = 900;
const TEAM_NAME_X = 465;
const TEAM_NAME_MAX_WIDTH = 800;
const TEAM_SCORE_X = 2765;
const RIGHT_BOX_X = 2770;
const PENALTY_HEIGHT = 100;
const PENALTY_GAP = 45;

// Sizes per team count, scaled down so each team's band still fits
const LAYOUTS = {
    2: { emblem: 600, nameSize: 135, scoreSize: 425 },
    3: { emblem: 440, nameSize: 115, scoreSize: 340 },
    4: { emblem: 300, nameSize: 90, scoreSize: 260 },
};

const DEFAULT_TEAMS = [
    { name: "York", color: "#1baa8b" },
    { name: "Staffs", color: "#a11212" },
    { name: "Edinburgh", color: "#287ac8" },
    { name: "Birmingham", color: "#c59a00" },
];

let teamColors = [];
let backgroundImage;
let teamCount = 2;
const emblemCache = new Map();
let renderQueued = false;
let renderId = 0;
let ocrWorkerPromise;
let importing = false;
let pendingScreenshot = null;

const canvas = document.getElementById("table-canvas");
const ctx = canvas.getContext("2d");
const shareButton = document.getElementById("shareButton");
const downloadButton = document.getElementById("downloadButton");
const clearButton = document.getElementById("clearButton");
const testMatchInput = document.getElementById("test-match");
const teamList = document.getElementById("team-list");
const eventStatus = document.getElementById("event-status");
const modeButtons = document.querySelectorAll("#mode-select [data-teams]");
const teamInputsContainer = document.getElementById("team-inputs");
const importButton = document.getElementById("importButton");
const importInput = document.getElementById("importInput");
const importModal = document.getElementById("importModal");
const importModalCard = document.getElementById("importModalCard");
const importModalTitle = document.getElementById("importModalTitle");
const importModalSubtitle = document.getElementById("importModalSubtitle");
const importModalList = document.getElementById("importModalList");
const importModalClose = document.getElementById("importModalClose");
const importStatus = document.getElementById("importStatus");
const screenshotPreview = document.getElementById("screenshotPreview");
const screenshotPreviewImage = document.getElementById("screenshotPreviewImage");
const screenshotPreviewClose = document.getElementById("screenshotPreviewClose");

const teamInputs = DEFAULT_TEAMS.map((team, i) => createTeamPanel(team, i));

setOriginalMessage(shareButton.innerHTML);
loadState();
applyMode();

function createTeamPanel(team, i) {
    const panel = document.createElement("div");
    panel.className = "table-maker-team";
    panel.innerHTML = `
        <label for="team-name-${i}">Team ${i + 1} name</label>
        <div class="table-maker-row">
            <input type="text" id="team-name-${i}" list="team-list" placeholder="${team.name}" autocomplete="off">
            <span class="color-picker-field">
                <button type="button" class="color-picker-swatch" aria-label="Open colour picker"
                    aria-expanded="false" style="background-color: ${team.color};"></button>
                <input value="${team.color}" class="color-picker-input" type="text"
                    autocomplete="off" spellcheck="false" maxlength="7" aria-label="Team ${i + 1} colour">
            </span>
        </div>
        <label for="players-${i}">Players (one per line: name score)</label>
        <textarea translate="no" id="players-${i}"></textarea>
        <label for="penalty-${i}">Penalty</label>
        <input type="number" id="penalty-${i}" min="0" value="0">
    `;
    teamInputsContainer.appendChild(panel);

    return {
        panel,
        name: panel.querySelector(`#team-name-${i}`),
        color: createColorPicker(panel.querySelector(".color-picker-field"), { onChange: () => queueRender() }),
        players: panel.querySelector(`#players-${i}`),
        penalty: panel.querySelector(`#penalty-${i}`),
    };
}

function getPlayersPerTeam() {
    return TOTAL_PLAYERS / teamCount;
}

function applyMode() {
    const playersPerTeam = getPlayersPerTeam();
    modeButtons.forEach(button => {
        button.classList.toggle("active", Number(button.dataset.teams) === teamCount);
    });
    teamInputs.forEach((inputs, i) => {
        inputs.panel.hidden = i >= teamCount;
        inputs.players.placeholder = Array.from({ length: playersPerTeam }, (_, j) =>
            `Player ${i * playersPerTeam + j + 1} ${Math.max(5, 85 - j * 9 - i * 4)}`).join("\n");
    });
}

function setMode(count) {
    teamCount = count;
    applyMode();
    queueRender();
}

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
function getPlaceholderScores(event, teamIndex, playerCount) {
    const [, points, penalty] = event.results[teamIndex];
    const rawTotal = points + penalty;
    const scores = Array(playerCount).fill(0);
    const races = event.detailedResults || [];

    races.forEach(race => {
        [...(race[teamIndex + 1] || [])].sort((a, b) => a - b).slice(0, playerCount)
            .forEach((position, i) => { scores[i] += SCORE_MAP[position - 1] || 0; });
    });

    if (!races.length) {
        scores.forEach((_, i) => {
            scores[i] = Math.floor(rawTotal / playerCount) + (i < rawTotal % playerCount ? 1 : 0);
        });
    } else {
        // Some stored race positions don't add up to the official total, which takes priority
        scores[playerCount - 1] += rawTotal - scores.reduce((sum, s) => sum + s, 0);
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

    const count = Math.min(event.teamsInvolved.length, MAX_TEAMS);
    teamCount = LAYOUTS[count] ? count : 2;
    applyMode();
    const playersPerTeam = getPlayersPerTeam();

    testMatchInput.checked = !!event.testMatch;
    event.teamsInvolved.slice(0, teamCount).forEach((teamName, i) => {
        const inputs = teamInputs[i];
        const scores = getPlaceholderScores(event, i, playersPerTeam);
        const color = teamColors.find(t => t.team_name.toLowerCase() === teamName.toLowerCase())?.team_color;
        inputs.name.value = teamName;
        inputs.players.value = scores.map((score, j) => `Player ${i * playersPerTeam + j + 1} ${score}`).join("\n");
        inputs.penalty.value = event.results[i][2];
        if (color) inputs.color.setColor(color);
    });
    eventStatus.textContent = "";
    queueRender();
}

// Only downloaded the first time a screenshot is imported, since it's several MB
function getOcrWorker() {
    ocrWorkerPromise ??= import(TESSERACT_URL).then(async ({ default: Tesseract }) => {
        const worker = await Tesseract.createWorker("eng");
        await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE });
        return worker;
    }).catch(error => {
        ocrWorkerPromise = null;
        throw error;
    });
    return ocrWorkerPromise;
}

function openImportModal(title, subtitle, items = []) {
    importModalTitle.textContent = title;
    importModalSubtitle.textContent = subtitle;
    importModalList.replaceChildren(...items.map(({ text, warning }) => {
        const item = document.createElement("li");
        item.textContent = text;
        if (warning) item.classList.add("import-modal-warning");
        return item;
    }));
    importModal.classList.remove("hidden", "closing");
    importModalCard.classList.remove("closing");
    importModalClose.focus();
}

function closeImportModal() {
    if (importModal.classList.contains("hidden") || importModal.classList.contains("closing")) return;
    if (pendingScreenshot) {
        showScreenshotPreview(pendingScreenshot);
        pendingScreenshot = null;
    }
    importModal.classList.add("closing");
    importModalCard.classList.add("closing");
    importModal.addEventListener("animationend", () => {
        importModal.classList.add("hidden");
        importModal.classList.remove("closing");
        importModalCard.classList.remove("closing");
    }, { once: true });
}

function setImportStatus(message) {
    importStatus.textContent = message ?? "";
    importStatus.hidden = !message;
}

function showScreenshotPreview(file) {
    if (screenshotPreviewImage.src) URL.revokeObjectURL(screenshotPreviewImage.src);
    screenshotPreviewImage.src = URL.createObjectURL(file);
    screenshotPreview.classList.remove("expanded");
    screenshotPreview.hidden = false;
}

function hideScreenshotPreview() {
    screenshotPreview.hidden = true;
    if (screenshotPreviewImage.src) URL.revokeObjectURL(screenshotPreviewImage.src);
    screenshotPreviewImage.removeAttribute("src");
}

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

async function importScreenshot(file) {
    if (importing || !file?.type.startsWith("image/")) return;
    importing = true;
    importButton.disabled = true;
    try {
        const image = await createImageBitmap(file);
        if (Math.abs(image.width / image.height - 16 / 9) > 0.05) {
            openImportModal("Couldn't import screenshot", "That doesn't look like a full 16:9 screenshot of the results screen.");
            return;
        }

        // The first import also downloads Tesseract, which can take a few seconds
        setImportStatus("Loading text recognition, please wait...");
        const worker = await getOcrWorker();
        setImportStatus("Reading screenshot, please wait...");

        const players = await readResultsScreenshot(image, worker,
            (done, total) => setImportStatus(`Reading screenshot, please wait... (${done}/${total})`));
        setImportStatus(null);
        const unreadScores = players.filter(p => p.score === null).length;
        const { teams } = groupPlayersByTag(
            players.map(p => ({ name: p.name || "Unknown", score: p.score ?? 0 })), teamCount, TEAM_TAGS);

        teams.forEach((team, i) => {
            const inputs = teamInputs[i];
            inputs.players.value = team.players.map(p => `${p.shortName} ${p.score}`).join("\n");
            if (team.teamName) {
                inputs.name.value = team.teamName;
                const color = teamColors.find(t => t.team_name.toLowerCase() === team.teamName.toLowerCase())?.team_color;
                if (color) inputs.color.setColor(color);
            }
        });
        queueRender();

        const teamLabels = teams.map((team, i) => team.teamName || teamInputs[i].name.value.trim() || `Team ${i + 1}`);
        const items = teams.map((team, i) => {
            const tag = team.tag ? ` (${team.tag})` : " (no tag found)";
            return { text: `${teamLabels[i]}${tag}: ${plural(team.players.length, "player")}` };
        });
        teams.forEach((team, i) => team.players.filter(p => p.untagged).forEach(p => {
            items.push({ text: `"${p.name}" (${p.score}) had no team tag, so they were put in ${teamLabels[i]}. Check they're on the right team.`, warning: true });
        }));
        if (unreadScores) items.push({ text: `${plural(unreadScores, "score")} couldn't be read and ${unreadScores === 1 ? "was" : "were"} set to 0`, warning: true });
        pendingScreenshot = file;
        openImportModal(`Imported ${plural(players.length, "player")}`, "Check the names, as symbols can be misread.", items);
    } catch (error) {
        console.error("Failed to read screenshot:", error);
        openImportModal("Couldn't import screenshot", "Something went wrong reading that image.");
    } finally {
        setImportStatus(null);
        importing = false;
        importButton.disabled = false;
        importInput.value = "";
    }
}

function parsePlayers(text) {
    return text.split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, getPlayersPerTeam())
        .map(line => {
            const match = line.match(/^(.*?)[\s,]+(-?\d+)$/);
            return match
                ? { name: match[1].trim(), score: parseInt(match[2]) }
                : { name: line, score: 0 };
        });
}

function readTeams() {
    return teamInputs.slice(0, teamCount).map(inputs => {
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

// The position square is a see-through hole so the team colour shows behind the number
function drawRowBox(top) {
    ctx.beginPath();
    ctx.roundRect(ROW_X, top, ROW_WIDTH, ROW_HEIGHT, 24);
    ctx.roundRect(ROW_X + 27, top + 27, 107, 108, 14);
    ctx.fillStyle = "#fff";
    ctx.fill("evenodd");
}

function truncate(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const ellipsisWidth = ctx.measureText("...").width;
    while (text && ctx.measureText(text).width + ellipsisWidth > maxWidth) {
        text = text.slice(0, -1);
    }
    return text + "...";
}

// Competition ranking across all teams, so tied scores share a position
function getPositions(teams) {
    const allScores = teams.flatMap(t => t.players.map(p => p.score));
    return score => 1 + allScores.filter(s => s > score).length;
}

async function render() {
    const id = ++renderId;
    const teams = readTeams().sort((a, b) => b.total - a.total);
    const [emblems] = await Promise.all([
        Promise.all(teams.map(t => getEmblem(t.name))),
        document.fonts.load(`700 100px "${FONT}"`),
        document.fonts.load(`600 100px "${FONT}"`),
    ]);
    // A newer render started while this one was waiting on emblems
    if (id !== renderId) return;

    const layout = LAYOUTS[teams.length];
    const bandHeight = HEIGHT / teams.length;
    const playersPerTeam = getPlayersPerTeam();
    const rowGroupHeight = (playersPerTeam - 1) * ROW_SPACING + ROW_HEIGHT;
    const positionOf = getPositions(teams);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    teams.forEach((team, i) => {
        ctx.fillStyle = team.color;
        ctx.fillRect(0, i * bandHeight, WIDTH, bandHeight);
    });

    if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);

    teams.forEach((team, i) => {
        const bandTop = i * bandHeight;
        const bandCenter = bandTop + bandHeight / 2;

        const nameOffset = layout.emblem + layout.nameSize * 0.74;
        const blockTop = bandCenter - (nameOffset + layout.nameSize / 2) / 2;
        if (emblems[i]) {
            ctx.drawImage(emblems[i], TEAM_NAME_X - layout.emblem / 2, blockTop, layout.emblem, layout.emblem);
        }

        let nameSize = layout.nameSize;
        setFont(nameSize, 700);
        while (ctx.measureText(team.name).width > TEAM_NAME_MAX_WIDTH && nameSize > 10) {
            nameSize -= 5;
            setFont(nameSize, 700);
        }
        drawText(team.name, TEAM_NAME_X, blockTop + nameOffset, nameSize, "#fff", "center", 700, true);

        // Centre on the digits' real ink bounds, and centre the score and penalty together as one block
        const scoreText = `${team.total}`;
        setFont(layout.scoreSize, 700);
        ctx.textBaseline = "middle";
        const scoreMetrics = ctx.measureText(scoreText);
        const scoreInkHeight = scoreMetrics.actualBoundingBoxAscent + scoreMetrics.actualBoundingBoxDescent;
        const blockHeight = scoreInkHeight + (team.penalty > 0 ? PENALTY_GAP + PENALTY_HEIGHT : 0);
        const scoreInkTop = bandCenter - blockHeight / 2;
        const scoreY = scoreInkTop + scoreMetrics.actualBoundingBoxAscent;
        drawText(scoreText, TEAM_SCORE_X, scoreY, layout.scoreSize, "#fff", "center", 700, true);

        if (team.penalty > 0) {
            const penaltyTop = scoreInkTop + scoreInkHeight + PENALTY_GAP;
            drawRoundedRect(RIGHT_BOX_X - 250, penaltyTop, 500, PENALTY_HEIGHT, 12, "#fff");
            drawText(`Penalty: -${team.penalty}`, RIGHT_BOX_X, penaltyTop + PENALTY_HEIGHT / 2 + 2, 70, ACCENT_COLOR, "center", 600);
        }

        const rowsTop = bandTop + (bandHeight - rowGroupHeight) / 2;
        for (let j = 0; j < playersPerTeam; j++) {
            drawRowBox(rowsTop + j * ROW_SPACING);
        }
        team.players.forEach((player, j) => {
            const rowY = rowsTop + j * ROW_SPACING + ROW_HEIGHT / 2;
            drawText(`${positionOf(player.score)}`, POSITION_X, rowY, 75, "#fff");
            setFont(100, 700);
            drawText(truncate(player.name, PLAYER_MAX_WIDTH), PLAYER_NAME_X, rowY, 100, team.color, "left");
            drawText(`${player.score}`, PLAYER_SCORE_X, rowY, 100, team.color, "right", 600);
        });
    });

    if (teams.length === 2) {
        drawRoundedRect(2596, bandHeight - 85, 353, 171, 16, "#fff");
        drawText(`±${Math.abs(teams[0].total - teams[1].total)}`, RIGHT_BOX_X, bandHeight + 2, 100, ACCENT_COLOR);
    }

    if (testMatchInput.checked) {
        // Sit on a band boundary so it never covers a team's emblem or name
        const boundaryY = Math.floor(teams.length / 2) * bandHeight;
        drawRoundedRect(210, boundaryY - 65, 500, 125, 15, "#fff");
        drawText("Test Match", 460, boundaryY - 3, 75, ACCENT_COLOR, "center", 600);
    }
}

function saveState() {
    const state = {
        teamCount,
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
    if (LAYOUTS[state.teamCount]) teamCount = state.teamCount;
    testMatchInput.checked = !!state.testMatch;
    state.teams.slice(0, MAX_TEAMS).forEach((team, i) => {
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
    hideScreenshotPreview();
    testMatchInput.checked = false;
    teamInputs.forEach((inputs, i) => {
        inputs.name.value = "";
        inputs.players.value = "";
        inputs.penalty.value = 0;
        inputs.color.setColor(DEFAULT_TEAMS[i].color);
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

function getTeamNames() {
    return readTeams().map(t => t.name);
}

function getFilename() {
    return `results_${getTeamNames().map(name => name.replaceAll(" ", "_")).join("_vs_")}.png`;
}

async function shareButtonPressed() {
    if (getIsPopupShowing()) return;
    await render();
    const blob = await canvasToBlob();
    const title = getTeamNames().join(" vs ");
    const message = `Check out the results for ${title}!`;

    if (isWindowsOrLinux() || !navigator.canShare) {
        const success = await copyImageToClipboard(blob);
        shareButton.innerText = success ? "Image copied to clipboard!" : "Failed to copy!";
        if (success) {
            showImagePreview(blob, blob.url, message);
        } else {
            setTimeout(() => { shareButton.innerHTML = getOriginalMessage(); }, 2000);
        }
    } else {
        await shareImage(`${title} Results`, message, blob, getFilename());
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
modeButtons.forEach(button => {
    button.addEventListener("click", () => setMode(Number(button.dataset.teams)));
});
importButton.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => importScreenshot(importInput.files[0]));
importModalClose.addEventListener("click", closeImportModal);
// Touch screens can't hover, so tapping toggles the larger size too
screenshotPreview.addEventListener("click", event => {
    if (event.target !== screenshotPreviewClose) screenshotPreview.classList.toggle("expanded");
});
screenshotPreviewClose.addEventListener("click", hideScreenshotPreview);
importModal.addEventListener("click", event => {
    if (event.target === importModal) closeImportModal();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeImportModal();
});
document.addEventListener("paste", event => {
    const file = [...event.clipboardData.files].find(f => f.type.startsWith("image/"));
    if (file) importScreenshot(file);
});
testMatchInput.addEventListener("change", queueRender);
shareButton.addEventListener("click", shareButtonPressed);
downloadButton.addEventListener("click", downloadButtonPressed);
clearButton.addEventListener("click", clearState);

document.addEventListener("DOMContentLoaded", async () => {
    try {
        backgroundImage = await loadImage(BACKGROUND_PATH);
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
