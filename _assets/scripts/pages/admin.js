import {
    accessNotice, adminFetch, emblem, escapeHtml, login, logout,
    setMessage, statusLabel, statusTone, whoAmI
} from '/_assets/scripts/utils/adminapi.js';

const VIEWS = {
    matches: 'Matches',
    teams: 'Teams',
    seasons: 'Seasons',
    tickets: 'Tickets',
    audit: 'Audit',
    health: 'Health'
};

const STATUS_FILTERS = {
    matches: ['open', 'awaiting_results', 'approved', 'complete'],
    tickets: ['open', 'closed']
};

const state = {
    view: 'matches',
    page: 1,
    status: '',
    season: '',
    search: ''
};

const els = {};

function cacheElements() {
    Object.assign(els, {
        signedOut: document.getElementById('admin-signed-out'),
        panel: document.getElementById('admin-panel'),
        login: document.getElementById('admin-login'),
        logout: document.getElementById('admin-logout'),
        who: document.getElementById('admin-who'),
        roles: document.getElementById('admin-roles'),
        message: document.getElementById('admin-message'),
        body: document.getElementById('admin-view-body'),
        nav: document.getElementById('admin-nav'),
        filters: document.getElementById('admin-filters'),
        search: document.getElementById('filter-search'),
        status: document.getElementById('filter-status')
    });
}

function setStatusOptions(options) {
    els.status.innerHTML = ['<option value="">Any status</option>']
        .concat(options.map(value => `<option value="${value}">${escapeHtml(statusLabel(value))}</option>`))
        .join('');
    els.status.value = options.includes(state.status) ? state.status : '';
}

function showFilters(options, placeholder) {
    els.filters.hidden = !options && !placeholder;
    els.status.hidden = !options;
    els.search.hidden = !placeholder;
    if (options) setStatusOptions(options);
    if (placeholder) els.search.placeholder = placeholder;
}

function renderSignedOut() {
    els.signedOut.hidden = false;
    els.panel.hidden = true;
}

function renderSignedIn(me) {
    els.signedOut.hidden = true;
    els.panel.hidden = false;

    els.who.textContent = me.name || 'Signed in';
    els.roles.innerHTML = (me.roles || [])
        .filter(role => role !== '@everyone')
        .map(role => `<span class="admin-pill">${escapeHtml(role)}</span>`)
        .join('');

    setMessage(els.message, accessNotice(me), 'caution');
}

function renderNav() {
    els.nav.innerHTML = Object.entries(VIEWS).map(([view, label]) => {
        const active = view === state.view;
        return `<a class="bubble-nav-item${active ? ' active' : ''}" href="?view=${view}"
            ${active ? 'aria-current="page"' : ''}>${label}</a>`;
    }).join('');
}

function teamsCell(teams) {
    if (!teams?.length) return '<span class="admin-muted">-</span>';
    return `<div class="admin-teams">${teams.map(team => `<div class="admin-team-cell">
            ${emblem(team.team_name)}
            <a class="no-underline-link"
               href="/teams/details/?team=${encodeURIComponent(team.team_name)}">${escapeHtml(team.team_name)}</a>
            ${team.signed_up ? `<span class="admin-muted">${escapeHtml(team.signed_up)}</span>` : ''}
        </div>`).join('')}</div>`;
}

function pager(info) {
    const current = info.page || 1;
    const pages = Math.max(1, Math.ceil((info.total || 0) / (info.limit || 1)));
    if (pages <= 1) return '';
    return `<div class="admin-pager">
        <span>Page ${current} of ${pages} (${info.total || 0} total)</span>
        <button class="admin-btn small" data-page="${current - 1}"
            ${current <= 1 ? 'disabled' : ''}>Previous</button>
        <button class="admin-btn small" data-page="${current + 1}"
            ${current >= pages ? 'disabled' : ''}>Next</button>
    </div>`;
}

function emptyTable(message) {
    return `<p class="admin-empty">${escapeHtml(message)}</p>`;
}

