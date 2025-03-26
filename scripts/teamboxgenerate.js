import { setupDB, isDBLoaded, runSQL } from './database.js';

const teamBoxFormatHTML = `
    <button href="#" class="{{className}} teamBox">
        <div class="positionBox">
            <div class="team-position">{{position}}</div>
            <div class="team-points">{{points}} PTS</div>
        </div>
        <hr>
        <div class="{{className}} team">
            <span>{{teamName}}</span>
            <img src="{{logoSrc}}" alt="{{teamName}} team logo" class="team-logo">
        </div>
        <hr>
        <div class="Institution">{{institution}}</div>
    </button>
`;

const JSTeamBox = document.getElementById("JSTeamBox")

function generateTeamBox(team) {
    team.logo_src = `assets/team_emblems/${team.team_name.toUpperCase()}.png`
    team.class_name = team.team_name.replace(/\s+/g, '')

    console.log(team.team_color)

    let teamBoxStyle="button.teamBox.{{className}}:hover,button.teamBox.{{className}}:focus{border: 0px solid {{teamColor}};outline: 4px solid {{teamColor}};}.team.{{className}}{border-left: 8px solid {{teamColor}};}"
    .replaceAll("{{className}}", team.class_name)
    .replaceAll("{{teamColor}}", team.team_color)

    const styleSheet = document.createElement("style");
    styleSheet.innerText = teamBoxStyle;
    document.head.appendChild(styleSheet);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{position}}", team.team_id) // TODO: placeholder
        .replace("{{points}}", team.team_id) // TODO: placeholder
        .replaceAll("{{teamName}}", team.team_name)
        .replace("{{institution}}", team.team_full_name)
        .replaceAll("{{className}}", team.class_name)
        .replace("{{logoSrc}}", team.logo_src);

    JSTeamBox.innerHTML += tempTeamBox;
}

function generateTeamBoxes(teamData) {
    JSTeamBox.innerHTML = ""
    console.info("Generating teamdata boxes")
    teamData.forEach(team => {
        generateTeamBox(team)
    });
    console.info("Done teamdata boxes")
}

// generateTeamBox({
//     teamName: "York",
//     institution: "University of York",
//     teamColor: "#1BAA8B",
//     position: "1",
//     points: "500",
// })

// generateTeamBox({
//     teamName: "Staffs",
//     institution: "University of Staffordshire",
//     teamColor: "#A11212",
//     position: "2",
//     points: "200",
// })

// generateTeamBox({
//     teamName: "Staffs",
//     institution: "University of Staffordshire",
//     teamColor: "#A11212",
//     position: "2",
//     points: "200",
// })

// generateTeamBox({
//     teamName: "Staffs",
//     institution: "University of Staffordshire",
//     teamColor: "#A11212",
//     position: "2",
//     points: "200",
// })

// setupDB()
document.addEventListener("DOMContentLoaded", () => {
    waitForDBToInit()
});

async function waitForDBToInit() {
    let dbLoaded = await isDBLoaded();
    console.log(dbLoaded ? "Database loaded" : "Database is loading...");
    if (!dbLoaded) {
        setTimeout(waitForDBToInit, 100); // Check again after 1 second
    } else {
        let data = await runSQL("SELECT * FROM TEAM")
        generateTeamBoxes(data)
    }
}