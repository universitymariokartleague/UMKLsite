/*
    This script generates all the UMKL videos on the
    videos page
*/

import { generate6v6ScoreCalculatorLink } from './matchhelper.js';

const currentYear = new Date().getFullYear();
const startYear = 2023; // currentYear of season = startYear + season (eg: season 1 - 2023 + 1 = 2024)
const minYear = startYear + 1; // Minimum year for the calendar, prevents going back to 2023
const maxYear = currentYear + 1; // Maximum year for the calendar, allows going up to 2 years in the future

const videosGenerate = document.getElementById("videosGenerate")
const liveVideosGenerate = document.getElementById("liveVideosGenerate")
const videosError = document.getElementById("videosError")

const YTTHUMBLINK = "https://img.youtube.com/vi/{{YOUTUBE_ID}}/maxresdefault.jpg"

const CUTDESCRIPTION = "This match serves to test the Cheep Cheep application and live streaming. Members of the relevant teams can sign up to compete in this match using the button in the team's announcement channel.";

let matchData = [];
let teamColors = [];
let extraVideoIDs = [];

let cached = false;
let refreshTimer = null;
let startTime;

const makePossessive = name =>
    !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

function autoLink(text) {
    text = text.replaceAll("\n", "<br>")
    const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
    return text.replace(urlRegex, function (url) {
        let href = url;
        let displayUrl = url;
        let trailingDot = '';
        if (displayUrl.endsWith('.')) {
            displayUrl = displayUrl.slice(0, -1);
            href = href.slice(0, -1);
            trailingDot = '.';
        }
        if (!href.match(/^https?:\/\//)) {
            href = 'http://' + href;
        }
        return `<a translate="no" href="${href}" target="_blank">${displayUrl}</a>${trailingDot}`;
    })
}

async function getMatchData() {
    return fetch('https://api.umkl.co.uk/matchdata', {
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
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

async function getMatchDataFallback() {
    const response = await fetch(`database/matchdatafallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    matchData = await response.json();
}

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
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
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

async function getVideoIDs() {
    const response = await fetch(`pages/videos/videoids.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    extraVideoIDs = await response.json();
}

function displayVideos() {
    videosGenerate.innerHTML = `<h2>Videos</h2>`
    videosGenerate.innerHTML += `<div class="videos-wrapper">${extraVideoIDs.map(video => `
        <div class="video-card" onclick="window.open('https://www.youtube.com/watch?v=${video.id}', '_blank')">
            <img class="video-thumbnail" loading="lazy" width="184px" style="aspect-ratio:16/9" ${cached ? `` : 'onload="this.style.opacity=1"'} src="${YTTHUMBLINK.replace("{{YOUTUBE_ID}}", video.id)}" alt="Video thumbnail for ${video.title}"/>
            <div class="video-info">${video.title}</div>
        </div>
    `).join('')}</div>`;
}

function displayLiveVideos() {
    liveVideosGenerate.innerHTML = `<h2>Livestreams</h2>`
    liveVideosGenerate.innerHTML += Object.keys(matchData).reverse().map(dateKey => {
        return matchData[dateKey].map(entry => {
            let teamVideosHTML = '';

            if (entry.ytLinks) {
                const youtubeIdRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                const team1ID = entry.ytLinks[0]?.match(youtubeIdRegex)?.[1];
                const team2ID = entry.ytLinks[1]?.match(youtubeIdRegex)?.[1];

                if (team1ID) {
                    teamVideosHTML += `
                        <div class="video-card" onclick="window.open('https://www.youtube.com/watch?v=${team1ID}', '_blank')">
                            <img class="video-thumbnail" loading="lazy" width="184px" style="aspect-ratio:16/9" ${cached ? `` : 'onload="this.style.opacity=1"'} src="${YTTHUMBLINK.replace("{{YOUTUBE_ID}}", team1ID)}" alt="Video thumbnail for ${entry.title}"/>
                            <div class="video-info">${makePossessive(entry.teamsInvolved[0])} perspective</div>
                        </div>
                    `;
                }
                if (team2ID) {
                    teamVideosHTML += `
                        <div class="video-card" onclick="window.open('https://www.youtube.com/watch?v=${team2ID}', '_blank')">
                            <img class="video-thumbnail" loading="lazy" width="184px" style="aspect-ratio:16/9" ${cached ? `` : 'onload="this.style.opacity=1"'} src="${YTTHUMBLINK.replace("{{YOUTUBE_ID}}", team2ID)}" alt="Video thumbnail for ${entry.title}"/>
                            <div class="video-info">${makePossessive(entry.teamsInvolved[1])} perspective</div>
                        </div>
                    `;
                }

                return (team1ID || team2ID) ? `
                    <div class="live-video-container ${entry.testMatch ? "test-match-container" : ''}">
                        <div class="video-section-info">
                            <h2>
                                <a href="pages/teams/details/?team=${entry.teamsInvolved[0]}">${entry.teamsInvolved[0]}</a> 
                                VS 
                                <a href="pages/teams/details/?team=${entry.teamsInvolved[1]}">${entry.teamsInvolved[1]}</a>
                            </h2>
                            <a href="${generate6v6ScoreCalculatorLink(entry)}">${entry.testMatch ? "<b>Test match</b>" : `Season ${entry.season}`}</a>
                            | <a href="pages/matches/?date=${dateKey}">${dateKey}</a>
                            <p>
                                ${autoLink(entry.description.split("\n")[0].replace(CUTDESCRIPTION, ""))}
                            </p>
                        </div>
                        <div class="team-videos-container">${teamVideosHTML}</div>
                    </div>
                ` : '';
            }
        }).join('');
    }).join('');
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cvideosgenerate.js %c> %cFetching videos...`, "color:#ff6687", "color:#fff", "color:#ffb3c3");

    await getVideoIDs();

    if (localStorage.matchDataCache && localStorage.teamColorsCache) {
        cached = true;
        console.debug(`%cvideosgenerate.js %c> %cRendering videos (cache)...`, "color:#ff6687", "color:#fff", "color:#ffb3c3");
        matchData = JSON.parse(localStorage.matchDataCache)
        teamColors = JSON.parse(localStorage.teamColorsCache)
        displayVideos();
        displayLiveVideos();
    }

    try {
        matchData = await getMatchData();
        teamColors = await getTeamcolors();
    } catch (error) {
        console.debug(`%cvideosgenerate.js %c> %cAPI failed - using fallback information...`, "color:#ff6687", "color:#fff", "color:#ffb3c3");
        await getMatchDataFallback();
        await getTeamcolorsFallback();

        if (error && error.message && error.message.includes('429')) {
            videosError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.</blockquote>`;
        } else {
            videosError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;

            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    if (typeof retryCount === 'undefined') {
                        window.retryCount = 1;
                    } else {
                        window.retryCount++;
                    }
                    matchData = await getMatchData();
                    teamColors = await getTeamcolors();
                    videosError.innerHTML = "";
                    displayVideos();
                    displayLiveVideos();
                } catch (err) {
                    videosError.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${window.retryCount}...</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }

    localStorage.setItem("matchDataCache", JSON.stringify(matchData));
    localStorage.setItem("teamColorsCache", JSON.stringify(teamColors));
    cached = false;
    displayVideos();
    displayLiveVideos();
    console.debug(`%cvideosgenerate.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#ff6687", "color:#fff", "color:#ffb3c3");
});