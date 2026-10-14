export {
    ADMIN_API, adminFetch, getMe, clearMe, login, logout, whoAmI, canWrite, SignedOutError,
    accessNotice, setMessage, plural, emblem, statusLabel, statusTone, escapeHtml
};

const ADMIN_API = 'https://api.umkl.co.uk/admin';
const EMBLEM_API = 'https://api.umkl.co.uk/teamemblems';

class AdminError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'AdminError';
        this.status = status;
    }
}

class SignedOutError extends AdminError {
    constructor() {
        super(401, 'Sign in with Discord to use the admin panel.');
        this.name = 'SignedOutError';
    }
}

document.addEventListener('error', event => {
    if (event.target.tagName === 'IMG') event.target.classList.add('is-broken');
}, true);

let mePromise = null;

async function adminFetch(path, { method = 'GET', body, query } = {}) {
    const url = new URL(ADMIN_API + path);
    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, value);
            }
        });
    }

    const options = {
        method,
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
    };

    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(url, options);
    } catch {
        throw new AdminError(0, "Couldn't reach the admin API. Check your connection.");
    }

    if (response.status === 401) throw new SignedOutError();

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new AdminError(response.status, payload?.error || `Request failed (${response.status}).`);
    }

    return payload;
}

function getMe(force = false) {
    if (force || !mePromise) {
        mePromise = adminFetch('/me').catch(error => {
            mePromise = null;
            throw error;
        });
    }
    return mePromise;
}

function clearMe() {
    mePromise = null;
}

function login() {
    window.location.href = `${ADMIN_API}/auth/login`;
}

function logout() {
    return adminFetch('/auth/logout', { method: 'POST', body: {} });
}

async function whoAmI() {
    try {
        return await getMe();
    } catch {
        return null;
    }
}

const canWrite = me => Boolean(me?.can_write);

function accessNotice(me) {
    if (me.can_write) return '';
    return me.writes_enabled
        ? `You're signed in as ${me.name}, but your roles only allow read-only access.`
        + ' Ask the board for a write role to make changes.'
        : 'This panel is read-only. Editing league data is turned off.';
}

function setMessage(element, text, tone = 'error') {
    element.hidden = !text;
    element.textContent = text || '';
    if (text) element.className = `admin-message ${tone}`;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function emblem(teamName) {
    const safe = encodeURIComponent((teamName || '').toUpperCase());
    return `<img loading="lazy" class="admin-emblem" src="${EMBLEM_API}/${safe}" alt="">`;
}

const STATUS_LABELS = {
    complete: 'Complete',
    completed: 'Completed',
    approved: 'Approved',
    awaiting_results: 'Awaiting results',
    open: 'Open',
    closed: 'Closed'
};

const STATUS_TONES = {
    complete: 'positive',
    approved: 'positive',
    awaiting_results: 'caution',
    open: 'neutral'
};

const statusLabel = status => STATUS_LABELS[status] || status || 'Unknown';
const statusTone = status => STATUS_TONES[status] || 'neutral';

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
