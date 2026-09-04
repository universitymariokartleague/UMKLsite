/*
    A script that fetches from live match data from api.umkl.co.uk/live.
*/

import { getMatchData } from '/assets/scripts/utils/matchdata.js';
import { createDebugLogger } from '/assets/scripts/utils/debuglogger.js';

const debugLog = createDebugLogger('liveresultsdisplay.js', '#fc52ff', '#fda6ff');
let matchData = [];
let raceresults = [];
const firstTeamScore = document.getElementById("firstteamscore");
const secondTeamScore = document.getElementById("secondteamscore");
const firstTeamLogo = document.getElementById("firstteamlogo");
const secondTeamLogo = document.getElementById("secondteamlogo");
const errorMessage = document.getElementById("errormessage");

const urlParams = new URLSearchParams(window.location.search);

let swapped;

const team_name = urlParams.get('team');

const MATCH_LENGTH_MINS = 90;

const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const maxPos = scoreMap.length;

let receivedValidLogos = false;

let refreshTimer = null;

let startTime;

async function getLiveResults(match_id) {
    console.log(match_id)
    return fetch(`https://api.umkl.co.uk/live/${match_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
            localStorage.setItem("apiReqsSent", apiReqsSent + 1)
            return response.json();
        });
}

function getCurrentMatch(team_name) {
        return fetch(`https://api.umkl.co.uk/match/current/${team_name}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
            localStorage.setItem("apiReqsSent", apiReqsSent + 1)
            return response.json();
        });
}

function getLiveMatchTeams(team_names) {
    if (receivedValidLogos) return;

    receivedValidLogos = Boolean(team_names && team_names[0] && team_names[1]);

    swapped = team_names[1] == team_name

    console.log(team_names)

    if (team_names) {
        const [logoA, logoB] = swapped
            ? [team_names[1], team_names[0]]
            : [team_names[0], team_names[1]];
        firstTeamLogo.src = `https://api.umkl.co.uk/teamemblems/${logoA.toUpperCase()}`
        secondTeamLogo.src = `https://api.umkl.co.uk/teamemblems/${logoB.toUpperCase()}`
    }
}

function animateNumberChange(element, oldValue, newValue, duration = 500, grow = false) {
    const startTime = performance.now();
    const difference = newValue - oldValue;

    if (grow) {
        element.classList.remove("grow");
        void element.offsetWidth;
        element.classList.add("grow");
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.round(oldValue + difference * progress);
        element.innerText = currentValue;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function setScores(team_ids) {
    window.retryCount = 0;

    function calculatePoints(positions) {
        return positions.reduce((sum, pos) => {
            if (pos >= 1 && pos <= maxPos) {
                return sum + scoreMap[pos - 1];
            }
            return sum;
        }, 0);
    }

    let teamAPoints = raceresults.reduce((total, race) => {
        return total + calculatePoints(race[`${team_ids[0]}`] || []);
    }, 0);

    let teamBPoints = raceresults.reduce((total, race) => {
        return total + calculatePoints(race[`${team_ids[1]}`] || []);
    }, 0);

    let scores = [teamAPoints, teamBPoints]

    const [newFirst, newSecond] = swapped ? [scores[1], scores[0]] : [scores[0], scores[1]];

    const currentFirst = parseInt(firstTeamScore.innerText) || 0;
    const currentSecond = parseInt(secondTeamScore.innerText) || 0;

    const deltaFirst = Math.abs(newFirst - currentFirst);
    const deltaSecond = Math.abs(newSecond - currentSecond);

    const minDuration = 200;
    const maxDuration = 1000;

    let durationFirst = minDuration;
    let durationSecond = minDuration;

    if (deltaFirst !== 0 || deltaSecond !== 0) {
        const totalDelta = deltaFirst + deltaSecond;

        durationFirst = deltaFirst === 0 ? minDuration : minDuration + ((deltaFirst / totalDelta) * (maxDuration - minDuration));
        durationSecond = deltaSecond === 0 ? minDuration : minDuration + ((deltaSecond / totalDelta) * (maxDuration - minDuration));
    }

    if (deltaFirst > 0) {
        animateNumberChange(firstTeamScore, currentFirst, newFirst, durationFirst, newFirst > newSecond);
    }

    if (deltaSecond > 0) {
        animateNumberChange(secondTeamScore, currentSecond, newSecond, durationSecond, newSecond > newFirst);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    debugLog(`Getting live match data...`);

    try {
        const currentMatch = await getCurrentMatch(team_name)


        const match_id = Number(currentMatch['match_id'])
        const team_info = currentMatch['teamsinvolved']

        const team_ids = team_info.map(team => Object.keys(team)[0]);
        const team_names = team_info.map(team => Object.values(team)[0]);

        swapped = team_names[1] == team_name

        matchData = await getMatchData();
        raceresults = await getLiveResults(Number(match_id));

        setScores(team_ids);
        getLiveMatchTeams(team_names)
        errorMessage.innerHTML = "";
        window.lastMatchUpdate = Date.now();
    } catch (error) {
        console.error(error);
        errorMessage.innerHTML = `Connection lost...`;
        debugLog(`API failed...`);
        if (error && error.message && error.message.includes('429')) {
            errorMessage.innerHTML = `Rate limited...`;
        }
    }

    debugLog(`Fetched live data in ${(performance.now() - startTime).toFixed(2)}ms`);

    if (refreshTimer) clearTimeout(refreshTimer);

    const updateFetch = async () => {
        try {
            if (typeof retryCount === "undefined") {
                window.retryCount = 1;
            } else {
                window.retryCount++;
            }
            debugLog(`Refreshing live data...`);
            
                const currentMatch = await getCurrentMatch(team_name)

                const match_id = Number(currentMatch['match_id'])
                const team_info = currentMatch['teamsinvolved']

                const team_ids = team_info.map(team => Object.keys(team)[0]);
                const team_names = team_info.map(team => Object.values(team)[0]);


            if (!window.lastMatchUpdate || Date.now() - window.lastMatchUpdate >= 60000) {

                matchData = await getMatchData();
                getLiveMatchTeams(team_names);
                window.lastMatchUpdate = Date.now();
            }

            raceresults = await getLiveResults(Number(match_id));
            setScores(team_ids);
            errorMessage.innerHTML = "";
        } catch (error) {
            errorMessage.innerHTML = `Retrying: attempt ${window.retryCount}`;
        } finally {
            refreshTimer = setTimeout(updateFetch, 2000);
        }
    };

    refreshTimer = setTimeout(updateFetch, 2000);
});
