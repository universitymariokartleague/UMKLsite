import { icon } from '/_assets/scripts/utils/icons.js';
import { getMatchData, normalizeMatchData, getMatchCache, setMatchCache } from '/_assets/scripts/utils/matchdata.js';

export { getVideoStatus, loadMatchStartTimes, videoStatusIcon, VIDEO_STATUS_EXPIRED_EVENT };

const BADGE_CLASS = 'video-live-badge';
const TICKING_BADGE_SELECTOR = `.${BADGE_CLASS}[data-live-at]`;
const TICK_INTERVAL_MS = 30000;

const VIDEO_STATUS_EXPIRED_EVENT = 'videos:badgeexpired';

let matchStartTimes = new Map();
let matchStartTimesPromise = null;
let tickerId = null;

function formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    if (hours >= 1) return `${hours}h`;
    return `${Math.max(1, Math.floor(milliseconds / 60000))}m`;
}

function buildMatchStartTimes(matchData) {
    const times = new Map();

    normalizeMatchData(matchData).forEach(entry => {
        if (!entry.time) return;
        const timestamp = Date.parse(`${entry.matchDate}T${entry.time}`);
        if (!isNaN(timestamp)) times.set(String(entry.eventID), timestamp);
    });

    return times;
}

function loadMatchStartTimes() {
    if (matchStartTimesPromise) return matchStartTimesPromise;

    matchStartTimesPromise = (async () => {
        const cached = getMatchCache();
        if (cached) matchStartTimes = buildMatchStartTimes(cached);

        const fresh = await getMatchData();
        setMatchCache(fresh);
        matchStartTimes = buildMatchStartTimes(fresh);
        return matchStartTimes;
    })().catch(error => {
        console.error("Error loading match start times:", error);
        return matchStartTimes;
    });

    return matchStartTimesPromise;
}

function getScheduledStart(video) {
    const eventId = video?.match?.event_id;
    if (eventId == null) return null;
    return matchStartTimes.get(String(eventId)) ?? null;
}

function getVideoStatus(video, now = Date.now()) {
    const start = getScheduledStart(video);
    if (start != null) {
        if (start <= now) return null;
        return { label: `Live in ${formatDuration(start - now)}`, timestamp: start };
    }

    const value = (video?.published || '').trim();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const timestamp = Date.parse(dateOnly ? `${value}T00:00:00` : value);
    if (isNaN(timestamp)) return null;

    if (dateOnly) {
        const startOfDay = new Date(timestamp);
        const endOfDay = new Date(timestamp);
        endOfDay.setDate(endOfDay.getDate() + 1);

        if (now < startOfDay.getTime()) {
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);
            const days = Math.round((startOfDay.getTime() - startOfToday.getTime()) / 86400000);
            return { label: days <= 1 ? 'Live tomorrow' : `Live in ${days}d` };
        }

        return now < endOfDay.getTime() ? { label: 'Live today' } : null;
    }

    if (timestamp <= now) return null;
    return { label: `Live in ${formatDuration(timestamp - now)}`, timestamp };
}

function tickBadges() {
    const now = Date.now();
    let expired = false;

    document.querySelectorAll(TICKING_BADGE_SELECTOR).forEach(badge => {
        const liveAt = Number(badge.dataset.liveAt);
        if (liveAt > now) {
            badge.textContent = `Live in ${formatDuration(liveAt - now)}`;
        } else {
            badge.outerHTML = icon('play');
            expired = true;
        }
    });

    if (expired) document.dispatchEvent(new CustomEvent(VIDEO_STATUS_EXPIRED_EVENT));
}

function startTicker() {
    if (tickerId != null) return;

    tickerId = setInterval(() => {
        tickBadges();

        if (document.querySelector(TICKING_BADGE_SELECTOR) === null) {
            clearInterval(tickerId);
            tickerId = null;
        }
    }, TICK_INTERVAL_MS);
}

function videoStatusIcon(video) {
    const status = getVideoStatus(video);
    if (!status) return icon('play');

    if (status.timestamp) {
        startTicker();
        return `<span class="${BADGE_CLASS}" data-live-at="${status.timestamp}">${status.label}</span>`;
    }

    return `<span class="${BADGE_CLASS}">${status.label}</span>`;
}
