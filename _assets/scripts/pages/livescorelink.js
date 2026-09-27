/*
    Builds the livescore overlay link for a chosen team so it can be pasted
    into OBS as a Browser source.
*/

import { copyTextToClipboard } from '/_assets/scripts/utils/shareAPIhelper.js';
import { TEAM_TAGS } from '/_assets/scripts/utils/teamtags.js';
import { icon } from '/_assets/scripts/utils/icons.js';

const STORAGE_KEY = 'livescoreTeam';

const teamSelect = document.getElementById("team-select");
const livescoreLink = document.getElementById("livescore-link");
const copyButton = document.getElementById("copyButton");
const previewButton = document.getElementById("previewButton");
const copyButtonLabel = `${icon('copy')} Copy link`;

let copyResetTimer = null;

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

function buildLink(team) {
    return `https://umkl.co.uk/livescore/?team=${encodeURIComponent(team)}`;
}

function updateLink() {
    const team = teamSelect.value;
    if (!team) return;

    const link = buildLink(team);
    livescoreLink.innerText = link;
    previewButton.href = link;
    previewButton.hidden = false;
    copyButton.disabled = false;
    copyButton.innerHTML = copyButtonLabel;
    try { localStorage.setItem(STORAGE_KEY, team); } catch { }
}

async function copyButtonPressed() {
    const success = await copyTextToClipboard(livescoreLink.innerText);
    copyButton.innerText = success ? "Copied to clipboard!" : "Failed to copy!";
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => { copyButton.innerHTML = copyButtonLabel; }, 1200);
}

teamSelect.addEventListener("change", updateLink);
copyButton.addEventListener("click", copyButtonPressed);

document.addEventListener("DOMContentLoaded", async () => {
    let teams;
    try {
        teams = (await getTeamcolors()).map(t => t.team_name);
    } catch (error) {
        console.error("Failed to fetch teams:", error);
        teams = Object.values(TEAM_TAGS);
    }
    teams = [...new Set(teams)].sort((a, b) => a.localeCompare(b));

    teamSelect.innerHTML = `<option value="" disabled selected>Select your team</option>` +
        teams.map(team => `<option value="${team}">${team}</option>`).join("");

    let savedTeam = null;
    try { savedTeam = localStorage.getItem(STORAGE_KEY); } catch { }
    if (savedTeam && teams.includes(savedTeam)) {
        teamSelect.value = savedTeam;
        updateLink();
    }
});
