/* 
    This script calculates the points difference in 6v6. It dynamically updates
    the results for both teams and the points difference as the user inputs data. 
*/
import { isWindowsOrLinux, copyTextToClipboard, getIsPopupShowing, shareImage, showImagePreview, setOriginalMessage } from './shareAPIhelper.js';

const inputArea = document.getElementById("inputArea");
const positionsInput = document.getElementById("positions-input");
const teamResult = document.getElementById("team-result");
const opponentResult = document.getElementById("opponent-result");
const pointsDifference = document.getElementById("points-diff");
const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

let chart;
let defaultTeamColors = ["#1baa8b", "#a11212"];
const trackNamesInput = document.getElementById("track-names-input");
const teamNamesInput = document.getElementById("team-names-input");

const canvas = document.getElementById("scoreChart");

let teamColors = [];
let matchName = "";

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

function calculateScore(position) {
    return scoreMap[position - 1] || 1; // Default to 1 if position is out of range
}

const getTeamColor = (name) => {
    if (!name) {
        return false
    }
    const match = teamColors.find(team => team.team_name.toLowerCase() === name.toLowerCase());
    return match ? match.team_color : null;
};

function renderResults(width) {
    if (!positionsInput.value.trim()) {
        teamResult.innerHTML = "<h3>Your Team</h3>";
        opponentResult.innerHTML = "<h3>Opponent Team</h3>";
        pointsDifference.innerHTML = `<h2>±0</h2>`;
        if (chart) chart.destroy();

        const url = new URL(window.location);
        url.search = "";
        window.history.replaceState({}, document.title, url.toString());

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

    const teamNames = teamNamesInput.value
        .trim()
        .split("\n")
        .map(name => name.trim())
        .filter(name => name);

    teamResult.innerHTML = `<h3>${teamNames[0] || 'Your Team'}</h3><br/>${teamRaceResults.join("")}
        <br><b>Total:</b><br/>
        ${yourTeamTotal}<br/>`;

    opponentResult.innerHTML = `<h3>${teamNames[1] || 'Opponent Team'}</h3><br/>${opponentRaceResults.join("")}
        <br><b>Total:</b><br/>
        ${opponentTeamTotal}<br/>`;

    const diff = yourTeamTotal - opponentTeamTotal;
    const color = diff > 0 ? "green" : diff < 0 ? "red" : "black";
    const sign = diff > 0 ? "+" : "";
    
    pointsDifference.innerHTML = `<h2 style="color: ${color};">${sign}${diff}</h2>`;

    // graph
    const trackNames = trackNamesInput.value
        .trim()
        .split("\n")
        .map(name => name.trim())
        .filter(name => name);

    const raceLabels = ["", ...(
        trackNames.length === positions.length
            ? trackNames
            : positions.map((_, index) => `Race ${index + 1}`)
    )];

    let yourTeamScoresCumulative = [0];
    let opponentScoresCumulative = [0];
    let yourRunningTotal = 0;
    let opponentRunningTotal = 0;

    positions.forEach((yourTeamPositions) => {
        const allPositions = Array.from({ length: 12 }, (_, i) => i + 1);
        const opponentPositions = allPositions.filter(pos => !yourTeamPositions.includes(pos));

        const yourScore = yourTeamPositions.reduce((sum, pos) => sum + calculateScore(pos), 0);
        const opponentScore = opponentPositions.reduce((sum, pos) => sum + calculateScore(pos), 0);

        yourRunningTotal += yourScore;
        opponentRunningTotal += opponentScore;

        yourTeamScoresCumulative.push(yourRunningTotal);
        opponentScoresCumulative.push(opponentRunningTotal);
    });

    const chartData = {
        labels: raceLabels,
        datasets: [
            {
                label: teamNames[0] || 'Your Team',
                data: yourTeamScoresCumulative,
                backgroundColor: getTeamColor(teamNames[0]) || defaultTeamColors[0],
                borderColor: getTeamColor(teamNames[0]) || defaultTeamColors[0],
                fill: false,
                tension: 0.1
            },
            {
                label: teamNames[1] || 'Opponent Team',
                data: opponentScoresCumulative,
                backgroundColor: getTeamColor(teamNames[1]) || defaultTeamColors[1],
                borderColor: getTeamColor(teamNames[1]) || defaultTeamColors[1],
                fill: false,
                tension: 0.1
            }
        ]
    };

    const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');

    let chartBackgroundPlugin = null;
    if (width) {
        chartBackgroundPlugin = {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = textColor == "#fff" ? "#111111" : "#FFFFFF";
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        };
    }

    const chartConfig = {
        type: 'line',
        data: chartData,
        options: {
            responsive: !width,
            animation: false,
            maintainAspectRatio: false,
            plugins: {
                    tooltip: {
                    bodyFont: {
                        family: 'Montserrat',
                    },
                    titleFont: {
                        family: 'Montserrat',
                    },
                    footerFont: {
                        family: 'Montserrat',
                    },
                },
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Montserrat'
                        },
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: teamNames[0] && teamNames[1] ? `${teamNames[0]} VS ${teamNames[1]}` : 'Team Scores',
                    font: {
                        family: 'Montserrat',
                        size: 16
                    },
                    color: textColor
                },
                datalabels: {
                    display: true,
                    font: {
                        family: 'Montserrat',
                        size: 10
                    },
                    color: textColor,
                    align: (context) => {
                        const index = context.dataIndex;
                        const datasetIndex = context.datasetIndex;
                        const datasets = context.chart.data.datasets;

                        const teamAScore = datasets[0].data[index];
                        const teamBScore = datasets[1].data[index];

                        if (teamAScore === teamBScore) return 'top';
                        return (datasetIndex === 0 && teamAScore > teamBScore) ||
                            (datasetIndex === 1 && teamBScore > teamAScore)
                            ? 'top'
                            : 'bottom';
                    },
                    anchor: (context) => {
                        const index = context.dataIndex;
                        const datasetIndex = context.datasetIndex;
                        const datasets = context.chart.data.datasets;

                        const teamAScore = datasets[0].data[index];
                        const teamBScore = datasets[1].data[index];

                        if (teamAScore === teamBScore) return 'center';
                        return (datasetIndex === 0 && teamAScore > teamBScore) ||
                            (datasetIndex === 1 && teamBScore > teamAScore)
                            ? 'end'
                            : 'start';
                    },
                    offset: 2,
                    formatter: (value) => value
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            family: 'Montserrat'
                        },
                        color: textColor
                    },
                    grid: {
                        color: '#cccccc30'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Montserrat'
                        },
                        color: textColor
                    },
                    grid: {
                        color: (context) => {
                            return context.tick.value % 100 === 0
                            ? '#cccccc80'
                            : '#cccccc30';
                        }
                    }
                }
            },
            layout: {
                padding: {
                    right: 15,
                    left: 15,
                    top: 5,
                    bottom: 5
                }
            }
        },
        plugins: chartBackgroundPlugin ? [ChartDataLabels, chartBackgroundPlugin] : [ChartDataLabels]
    };

    if (chart) chart.destroy();
    const ctx = canvas.getContext('2d');

    if (width) {
        const aspectRatio = 2;
        canvas.width = width;
        canvas.height = Math.round(width / aspectRatio);
    }

    chart = new Chart(ctx, chartConfig);

    addToURLParam(positions, trackNames, teamNames);
}

