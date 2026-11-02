/*
    A script that gets the team colors from the API and displays them on the page,
    this is used on the team creation guidelines page to show the current team colors.
*/

import { createDebugLogger } from '/_assets/scripts/utils/debuglogger.js';
import { getTeamColors } from '/_assets/scripts/utils/teamcolors.js';

const debugLog = createDebugLogger('getteamcolors.js', '#fc52ff', '#fda6ff');
const currentTeamColors = document.getElementById("currentTeamColors");
let teamColors = [];
let startTime;

function createColorBox(name, color) {
    const colorDiv = document.createElement("div");
    colorDiv.className = "color-box";
    colorDiv.style.backgroundColor = color;
    colorDiv.title = name;
    colorDiv.style.cursor = "pointer";
    colorDiv.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent('changeDiscordRoleColor', { detail: { color } }));
    });
    currentTeamColors.appendChild(colorDiv);
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    debugLog(`Getting team colors...`);
    
    teamColors = await getTeamColors();

    teamColors.forEach(({ team_name: name, team_color: color }) => {
        createColorBox(name, color);
    });

    debugLog(`Generated team colors in ${(performance.now() - startTime).toFixed(2)}ms`);
});