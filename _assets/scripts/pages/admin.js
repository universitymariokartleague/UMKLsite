import {
    ADMIN_API, accessNotice, adminFetch, emblem, escapeHtml, login, logout, plural,
    setMessage, statusLabel, statusTone, whoAmI
} from '/_assets/scripts/utils/adminapi.js';
import { buildPost, DRAFT_STORAGE_KEY, ISO_DATE, slugify } from '/_assets/scripts/utils/umklpost.js';

const VIEWS = {
    media: 'Media',
    articles: 'Articles',
    matches: 'Matches',
    teams: 'Teams',
    seasons: 'Seasons',
    tickets: 'Tickets',
    backups: 'Backups',
    audit: 'Audit',
    commits: 'Commits',
    health: 'Health'
};

const STATUS_FILTERS = {
    matches: ['open', 'awaiting_results', 'approved', 'complete'],
    tickets: ['open', 'closed']
};

const state = {
    me: null,
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
    const adminRoles = new Set(me.admin_roles || []);
    els.roles.innerHTML = (me.roles || [])
        .filter(role => role !== '@everyone' && adminRoles.has(role))
        .map(role => `<span class="admin-pill">${escapeHtml(role)}</span>`)
        .join('');

    setMessage(els.message, accessNotice(me), 'caution');
}

/** Views the current session isn't allowed to use, so their tab is hidden. */
/**
 * Views the current session isn't allowed to use, so their tab is hidden.
 *
 * Three independent gates: league data (Board/Manager/Developer), backup
 * downloads (Board/Developer), and the media view everyone gets.
 */
function visibleViews() {
    const me = state.me || {};
    let views = { ...VIEWS };

    if (me.can_view_league_data === false) {
        const league = ['matches', 'teams', 'seasons', 'tickets', 'audit', 'commits'];
        for (const view of league) delete views[view];
    }
    if (me.can_download_backups === false) {
        delete views.backups;
    }
    return views;
}