function addToURLParam(positions, trackNames, teamNames) {
    const url = new URL(window.location.href);

    const positionsString = positions.map(race => race.join(',')).join('\n');
    const tracksString = trackNames.join('\n');
    const teamsString = teamNames.join('\n');

    const compressedPositions = LZString.compressToEncodedURIComponent(positionsString);
    const compressedTracks = LZString.compressToEncodedURIComponent(tracksString);
    const compressedTeams = LZString.compressToEncodedURIComponent(teamsString);

    url.searchParams.set('p', compressedPositions);
    url.searchParams.set('t', compressedTracks);
    url.searchParams.set('n', compressedTeams);

    window.history.replaceState(null, '', url.toString());
}

function loadFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);

    const positionsCompressed = urlParams.get('p');
    const tracksCompressed = urlParams.get('t');
    const teamsCompressed = urlParams.get('n');
    const matchNameCompressed = urlParams.get('m');

    if (positionsCompressed) {
        const positionsRaw = LZString.decompressFromEncodedURIComponent(positionsCompressed);
        const positions = positionsRaw.trim().split('\n').map(line => line.split(',').map(Number));
        positionsInput.value = positions.map(r => r.join(',')).join('\n');
    }

    if (tracksCompressed) {
        const tracks = LZString.decompressFromEncodedURIComponent(tracksCompressed);
        trackNamesInput.value = tracks;
    }

    if (teamsCompressed) {
        const teams = LZString.decompressFromEncodedURIComponent(teamsCompressed);
        teamNamesInput.value = teams;
    }

    if (matchNameCompressed) {
        matchName = LZString.decompressFromEncodedURIComponent(matchNameCompressed);
    }
}

document.addEventListener('themeChange', () => {
    renderResults();
});

document.addEventListener("DOMContentLoaded", async () => {
    teamColors = await getTeamcolors();
    loadFromURLParams();
    renderResults();
    if (matchName) {
        inputArea.style.display = "unset";
        inputArea.innerHTML = `<h2>${matchName}</h2><button id="shareButton"><span class="fa-solid fa-share"></span> Share Results Graph</button>`;
        const shareButton = document.getElementById("shareButton");

        setOriginalMessage(shareButton.innerHTML);

        shareButton.addEventListener("click", async () => {
            function canvasToBlob(canvas, type = "image/png", quality) {
                return new Promise(resolve => {
                    canvas.toBlob(blob => resolve(blob), type, quality);
                });
            }

            if (getIsPopupShowing()) return;
            const useClipboard = isWindowsOrLinux() || !navigator.canShare;

            renderResults(800);
            const blob = await canvasToBlob(canvas);
            renderResults();

            const message = `Check out the results for ${matchName}!`

            if (useClipboard) {
                const success = await copyTextToClipboard(message);
                shareButton.innerText = success ? "Copied to clipboard!" : "Failed to copy!";
                showImagePreview(blob, blob.url, message)
            } else {
                await shareImage(
                    `${matchName} Results`,
                    message,
                    blob,
                    `6v6_results_${matchName.replaceAll(" ", "_")}.png`
                )
            }
        });
    }
    inputArea.classList.remove("hidden");

    positionsInput.addEventListener("input", renderResults);
    trackNamesInput.addEventListener("input", renderResults);
    teamNamesInput.addEventListener("input", renderResults);
});