async function renderMatches() {
    const info = await adminFetch('/matches', {
        query: {
            page: state.page, per_page: 25,
            status: state.status, season: state.season, search: state.search
        }
    });
    showFilters(STATUS_FILTERS.matches, 'Search by id, date or team');

    els.body.innerHTML = `<div class="admin-panel">
        <div class="admin-panel-head"><h2>Matches</h2></div>
        ${info.matches.length ? `<div class="table-scroll-wrapper">
            <table class="admin-table">
                <thead><tr>
                    <th>Match</th><th>Date</th><th class="admin-hide-small">Game</th>
                    <th class="admin-num">Sign-ups</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>${info.matches.map(match => {
                    const names = match.teams.map(team => team.team_name).join(' vs ');
                    const when = `${match.tournament_date} ${String(match.start_time || '').slice(0, 5)}`;
                    return `<tr>
                        <td>${teamsCell(match.teams)}
                            ${match.test_match ? '<span class="admin-pill neutral">Test</span>' : ''}
                            <div class="admin-muted admin-hide-small">#${match.match_id} · ${escapeHtml(names)}</div>
                        </td>
                        <td class="admin-nowrap">${escapeHtml(when)}</td>
                        <td class="admin-hide-small">${escapeHtml(match.game_name || '-')}</td>
                        <td class="admin-num">${match.signed_up}/${match.team_count * 6 || '-'}</td>
                        <td><span class="admin-pill ${statusTone(match.status)}">${escapeHtml(statusLabel(match.status))}</span></td>
                        <td class="admin-num"><a class="admin-btn small" href="/admin/match/?id=${match.match_id}">Edit</a></td>
                    </tr>`;
                }).join('')}</tbody>
            </table>
        </div>` : emptyTable('No matches match those filters.')}
        ${pager(info)}
    </div>`;
}

async function renderTeams() {
    const info = await adminFetch('/teams', {
        query: { page: state.page, per_page: 50, search: state.search }
    });
    showFilters(null, 'Search teams');

    els.body.innerHTML = `<div class="admin-panel">
        <div class="admin-panel-head"><h2>Teams</h2></div>
        ${info.teams.length ? `<div class="table-scroll-wrapper">
            <table class="admin-table">
                <thead><tr>
                    <th>Team</th><th class="admin-num">Members</th>
                    <th class="admin-hide-small">Place</th><th>Status</th>
                </tr></thead>
                <tbody>${info.teams.map(team => `<tr>
                    <td><div class="admin-team-cell">
                        ${emblem(team.team_name)}
                        <span class="admin-dot" style="--team-color:${escapeHtml(team.team_color || 'transparent')}"></span>
                        <span>${escapeHtml(team.team_name)}</span>
                    </div></td>
                    <td class="admin-num">${team.discord_member_count ?? '-'}</td>
                    <td class="admin-hide-small">${escapeHtml(team.place_name || '-')}</td>
                    <td><span class="admin-pill ${team.enabled ? 'positive' : 'neutral'}">${team.enabled ? 'Enabled' : 'Disabled'}</span></td>
                </tr>`).join('')}</tbody>
            </table>
        </div>` : emptyTable('No teams found.')}
        ${pager(info)}
    </div>`;
}