function renderNav() {
    const views = visibleViews();
    els.nav.innerHTML = Object.entries(views).map(([view, label]) => {
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

async function renderBackups() {
    showFilters(null, null);
    const info = await adminFetch('/backups', { query: { page: state.page, per_page: 50 } });

    els.body.innerHTML = `
    <div class="admin-panel">
        <div class="admin-panel-head">
            <h2>Backups</h2>
            <div class="admin-bar-spacer"></div>
            <a class="admin-btn small" href="${ADMIN_API}/data/export" download>Download current data (.zip)</a>
        </div>
        <p class="admin-muted">
            ${info.total} archive${info.total === 1 ? '' : 's'}, ${escapeHtml(info.total_size)} in total.
            Download an archive to restore from it.
        </p>
        ${info.backups.length ? `
        <div class="table-scroll-wrapper">
            <table class="admin-table">
                <thead><tr><th>Archive</th><th class="admin-hide-small">Taken</th><th class="admin-num">Size</th><th></th></tr></thead>
                <tbody>${info.backups.map(backup => `<tr>
                    <td class="admin-nowrap">${escapeHtml(backup.path)}</td>
                    <td class="admin-hide-small admin-nowrap">${escapeHtml(backup.modified_display)}</td>
                    <td class="admin-num">${escapeHtml(backup.size)}</td>
                    <td class="admin-num"><a class="admin-btn small"
                        href="${ADMIN_API}/backups/download?path=${encodeURIComponent(backup.path)}"
                        download>Download</a></td>
                </tr>`).join('')}</tbody>
            </table>
        </div>` : '<p class="admin-empty">No backups have been taken yet.</p>'}
        ${pager(info)}
    </div>`;
}

async function renderMedia() {
    showFilters(null, null);
    const [media, health] = await Promise.all([adminFetch('/media'), adminFetch('/health')]);

    const age = seconds => {
        if (seconds === null || seconds === undefined) return 'never';
        if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
        return `${Math.round(seconds / 86400)} days ago`;
    };

    const card = (title, value, detail) => `<div class="admin-health-card">
        <h4>${escapeHtml(title)}</h4>
        <dl><dt>Cached</dt><dd>${value}</dd><dt>Refreshed</dt><dd>${escapeHtml(age(detail))}</dd></dl>
    </div>`;

    els.body.innerHTML = `<div class="admin-panel">
        <div class="admin-panel-head"><h2>Media</h2></div>
        <div class="admin-health-grid">
            ${card('Videos', media.videos.count, media.videos.age_seconds)}
            ${card('Avatars', media.avatars.count, media.avatars.age_seconds)}
        </div>
        <p class="admin-muted">Videos and avatars refresh on their own every
            ${Math.round(media.cache_ttl_seconds / 60)} minutes and 24 hours.</p>
    </div>

    <div class="admin-panel">
        <div class="admin-panel-head"><h2>System health</h2>
            <div class="admin-bar-spacer"></div>
            <span class="admin-pill ${health.ok ? 'positive' : 'caution'}">${health.ok ? 'All good' : 'Check issues'}</span>
        </div>
        <div class="admin-health-grid">
            <div class="admin-health-card"><h4>Database</h4><dl>
                <dt>Status</dt><dd>${health.checks.database.ok ? 'OK' : 'Error'}</dd>
            </dl></div>
            <div class="admin-health-card"><h4>Discord</h4><dl>
                <dt>Bot connected</dt><dd>${health.checks.discord.connected ? 'Yes' : 'No'}</dd>
                <dt>In UMKL server</dt><dd>${health.checks.discord.in_guild ? 'Yes' : 'No'}</dd>
            </dl></div>
        </div>
    </div>`;
}

async function renderCommits() {
    const info = await adminFetch('/commits', { query: { page: state.page, per_page: 50 } });
    showFilters(null, null);

    const repos = info.repos || [];
    const live = repos.filter(repo => repo.available);

    const locale = localStorage.getItem('locale') || 'en-GB';
    const when = iso => new Date(iso).toLocaleString(locale,
        { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (!live.length) {
        els.body.innerHTML = `<div class="admin-panel">
            <div class="admin-panel-head"><h2>Commits</h2></div>
            ${emptyTable('No git checkouts were found, so there is no history to show.')}
        </div>`;
        return;
    }

    const pills = live.map(repo =>
        `<span class="admin-pill">${escapeHtml(repo.name)} &middot; ${escapeHtml(repo.branch || 'detached')}</span>`
    ).join('');

    els.body.innerHTML = `<div class="admin-panel">
        <div class="admin-panel-head"><h2>Commits</h2>
            <div class="admin-bar-spacer"></div>
            <span class="admin-role-list">${pills}</span></div>
        ${info.commits.length ? `<div class="table-scroll-wrapper">
            <table class="admin-table">
                <thead><tr><th>When</th><th>Commit</th><th>Who</th>
                    <th class="admin-hide-small">Message</th></tr></thead>
                <tbody>${info.commits.map(commit => {
        const sha = commit.url
            ? `<a href="${escapeHtml(commit.url)}" target="_blank" rel="noopener noreferrer"
                               class="no-underline-link"><code>${escapeHtml(commit.short_sha)}</code></a>`
            : `<code>${escapeHtml(commit.short_sha)}</code>`;
        const head = commit.is_head
            ? ' <span class="admin-pill accent">HEAD</span>' : '';
        const repo = repos.length > 1
            ? `<div class="admin-muted">${escapeHtml(commit.repo)}</div>` : '';
        const message = escapeHtml(commit.message)
            + (commit.body ? `<div class="admin-muted">${escapeHtml(commit.body)}</div>` : '');
        return `<tr>
                        <td class="admin-nowrap">${escapeHtml(when(commit.committed_at))}</td>
                        <td>${sha}${head}</td>
                        <td class="admin-nowrap">${escapeHtml(commit.author)}${repo}</td>
                        <td class="admin-hide-small">${message}</td>
                    </tr>`;
    }).join('')}</tbody>
            </table>
        </div>` : emptyTable('No commits found.')}
        ${pager(info)}
    </div>`;
}

/** The draft the Article Builder autosaves, if there is one. */
function readBuilderDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return null;
        const draft = JSON.parse(raw);
        return draft && (draft.title || draft.bodyHtml) ? draft : null;
    } catch (error) {
        console.error("Couldn't read the Article Builder draft:", error);
        return null;
    }
}

function draftPreview(draft) {
    const title = draft.title?.trim();
    const tags = (draft.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const words = (draft.bodyHtml || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    const saved = draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'at an unknown time';
    const draftDate = ISO_DATE.test(draft.date || '') ? draft.date : '';

    if (!title) return '';

    return `<div class="admin-panel article-draft-panel">
        <div class="admin-panel-head"><h2>Draft from the Article Builder</h2>
            <span class="admin-pill accent">Draft</span>
            <div class="admin-bar-spacer"></div>
            <span class="admin-muted">saved ${escapeHtml(saved)}</span></div>

        <div class="article-draft">
            ${draft.mainImageUrl
                ? `<img class="article-draft-image" src="${escapeHtml(draft.mainImageUrl)}" alt="">`
                : `<div class="article-draft-image article-card-placeholder" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 5h13v14H4z"></path>
                        <path d="M17 8h3v9a2 2 0 0 1-2 2H4"></path>
                        <path d="M7 8h7M7 11h7M7 14h4"></path>
                    </svg>
                </div>`}
            <div class="article-draft-body">
                <h3>${escapeHtml(title)}</h3>
                ${draft.subtitle ? `<p class="admin-muted">${escapeHtml(draft.subtitle)}</p>` : ''}
                <dl class="article-draft-fields">
                    <dt>Slug</dt><dd><code>${escapeHtml(slugify(title))}</code></dd>
                    <dt>Author</dt><dd>${escapeHtml((draft.author || '').trim() || 'Anonymous')}</dd>
                    <dt>Tags</dt><dd>${tags.map(t => `<span class="admin-pill">${escapeHtml(t)}</span>`).join(' ')}</dd>
                    <dt>Body</dt><dd>${words} words${draft.mainImageUrl ? ' + main image' : ''}</dd>
                    <dt>Publish date</dt><dd>${escapeHtml(draftDate || 'today, when you upload')}</dd>
                </dl>
                <div class="article-upload-row">
                    <button class="admin-btn accent" id="article-draft-upload">Publish this draft</button>
                    <a class="admin-btn" href="/tools/articlebuilder/" target="_blank" rel="noopener noreferrer">Back to the builder</a>
                </div>
                <span id="article-draft-status" class="admin-muted"></span>
            </div>
        </div>
    </div>`;
}

/** "2026-10-07" -> "7 Oct 2026", matching the public news listing. */
function formatArticleDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const locale = localStorage.getItem('locale') || 'en-GB';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function articleImage(article) {
    if (article.image_url) return article.image_url;
    if (!article.image || !article.slug) return '';
    if (/^https?:\/\//i.test(article.image)) return article.image;
    return `https://api.umkl.co.uk/articles/${encodeURIComponent(article.slug)}/images/${encodeURIComponent(article.image)}`;
}

function articleCard(article) {
    const tags = article.tags || [];
    const image = articleImage(article);
    const alt = article.image_alt || '';
    const date = formatArticleDate(article.published_date);
    const author = (article.author || '').trim();

    return `<article class="article-card">
        <div class="article-card-media">
            <span class="article-card-placeholder" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 5h13v14H4z"></path>
                    <path d="M17 8h3v9a2 2 0 0 1-2 2H4"></path>
                    <path d="M7 8h7M7 11h7M7 14h4"></path>
                </svg>
            </span>
            ${image ? `<img loading="lazy" src="${escapeHtml(image)}" alt="${escapeHtml(alt)}"
                onload="this.classList.add('is-loaded')">` : ''}
        </div>
        <div class="article-card-body">
            <div class="article-card-eyebrow">
                <span class="article-card-date">${escapeHtml(date)}</span>
                ${author ? `<span class="article-card-author">${escapeHtml(author)}</span>` : ''}
            </div>
            <h3 class="article-card-title">
                <a href="${escapeHtml(article.link)}" target="_blank"
                    rel="noopener noreferrer">${escapeHtml(article.title)}</a>
            </h3>
            ${article.description ? `<p class="article-card-desc">${escapeHtml(article.description)}</p>` : ''}
            <div class="article-card-foot">
                <div class="article-card-tags">${tags.map(tag =>
                    `<span class="admin-pill">${escapeHtml(tag)}</span>`).join('')}</div>
                <button class="admin-btn small danger article-card-delete"
                    data-delete="${escapeHtml(article.slug)}"
                    data-title="${escapeHtml(article.title)}">Delete</button>
            </div>
        </div>
    </article>`;
}

async function renderArticles() {
    showFilters(null, null);
    const [info, draft] = [await adminFetch('/articles', { query: { page: state.page, per_page: 50 } }), readBuilderDraft()];

    els.body.innerHTML = (draft ? draftPreview(draft) : '') + `<div class="admin-panel">
        <div class="admin-panel-head"><h2>Articles</h2>
            <div class="admin-bar-spacer"></div>
            <span class="admin-muted">${plural(info.total, 'published article')}</span></div>

        <div class="article-upload">
            <div class="article-upload-copy">
                <h3>Publish an article</h3>
                <p class="admin-muted">Write it in the <a class="no-underline-link"
                        href="/tools/articlebuilder/" target="_blank" rel="noopener noreferrer">Article
                    Builder</a>, then publish the draft from here, or export the
                    <code>.umklpost</code> and upload that.</p>
            </div>
            <div class="article-upload-row">
                <button class="admin-btn" id="article-upload-choose">Choose file</button>
                <input type="file" id="article-upload-file" accept=".umklpost,.zip" hidden>
                <button class="admin-btn accent" id="article-upload-go">Upload</button>
            </div>
            <span id="article-upload-status" class="admin-muted"></span>
        </div>
    </div>

    <div class="admin-panel">
        <div class="admin-panel-head"><h2>Published</h2>
            <div class="admin-bar-spacer"></div>
            <span class="admin-muted">Click a card to open the article</span></div>
        ${info.articles.length
            ? `<div class="article-grid">${info.articles.map(articleCard).join('')}</div>`
            : emptyTable('No articles published yet.')}
        ${pager(info)}
    </div>`;

    // Cached images can finish before the inline onload is parsed.
    els.body.querySelectorAll('.article-card-media img').forEach(img => {
        if (img.complete) img.classList.add('is-loaded');
    });

    const fileInput = document.getElementById('article-upload-file');
    const uploadStatus = document.getElementById('article-upload-status');
    const chooseBtn = document.getElementById('article-upload-choose');

    chooseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const picked = fileInput.files[0];
        chooseBtn.textContent = picked ? picked.name : 'Choose file';
    });

    async function publishPost(blob, status, button) {
        const form = new FormData();
        form.append('file', blob, 'article.umklpost');
        status.textContent = 'Uploading…';
        button.disabled = true;
        try {
            const saved = await adminFetch('/articles/import', { method: 'POST', form });
            setMessage(els.message, `Published "${saved.article.title}".`, 'success');
            state.page = 1;
            await renderArticles();
        } catch (error) {
            status.textContent = error.message;
            button.disabled = false;
        }
    }

    document.getElementById('article-upload-go').addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            uploadStatus.textContent = 'Choose a .umklpost first.';
            return;
        }
        await publishPost(file, uploadStatus, document.getElementById('article-upload-go'));
    });

    document.getElementById('article-draft-upload')?.addEventListener('click', async () => {
        const button = document.getElementById('article-draft-upload');
        const status = document.getElementById('article-draft-status');
        try {
            // Same .umklpost the builder's download button would have produced
            const { blob } = await buildPost(draft);
            await publishPost(blob, status, button);
        } catch (error) {
            console.error("Couldn't build the .umklpost:", error);
            status.textContent = `Couldn't build the upload: ${error.message}`;
        }
    });

    els.body.querySelectorAll('[data-delete]').forEach(button => {
        button.addEventListener('click', async () => {
            if (!confirm(`Delete "${button.dataset.title}" and its images?`)) return;
            try {
                await adminFetch(`/articles/${button.dataset.delete}`, { method: 'DELETE' });
                setMessage(els.message, `Deleted "${button.dataset.title}".`, 'success');
                await renderArticles();
            } catch (error) {
                setMessage(els.message, error.message);
            }
        });
    });
}

const RENDERERS = {
    media: renderMedia,
    articles: renderArticles,
    matches: renderMatches,
    teams: renderTeams,
    seasons: renderSeasons,
    tickets: renderTickets,
    backups: renderBackups,
    audit: renderAudit,
    commits: renderCommits,
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
        await logout().catch(() => { });
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

    state.me = me;

    // A view the session can't use falls back to the default rather than
    // erroring on a 403.
    if (!Object.hasOwn(visibleViews(), state.view)) {
        state.view = 'matches';
        writeUrl();
    }

    renderSignedIn(me);
    await renderView();
}

document.addEventListener('DOMContentLoaded', init);
