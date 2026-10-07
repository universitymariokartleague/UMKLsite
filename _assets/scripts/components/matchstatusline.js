/*
    Shows a line on the home page for every match that's live right now, or
    starting today/tomorrow, each with its own countdown. Hides itself if none apply.
*/

import { getMatchData } from '/_assets/scripts/utils/matchdata.js';
import { icon } from '/_assets/scripts/utils/icons.js';

const matchStatusLine = document.getElementById('matchStatusLine');
let countdownIntervals = [];

// save CPU cycles
const MAX_TIMEOUT = 2 ** 31 - 1;

// Show a countdown when under this value instead of "tomorrow"
const COUNTDOWN_WINDOW_MS = 12 * 60 * 60 * 1000;

const pad = n => String(n).padStart(2, '0');
const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getRelevantMatches(matchData) {
    const now = new Date();
    const todayStr = formatDate(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    const matches = [
        ...(matchData[todayStr] || []).map(m => ({ ...m, matchDate: todayStr })),
        ...(matchData[tomorrowStr] || []).map(m => ({ ...m, matchDate: tomorrowStr })),
    ].filter(m => !m.endTime);

    matches.sort((a, b) => new Date(`${a.matchDate}T${a.time || '00:00:00'}`) - new Date(`${b.matchDate}T${b.time || '00:00:00'}`));
    return matches;
}

function formatCountdown(diffMs) {
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days > 0 ? `${days}d ` : ''}${hours}:${pad(minutes)}:${pad(seconds)}`;
}

function clearAllCountdowns() {
    countdownIntervals.forEach(id => {
        clearInterval(id);
        clearTimeout(id);
    });
    countdownIntervals = [];
}

function buildPill(match, index) {
    const [teamA, teamB] = match.teamsInvolved || ['TBC', 'TBC'];
    const matchTime = new Date(`${match.matchDate}T${match.time || '00:00:00'}`);
    const isLive = matchTime.getTime() <= Date.now();
    const href = `/schedule/?date=${match.matchDate}`;

    if (isLive) {
        return {
            html: `<a href="${href}" class="bubble-link bubble-link-accent"><div class="live-dot"></div>Live now: ${teamA} vs ${teamB}</a>`,
            matchTime,
            countdownId: null,
        };
    }

    const diffMs = matchTime.getTime() - Date.now();
    if (diffMs >= COUNTDOWN_WINDOW_MS) {
        const dayLabel = match.matchDate === formatDate(new Date()) ? 'today' : 'tomorrow';
        return {
            html: `<a href="${href}" class="bubble-link bubble-link-accent">${icon('clock')}${teamA} vs ${teamB} ${dayLabel}</a>`,
            matchTime,
            countdownId: null,
            refreshAt: matchTime.getTime() - COUNTDOWN_WINDOW_MS,
        };
    }

    const countdownId = `matchStatusCountdown-${match.eventID || index}`;
    return {
        html: `<a href="${href}" class="bubble-link bubble-link-accent">${icon('clock')}${teamA} vs ${teamB} in <span id="${countdownId}">${formatCountdown(diffMs)}</span></a>`,
        matchTime,
        countdownId,
    };
}

function render(matchData) {
    if (!matchStatusLine) return;
    clearAllCountdowns();

    const matches = getRelevantMatches(matchData);
    if (!matches.length) {
        matchStatusLine.innerHTML = '';
        return;
    }

    const pills = matches.map(buildPill);
    matchStatusLine.innerHTML = pills.map(p => p.html).join('');

    pills.forEach(pill => {
        if (!pill.countdownId) {
            if (!pill.refreshAt) return;

            const delay = pill.refreshAt - Date.now();
            if (delay <= 0 || delay > MAX_TIMEOUT) {
                render(matchData);
                return;
            }

            const timeout = setTimeout(() => render(matchData), delay);
            countdownIntervals.push(timeout);
            return;
        }

        const interval = setInterval(() => {
            const countdownEl = document.getElementById(pill.countdownId);
            if (!countdownEl) {
                clearInterval(interval);
                return;
            }

            const diffMs = pill.matchTime - Date.now();
            if (diffMs <= 0) {
                render(matchData);
                return;
            }

            countdownEl.textContent = formatCountdown(diffMs);
        }, 1000);

        countdownIntervals.push(interval);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!matchStatusLine) return;

    try {
        const matchData = await getMatchData();
        render(matchData);
    } catch {
        matchStatusLine.innerHTML = '';
    }
});