async function renderSeasons() {
    const [list, current] = await Promise.all([
        adminFetch('/seasons'),
        adminFetch('/seasons/current')
    ]);
    showFilters(null, null);

    const rounds = Object.entries(current.rounds || {});
    const tone = current.status === 'completed' ? 'positive' : 'caution';

    els.body.innerHTML = `
    <div class="admin-panel">
        <div class="admin-panel-head"><h2>Current season</h2></div>
        <table class="admin-table admin-summary">
            <tbody>
                <tr><th>Season</th><td>#${current.season_id}</td></tr>
                <tr><th>Status</th><td><span class="admin-pill ${tone}">${escapeHtml(current.status)}</span></td></tr>
                <tr><th>Matches played</th><td class="admin-num">${current.matches_completed} / ${current.matches_total}</td></tr>
                <tr><th>Current round</th><td class="admin-num">${current.current_round ?? '-'}</td></tr>
            </tbody>
        </table>
    </div>

    <div class="admin-panel">
        <div class="admin-panel-head"><h3>Round pairings</h3></div>
        ${rounds.length ? rounds.map(([round, pairs], index) => `${index ? '<hr class="admin-divider">' : ''}
            <p class="admin-round">Round ${escapeHtml(round)}</p>
            <div class="admin-teams">${pairs.map(pair => `<div class="admin-team-cell">
                ${escapeHtml(pair.join(' vs '))}
            </div>`).join('')}</div>`).join('') : emptyTable('No rounds set up yet.')}
    </div>

    <div class="admin-panel">
        <div class="admin-panel-head"><h3>All seasons</h3></div>
        <div class="table-scroll-wrapper">
            <table class="admin-table">
                <thead><tr><th>Season</th><th>Status</th><th class="admin-num">Played</th></tr></thead>
                <tbody>${list.seasons.map(season => `<tr>
                    <td>#${season.season_id}${season.is_current ? ' <span class="admin-pill accent">current</span>' : ''}</td>
                    <td><span class="admin-pill ${statusTone(season.status)}">${escapeHtml(season.status)}</span></td>
                    <td class="admin-num">${season.matches_completed} / ${season.matches_total}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>
    </div>`;
}

async function renderTickets() {
    const info = await adminFetch('/tickets', {
        query: { page: state.page, per_page: 50, status: state.status || undefined }
    });
    showFilters(STATUS_FILTERS.tickets, null);

    els.body.innerHTML = `<div class="admin-panel">
        <div class="admin-panel-head"><h2>Support tickets</h2></div>
        ${info.tickets.length ? `<div class="table-scroll-wrapper">
            <table class="admin-table">
                <thead><tr><th class="admin-num">#</th><th>Subject</th><th>Status</th>
                    <th class="admin-hide-small">Opened</th><th></th></tr></thead>
                <tbody>${info.tickets.map(ticket => `<tr>
                    <td class="admin-num">${ticket.number}</td>
                    <td>${escapeHtml(ticket.subject)}
                        <div class="admin-muted admin-hide-small">${escapeHtml(ticket.category)}</div></td>
                    <td><span class="admin-pill ${ticket.status === 'open' ? 'caution' : 'neutral'}">${escapeHtml(statusLabel(ticket.status))}</span></td>
                    <td class="admin-hide-small admin-nowrap">${escapeHtml(ticket.opened_at_display || '-')}</td>
                    <td class="admin-num">${ticket.url ? `<a class="admin-btn small"
                        href="${escapeHtml(ticket.url)}" target="_blank" rel="noopener">Open</a>` : '-'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>` : emptyTable('No tickets.')}
        ${pager(info)}
    </div>`;
}

async function renderAudit() {
    const info = await adminFetch('/audit', { query: { page: state.page, per_page: 50 } });
    showFilters(null, null);

    const locale = localStorage.getItem('locale') || 'en-GB';
    const when = stamp => new Date(stamp * 1000).toLocaleString(locale,
        { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    els.body.innerHTML = `<div class="admin-panel">
        <div class="admin-panel-head"><h2>Audit trail</h2>
            <div class="admin-bar-spacer"></div>
            <span class="admin-muted">Who changed what, and when.</span></div>
        ${info.entries.length ? `<div class="table-scroll-wrapper">
            <table class="admin-table">
                <thead><tr><th>When</th><th>Who</th><th>Action</th>
                    <th class="admin-hide-small">Target</th></tr></thead>
                <tbody>${info.entries.map(entry => `<tr>
                    <td class="admin-nowrap">${escapeHtml(when(entry.created_at))}</td>
                    <td>${escapeHtml(entry.actor_name || entry.actor_user_id || 'system')}</td>
                    <td>${escapeHtml(entry.action)}</td>
                    <td class="admin-hide-small admin-muted">${escapeHtml(entry.target || '-')}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>` : emptyTable('Nothing recorded yet.')}
        ${pager(info)}
    </div>`;
}

async function renderHealth() {
    const health = await adminFetch('/health');
    showFilters(null, null);

    const { database, discord, calendar, last_backup: backup } = health.checks;
    const yesNo = (ok, bad = 'No') => ok ? 'Yes' : `<span class="admin-pill negative">${bad}</span>`;
    const age = seconds => {
        if (seconds === null || seconds === undefined) return '-';
        if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
        return `${Math.round(seconds / 86400)} days ago`;
    };

    const card = (title, rows) => `<div class="admin-health-card">
        <h4>${escapeHtml(title)}</h4>
        <dl>${rows.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${value}</dd>`).join('')}</dl>
    </div>`;

    els.body.innerHTML = `<div class="admin-panel">
        <div class="admin-panel-head"><h2>System health</h2>
            <div class="admin-bar-spacer"></div>
            <span class="admin-pill ${health.ok ? 'positive' : 'caution'}">${health.ok ? 'All good' : 'Check issues'}</span></div>
        <div class="admin-health-grid">
            ${card('Database', [
                ['Status', database.ok ? '<span class="admin-pill positive">OK</span>' : '<span class="admin-pill negative">Error</span>'],
                ['Writable', yesNo(database.writable)]
            ])}
            ${card('Discord', [
                ['Bot connected', yesNo(discord.connected)],
                ['In UMKL server', yesNo(discord.in_guild)],
                ['Members cached', discord.members_cached]
            ])}
            ${card('Calendar', [
                ['Built', yesNo(calendar.ok, 'Missing')],
                ['Age', escapeHtml(age(calendar.age_seconds))]
            ])}
            ${card('Last backup', [
                ['Found', yesNo(backup.ok, 'None')],
                ['Age', escapeHtml(age(backup.age_seconds))]
            ])}
        </div>
        <p class="admin-panel-foot">Season ${health.season}</p>
    </div>`;
}

const RENDERERS = {
    matches: renderMatches,
    teams: renderTeams,
    seasons: renderSeasons,
    tickets: renderTickets,
    audit: renderAudit,
    health: renderHealth
};

async function renderView() {
    renderNav();
    els.body.innerHTML = '<p class="admin-empty">Loading…</p>';

    try {
        await RENDERERS[state.view]();
    } catch (error) {
        els.body.innerHTML = '';
        setMessage(els.message, error.message);
    }
}

function readUrl() {
    const params = new URLSearchParams(window.location.search);
    if (Object.hasOwn(VIEWS, params.get('view'))) state.view = params.get('view');
    state.page = Math.max(1, Number(params.get('page')) || 1);
    state.status = params.get('status') || '';
    state.season = params.get('season') || '';
    state.search = params.get('search') || '';
}

function writeUrl(push = false) {
    const params = new URLSearchParams({ view: state.view });
    const { page, status, season, search } = state;
    if (page !== 1) params.set('page', page);
    if (status) params.set('status', status);
    if (season) params.set('season', season);
    if (search) params.set('search', search);
    window.history[push ? 'pushState' : 'replaceState']({}, '', `?${params}`);
}

function applyFilter({ resetPage = true, push = false } = {}) {
    if (resetPage) state.page = 1;
    writeUrl(push);
    syncFilterInputs();
    renderView();
}

function syncFilterInputs() {
    if (els.search) els.search.value = state.search;
    if (els.status && state.status) els.status.value = state.status;
}

let searchTimer;

function wireEvents() {
    els.search.addEventListener('input', event => {
        const value = event.target.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.search = value;
            applyFilter();
        }, 300);
    });

    els.status.addEventListener('change', event => {
        state.status = event.target.value;
        applyFilter();
    });

    els.body.addEventListener('click', event => {
        const pageButton = event.target.closest('[data-page]');
        if (!pageButton || pageButton.disabled) return;
        state.page = Number(pageButton.dataset.page);
        applyFilter({ resetPage: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    els.nav.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const link = event.target.closest('a[href]');
        const view = link && new URL(link.href, window.location.href).searchParams.get('view');
        if (!Object.hasOwn(VIEWS, view)) return;
        event.preventDefault();
        state.view = view;
        state.status = '';
        state.search = '';
        applyFilter({ push: true });
    });

    window.addEventListener('popstate', () => {
        readUrl();
        syncFilterInputs();
        renderView();
    });

    els.login.addEventListener('click', () => login());
    els.logout.addEventListener('click', async () => {
        await logout().catch(() => {});
        window.location.reload();
    });
}

async function init() {
    cacheElements();
    readUrl();
    wireEvents();
    syncFilterInputs();

    const me = await whoAmI();
    if (!me) {
        renderSignedOut();
        return;
    }

    renderSignedIn(me);
    await renderView();
}

document.addEventListener('DOMContentLoaded', init);