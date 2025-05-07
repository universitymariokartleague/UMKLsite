/* 
    This script calculates the points difference in 6v6. It dynamically updates
    the results for both teams and the points difference as the user inputs data. 
*/

const positionsInput = document.getElementById("positions-input");
const teamResult = document.getElementById("team-result");
const opponentResult = document.getElementById("opponent-result");
const pointsDifference = document.getElementById("points-diff");

const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function calculateScore(position) {
    return scoreMap[position - 1] || 1; // Default to 1 if position is out of range
}

function renderResults() {
    if (!positionsInput.value.trim()) {
        teamResult.innerHTML = "<h3>Your Team</h3>";
        opponentResult.innerHTML = "<h3>Opponent Team</h3>";
        return;
    }

    const positions = positionsInput.value
        .trim()
        .split("\n")
        .map(line => line.split(",").map(Number).filter(Boolean));

    let yourTeamTotal = 0;
    let opponentTeamTotal = 0;

    const teamRaceResults = positions.map((yourTeamPositions, index) => {
        const allPositions = Array.from({ length: 12 }, (_, i) => i + 1);
        const opponentPositions = allPositions.filter(pos => !yourTeamPositions.includes(pos));

        const yourTeamScore = yourTeamPositions.reduce((sum, pos) => sum + calculateScore(pos), 0);
        const opponentTeamScore = opponentPositions.reduce((sum, pos) => sum + calculateScore(pos), 0);

        yourTeamTotal += yourTeamScore;
        opponentTeamTotal += opponentTeamScore;

        return `<b>Race ${index + 1}</b>:
        ${yourTeamScore}<br/>`;
    });

    const opponentRaceResults = positions.map((yourTeamPositions, index) => {
        const allPositions = Array.from({ length: 12 }, (_, i) => i + 1);
        const opponentPositions = allPositions.filter(pos => !yourTeamPositions.includes(pos));

        const opponentTeamScore = opponentPositions.reduce((sum, pos) => sum + calculateScore(pos), 0);
        return `<b>Race ${index + 1}</b>:
        ${opponentTeamScore}<br/>`;
    });

    teamResult.innerHTML = `<h3>Your Team</h3><br/>${teamRaceResults.join("")}
        <br><b>Total</b><br/>
        ${yourTeamTotal}<br/>`;

    opponentResult.innerHTML = `<h3>Opponent Team</h3><br/>${opponentRaceResults.join("")}
        <br><b>Total: </b><br/>
        ${opponentTeamTotal}<br/>`;

    const diff = yourTeamTotal - opponentTeamTotal;
    const color = diff > 0 ? "green" : diff < 0 ? "red" : "black";
    const sign = diff > 0 ? "+" : "";
    
    pointsDifference.innerHTML = `<h2 style="color: ${color};">${sign}${diff}</h2>`;
}

positionsInput.addEventListener("input", renderResults);