/*
    A script that gets the team colors from the database and displays them on the page,
    this is used on the team creation guidelines page to show the current team colors.
*/

const currentTeamColors = document.getElementById("currentTeamColors");
let teamColors = [];
let startTime;

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

function createColorBox(name, color) {
    const colorDiv = document.createElement("div");
    colorDiv.className = "color-box";
    colorDiv.style.backgroundColor = color;
    colorDiv.title = name;
    colorDiv.style.cursor = "pointer";
    colorDiv.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent('changeDiscordRoleColor', { detail: { tecoloramColor } }));
    });
    currentTeamColors.appendChild(colorDiv);
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cgetteamcolors.js %c> %cGetting team colors...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
    
    try {
        teamColors = await getTeamcolors();

        teamColors[0].forEach(({ team_name: name, team_color: color }) => {
            createColorBox(name, color);
        });
    } catch (error) {
        console.debug(`%cgetteamcolors.js %c> %cAPI failed - using fallback information...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
        await getTeamcolorsFallback();

        Object.entries(teamColors).forEach(([name, color]) => {
            createColorBox(name, color);
        });
    }

    console.debug(`%cgetteamcolors.js %c> %cGenerated team colors in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
});