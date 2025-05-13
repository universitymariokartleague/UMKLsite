/*
    A script that gets the team colors from the database and displays them on the page,
    this is used on the team creation guidelines page to show the current team colors.
*/

import { isDBLoaded, runSQL } from './database.js';

const currentTeamColors = document.getElementById("currentTeamColors");

document.addEventListener("DOMContentLoaded", async () => {
    await waitForDBToInit();
    await loadTeamColors();
});

async function waitForDBToInit() {
    while (!(await isDBLoaded())) {
        console.debug(`%cgetteamcolors.js %c> %cDatabase is loading...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    console.debug(`%cgetteamcolors.js %c> %cDatabase loaded`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
}

async function loadTeamColors() {
    console.debug(`%cgetteamcolors.js %c> %cGetting team colors...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
    const teamColors = await runSQL("SELECT team_name, team_color FROM team");

    teamColors.forEach(({ team_name: name, team_color: color }) => {
        const colorDiv = document.createElement("div");
        colorDiv.className = "color-box";
        colorDiv.style.backgroundColor = color;
        colorDiv.title = name;
        currentTeamColors.appendChild(colorDiv);
    });

    console.debug(`%cgetteamcolors.js %c> %cGenerated team colors div`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
}
