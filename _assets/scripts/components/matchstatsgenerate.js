/*
    This script generates stats about matches.
*/

import { getMatchData } from '/_assets/scripts/utils/matchdata.js';
import { createDebugLogger } from '/_assets/scripts/utils/debuglogger.js';
import { TRACKS, resolveTrackName } from '/_assets/scripts/utils/tracknames.js';

const debugLog = createDebugLogger('matchstatsgenerate.js', '#ff52dc', '#ffa3ed');

const escapeHTML = str => str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function highlightMatch(text, term) {
    const escaped = escapeHTML(text);
    if (!term) return escaped;
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}
const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        {{trackCounts}}
    </div>
`;

const JSTeamBox = document.getElementById("JSTeamBox")
const startYear = 2023;
const SKELETON_TRACK_COUNT = 10;

const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const maxPos = scoreMap.length

let matchData, teamColors;
const currentSeason = 2;
let fetchedCurrentSeason = currentSeason;

const UPDATEINVERVAL = 30000;
let refreshTimer = null;

let startTime;

const testMatchesCheckbox = document.getElementById("testMatches");
const trackSortWrapper = document.getElementById("track-sort");
const trackModal = document.getElementById("trackModal");
const trackModalClose = document.getElementById("trackModalClose");
const trackModalTitle = document.getElementById("trackModalTitle");
const trackModalIcon = document.getElementById("trackModalIcon");
const trackModalBody = document.getElementById("trackModalBody");
let currentTrackSort = "mostPlayed";
let previousTrackSort = null;
const teamFilterSelect = document.getElementById("team-filter");
const trackSearchInput = document.getElementById("track-search");
const trackSearchClear = document.getElementById("track-search-clear");
const trackNoResults = document.getElementById("track-no-results");
const unplayedTracksToggle = document.getElementById("unplayedTracks");

function renderStatsSkeleton() {
    const skeletonItem = `
        <div class="track-item" aria-hidden="true">
            <div class="track-icon skeleton" style="opacity:1;"></div>
            <div class="skeleton skeleton-line" style="width:85%; margin-top:8px;"></div>
            <div class="skeleton skeleton-line" style="width:50%; margin-top:6px;"></div>
        </div>
    `;
    JSTeamBox.innerHTML = `
        <div class="track-frequency">${skeletonItem.repeat(SKELETON_TRACK_COUNT)}</div>
    `;
}

const trackSorters = {
    mostPlayed: (a, b) => b[1].count - a[1].count,
    leastPlayed: (a, b) => a[1].count - b[1].count,
    alphabetical: (a, b) => a[0].localeCompare(b[0]),
};

let trackStatsByTrack = {};
let lastFocusedTrackItem = null;

function getTeamColor(team) {
    return (teamColors || []).find(t => t.team_name === team)?.team_color;
}

function getTrackIconUrl(track) {
    return `/_assets/media/courses/mk8dxicons/${track.replaceAll(' ', '_').replaceAll("'", '').toLowerCase()}.avif`;
}

function populateTeamFilter() {
    const teams = new Set();

    for (const matches of Object.values(matchData || {})) {
        for (const match of matches) {
            for (const team of match.teamsInvolved || []) {
                if (team) teams.add(team);
            }
        }
    }

    const options = [...teams].sort((a, b) => a.localeCompare(b))
        .map(team => `<option value="${team}">${team}</option>`).join("");

    teamFilterSelect.innerHTML = `<option value="">All teams</option>${options}`;

    applyTeamFromURL(teams);
}

function resolveTeamName(requested, teams) {
    if (!requested) return "";
    return [...teams].find(team => team.toLowerCase() === requested.toLowerCase()) || "";
}

function applyTeamFromURL(teams) {
    const requested = new URLSearchParams(window.location.search).get("team");
    teamFilterSelect.value = resolveTeamName(requested, teams);
}

function updateTeamParam() {
    const url = new URL(window.location);
    if (teamFilterSelect.value) {
        url.searchParams.set("team", teamFilterSelect.value);
    } else {
        url.searchParams.delete("team");
    }
    window.history.replaceState({}, "", url);
}

function getUnplayedTracks() {
    const playedTracks = new Set(Object.keys(trackStatsByTrack).map(track => track.toLowerCase()));
    const unplayedTracks = [];
    const unplayedTrackKeys = new Set();

    for (const entry of TRACKS.DX || []) {
        const names = typeof entry === "object" ? [entry.us, entry.pal].filter(Boolean) : [entry];
        for (const name of names) {
            const resolvedName = resolveTrackName(name);
            const key = name.toLowerCase();
            const resolvedKey = resolvedName.toLowerCase();

            const isPlayed = playedTracks.has(key) || playedTracks.has(resolvedKey);
            const alreadyListed = unplayedTrackKeys.has(key) || unplayedTrackKeys.has(resolvedKey);
            if (isPlayed || alreadyListed) continue;

            unplayedTrackKeys.add(key);
            unplayedTrackKeys.add(resolvedKey);
            unplayedTracks.push(resolvedName);
        }
    }

    return unplayedTracks.sort((a, b) => a.localeCompare(b));
}

function buildTrackItemHTML(track, stats) {
    const playedLabel = stats
        ? `Played ${stats.count} ${stats.count === 1 ? "time" : "times"}`
        : "Not played yet";

    return `
        <button type="button" class="track-item" data-track="${escapeHTML(track.toLowerCase())}">
            <img class="track-icon" onload="this.style.opacity=1" loading="lazy" src="${getTrackIconUrl(track)}" alt="">
            <span class="track-label">
                <b class="track-name">${escapeHTML(track)}</b><br>
                ${playedLabel}
            </span>
        </button>
    `;
}

function buildTrackCountDiv(data, matchesCounted, unplayedTracks, showUnplayed) {
    let entries;
    if (showUnplayed) {
        entries = unplayedTracks
            .map(track => [track, null])
            .sort((a, b) => a[0].localeCompare(b[0]));
    } else {
        entries = Object.entries(data).sort(trackSorters[currentTrackSort] || trackSorters.mostPlayed);
    }

    const resultString = entries
        .map(([track, stats]) => buildTrackItemHTML(track, stats))
        .join("");

    const length = entries.length;
    const selectedTeam = teamFilterSelect.value;

    const headerText = showUnplayed
        ? `<span>${length} ${length === 1 ? "track hasn't" : "tracks haven't"} been played yet across ${matchesCounted} ${matchesCounted === 1 ? "match" : "matches"}</span>`
        : `<span>${length} of 96 total tracks played across ${matchesCounted} ${matchesCounted === 1 ? "match" : "matches"}
        ${selectedTeam ? `<span class="settings-extra-info">(involving ${escapeHTML(selectedTeam)})</span>` : ''}
        ${testMatchesCheckbox.checked ? '<span class="settings-extra-info">(including test matches)</span>' : ''}</span>`;

    return `
        ${headerText}
        <div class="track-frequency">
            ${resultString}
        </div>
    `;
}

async function generateMatchStatsBox(showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    const trackStats = {};
    let matchesCounted = 0;
    const selectedTeam = teamFilterSelect.value;

    for (const date in matchData) {
        const matches = matchData[date];
        for (const match of matches) {
            if (!match.detailedResults) continue;
            if (!testMatchesCheckbox.checked && match.testMatch === true) continue;

            const teams = match.teamsInvolved || [];
            if (selectedTeam && !teams.includes(selectedTeam)) continue;

            matchesCounted++;

            for (const result of match.detailedResults) {
                const track = result.track;
                // race objects are keyed by seat ("1"/"2"), not by team ID
                const positions1 = result["1"] || [];
                const positions2 = result["2"] || [];

                const score1 = positions1.reduce((sum, pos) => sum + calculateScore(pos), 0);
                const score2 = positions2.reduce((sum, pos) => sum + calculateScore(pos), 0);
                const difference = Math.abs(score1 - score2);

                if (!trackStats[track]) {
                    trackStats[track] = {
                        count: 0,
                        totalDiff: 0,
                        matchDates: [],
                        teamCounts: {},
                        teamDiffs: {}
                    };
                }

                trackStats[track].count++;
                trackStats[track].totalDiff += difference;

                if (!trackStats[track].matchDates.includes(date)) {
                    trackStats[track].matchDates.push(date);
                }

                teams.forEach(team => {
                    if (!trackStats[track].teamCounts[team]) {
                        trackStats[track].teamCounts[team] = 0;
                    }
                    trackStats[track].teamCounts[team]++;

                    if (!trackStats[track].teamDiffs[team]) {
                        trackStats[track].teamDiffs[team] = { count: 0, totalDiff: 0 };
                    }
                    trackStats[track].teamDiffs[team].count++;
                    trackStats[track].teamDiffs[team].totalDiff += difference;
                });
            }
        }
    }

    trackStatsByTrack = trackStats;

    const showUnplayed = unplayedTracksToggle.checked;
    const unplayedTracks = showUnplayed ? getUnplayedTracks() : [];
    const extraFields = buildTrackCountDiv(trackStats, matchesCounted, unplayedTracks, showUnplayed);

    let tempTeamBox = teamBoxFormatHTML
        .replace("{{trackCounts}}", extraFields);

    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');

    applyTrackSearch();
    showErrorBox(showError);
}

function buildTrackModalBody(track, stats) {
    const avgDiff = (stats.totalDiff / stats.count).toFixed(1);

    const teams = Object.entries(stats.teamCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([team, count]) => {
            const color = getTeamColor(team);
            const dot = color ? `<span class="team-color-dot" style="background-color:${color}"></span>` : "";
            const teamStats = stats.teamDiffs?.[team];
            const avgDiff = teamStats ? (teamStats.totalDiff / teamStats.count).toFixed(1) : null;
            const avgDiffText = avgDiff !== null ? ` <span class="track-modal-avg">(avg ${avgDiff})</span>` : "";
            return `<li>${dot}<span class="track-modal-team">${escapeHTML(team)}${avgDiffText}</span><span class="track-modal-count">${count}</span></li>`;
        })
        .join("");

    const dates = stats.matchDates
        .map(date => `<li><a target="_blank" rel="noopener" href="/schedule/?date=${encodeURIComponent(date)}">${escapeHTML(date)}</a></li>`)
        .join("");

    return `
        <div class="track-modal-stats">
            <div class="track-modal-stat">
                <span class="track-modal-stat-label">Times played</span>
                <span class="track-modal-stat-value">${stats.count}</span>
            </div>
            <div class="track-modal-stat">
                <span class="track-modal-stat-label">Avg points difference</span>
                <span class="track-modal-stat-value">${avgDiff}</span>
            </div>
        </div>
        <div class="track-modal-section">
            <p class="track-modal-heading">Played by</p>
            <ul class="track-modal-list">${teams}</ul>
        </div>
        <div class="track-modal-section">
            <p class="track-modal-heading">Dates played on</p>
            <ul class="track-modal-list">${dates}</ul>
        </div>
    `;
}

function openTrackModal(track) {
    const stats = trackStatsByTrack[track];
    if (!stats || trackModal.open) return;

    lastFocusedTrackItem = document.activeElement?.closest?.(".track-item") ?? null;

    trackModalTitle.textContent = track;
    trackModalIcon.src = getTrackIconUrl(track);
    trackModalIcon.alt = `The icon for ${track}`;
    trackModalBody.innerHTML = buildTrackModalBody(track, stats);

    trackModal.showModal();
    trackModalClose.focus();
}

function closeTrackModal() {
    if (!trackModal.open || trackModal.classList.contains("closing")) return;

    trackModal.classList.add("closing");

    const onAnimationEnd = (e) => {
        if (e.target !== trackModal || e.pseudoElement) return;

        trackModal.classList.remove("closing");
        trackModal.removeEventListener("animationend", onAnimationEnd);
        trackModal.close();
        lastFocusedTrackItem?.focus();
        lastFocusedTrackItem = null;
    };

    trackModal.addEventListener("animationend", onAnimationEnd);
}

function findTrackName(searchKey) {
    return Object.keys(trackStatsByTrack).find(track => track.toLowerCase() === searchKey) ?? null;
}

JSTeamBox.addEventListener("click", e => {
    const item = e.target.closest(".track-item");
    if (!item) return;

    const track = findTrackName(item.dataset.track);
    if (track) openTrackModal(track);
});

trackModalClose.addEventListener("click", closeTrackModal);

trackModal.addEventListener("click", e => {
    const rect = trackModal.getBoundingClientRect();
    const clickedInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!clickedInside) closeTrackModal();
});

trackModal.addEventListener("cancel", e => {
    e.preventDefault();
    closeTrackModal();
});

function applyTrackSearch() {
    const term = trackSearchInput.value.trim().toLowerCase();
    trackSearchClear.classList.toggle("visible", term.length > 0);
    const items = JSTeamBox.querySelectorAll(".track-item");
    let visibleCount = 0;

    items.forEach(item => {
        const matches = !term || item.dataset.track.includes(term);
        item.style.display = matches ? "" : "none";
        if (matches) visibleCount++;

        const nameEl = item.querySelector(".track-name");
        if (nameEl) nameEl.innerHTML = highlightMatch(nameEl.textContent, term);
    });

    trackNoResults.style.display = items.length && visibleCount === 0 ? "" : "none";
}

function showErrorBox(showError) {
    let errorBlock = document.getElementById("team-api-error");
    const mainElem = document.querySelector("main");

    if (showError === 1 || showError === 2) {
        if (!errorBlock) {
            errorBlock = document.createElement("blockquote");
            errorBlock.className = "fail";
            errorBlock.id = "team-api-error";
            if (mainElem) mainElem.appendChild(errorBlock);
        }
        if (showError === 1) {
            const retryMsg = window.retryCount ? `<b>API error - Retrying: attempt ${window.retryCount}</b><br>` : "<b>API error</b><br>";
            errorBlock.innerHTML = `${retryMsg}Failed to fetch user data from the API, the below information may not be up to date!`;
        } else {
            errorBlock.innerHTML = "<b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.";
        }
    } else if (errorBlock) {
        errorBlock.remove();
    }
}

function calculateScore(position) {
    return scoreMap[position - 1] || 1; // Default to 1 if position is out of range
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

async function getCurrentSeason() {
    return fetch('https://api.umkl.co.uk/seasoninfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            season: 0
        })
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

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    debugLog(`Generating match stats box`);
    renderStatsSkeleton();

    let showError = 0;

    try {
        fetchedCurrentSeason = await getCurrentSeason();
        matchData = await getMatchData();
        teamColors = await getTeamcolors();
        populateTeamFilter();
    } catch (error) {
        if (error && error.message && error.message.includes('429')) {
            showError = 2;
        } else {
            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    if (typeof retryCount === 'undefined') {
                        window.retryCount = 1;
                    } else {
                        window.retryCount++;
                    }
                    fetchedCurrentSeason = await getCurrentSeason();
                    matchData = await getMatchData();
                    teamColors = await getTeamcolors();
                    populateTeamFilter();
                    showError = 0;
                    await generateMatchStatsBox(showError);
                } catch (err) {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }
    await generateMatchStatsBox(showError);

    debugLog(`Generated match stats box in ${(performance.now() - startTime).toFixed(2)}ms`);
});

testMatchesCheckbox.addEventListener("click", async function () {
    await generateMatchStatsBox();
});

teamFilterSelect.addEventListener("change", async function () {
    updateTeamParam();
    await generateMatchStatsBox();
});

window.addEventListener("popstate", async function () {
    const teams = [...teamFilterSelect.options].map(option => option.value).filter(Boolean);
    const requested = resolveTeamName(new URLSearchParams(window.location.search).get("team"), teams);
    if (requested === teamFilterSelect.value) return;
    teamFilterSelect.value = requested;
    await generateMatchStatsBox();
});

function setTrackSortUI(value) {
    trackSortWrapper.querySelectorAll("button").forEach(button => {
        button.classList.toggle("bubble-link-accent", button.dataset.value === value);
        button.classList.toggle("no-color-link", button.dataset.value !== value);
    });
}

trackSortWrapper.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", async function () {
        if (unplayedTracksToggle.checked) return; // unplayed tracks are always listed alphabetically

        if (currentTrackSort === button.dataset.value) return;
        currentTrackSort = button.dataset.value;

        setTrackSortUI(button.dataset.value);

        await generateMatchStatsBox();
    });
});

unplayedTracksToggle.addEventListener("change", async function () {
    if (unplayedTracksToggle.checked) {
        if (currentTrackSort !== "alphabetical") previousTrackSort = currentTrackSort;
        currentTrackSort = "alphabetical";
        setTrackSortUI("alphabetical");
    } else if (previousTrackSort) {
        currentTrackSort = previousTrackSort;
        setTrackSortUI(previousTrackSort);
        previousTrackSort = null;
    }

    await generateMatchStatsBox();
});

trackSearchInput.addEventListener("input", () => applyTrackSearch());

function clearTrackSearch() {
    trackSearchInput.value = "";
    applyTrackSearch();
    trackSearchInput.focus();
}

document.getElementById("track-clear-search").addEventListener("click", clearTrackSearch);
trackSearchClear.addEventListener("click", clearTrackSearch);
