const positionsInput = document.getElementById("positions-input");
const result = document.getElementById("result");

const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function calculateScore(position) {
    return scoreMap[position - 1] || 1; // Default to 1 if position is out of range
}

function renderResults() {
    if (!positionsInput.value.trim()) {
        result.innerHTML = "Result: No data";
        return;
    }

    const positions = positionsInput.value
        .trim()
        .split("\n")
        .map(line => line.split(",").map(Number).filter(Boolean));


    const raceScores = positions.map(racePositions =>
        racePositions.reduce((total, position) => total + calculateScore(position), 0)
    );

    const totalScore = raceScores.reduce((a, b) => a + b, 0);

    result.innerHTML = `Result:<br/>
    ${raceScores.map((score, index) => `Race ${index + 1}: ${score}`).join("<br>")}
    <br><b>Total Score: ${totalScore}</b>`;
}

positionsInput.addEventListener("input", renderResults);
