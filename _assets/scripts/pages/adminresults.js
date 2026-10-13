import {
    accessNotice, adminFetch, emblem, escapeHtml, login, plural,
    setMessage, statusLabel, statusTone, whoAmI
} from '/_assets/scripts/utils/adminapi.js';

const state = {
    me: null,
    match: null,
    matchId: null,
    results: null,
    live: null,
    dirty: new Map()
};

const els = {};

function cacheElements() {
    Object.assign(els, {
        signedOut: document.getElementById('admin-signed-out'),
        panel: document.getElementById('admin-panel'),
        login: document.getElementById('admin-login'),
        message: document.getElementById('admin-message'),
        head: document.getElementById('match-head'),
        editor: document.getElementById('results-editor'),
        actions: document.getElementById('match-actions'),
        livePanel: document.getElementById('live-score-panel'),
        dirtyFlag: null,
        saveButton: null
    });
}

const writable = () => Boolean(state.me?.can_write);
const note = (text, tone) => setMessage(els.message, text, tone);

function teamTotals(team) {
    const total = team.players.reduce((sum, player) => {
        const key = `${team.match_entry_id}:${player.user_id}`;
        const dirty = state.dirty.get(key);
        return sum + (Number(dirty !== undefined ? dirty : player.points) || 0);
    }, 0);
    return { total, adjusted: total - (team.penalty || 0) };
}

function totalMarkup(team, totals) {
    const { total, adjusted } = totals;
    return `<strong>${adjusted}</strong>`
        + (team.penalty ? `${total} − ${team.penalty} penalty` : plural(team.players.length, 'player'));
}

function renderTeam(team, canEdit) {
    const totals = teamTotals(team);

    return `<section class="admin-panel result-team">
        <div class="result-team-head">
            ${emblem(team.team_name)}
            <h3>${escapeHtml(team.team_name)}</h3>
            <div class="result-team-total${team.penalty ? ' has-penalty' : ''}">
                ${totalMarkup(team, totals)}
            </div>
        </div>

        <div class="result-players">
            ${team.players.map(player => {
                const key = `${team.match_entry_id}:${player.user_id}`;
                const dirty = state.dirty.get(key);
                const value = dirty !== undefined ? dirty : (player.points ?? '');
                return `<div class="result-player">
                    <span class="result-player-name" title="${escapeHtml(player.user_id)}">
                        ${escapeHtml(player.user_id)}
                    </span>
                    <input class="result-score${dirty !== undefined ? ' dirty' : ''}"
                        type="number" min="0" max="15" inputmode="numeric"
                        data-entry="${team.match_entry_id}" data-user="${escapeHtml(player.user_id)}"
                        value="${escapeHtml(value)}"
                        placeholder="–" ${canEdit ? '' : 'readonly'}
                        aria-label="Points for player ${escapeHtml(player.user_id)}">
                </div>`;
            }).join('') || '<p class="admin-empty">Nobody has signed up yet.</p>'}
        </div>

        ${canEdit ? `<form class="result-add-form" data-team="${escapeHtml(team.team_name)}">
            <input type="text" inputmode="numeric" placeholder="Add a player by Discord ID"
                   aria-label="Add a player by Discord user ID">
            <button class="admin-btn small" type="submit">Add</button>
        </form>` : ''}
    </section>`;
}

function renderEditor() {
    const canEdit = writable();
    const teams = state.results.teams;

    els.editor.innerHTML = teams.length
        ? `<div class="results-editor">${teams.map(team => renderTeam(team, canEdit)).join('')}</div>`
        : '<p class="admin-empty">This match has no teams attached.</p>';
}

function onScoreInput(event) {
    const { entry, user } = event.target.dataset;
    const key = `${entry}:${user}`;

    if (event.target.value === '') state.dirty.delete(key);
    else state.dirty.set(key, Number(event.target.value));

    event.target.classList.toggle('dirty', state.dirty.has(key));

    const totals = els.editor.querySelectorAll('.result-team-total');
    state.results.teams.forEach((team, index) => {
        const element = totals[index];
        if (element) element.innerHTML = totalMarkup(team, teamTotals(team));
    });

    updateDirtyFlag();
}

function updateDirtyFlag() {
    const count = state.dirty.size;
    if (els.dirtyFlag) {
        els.dirtyFlag.textContent = count ? plural(count, 'unsaved change') : '';
        els.dirtyFlag.classList.toggle('visible', count > 0);
    }
    if (els.saveButton) els.saveButton.disabled = count === 0;
}

async function onAddPlayer(event) {
    event.preventDefault();
    const input = event.currentTarget.querySelector('input');
    const userId = input.value.trim();

    if (!/^\d{17,20}$/.test(userId)) {
        note('That does not look like a Discord user ID (17-20 digits).', 'caution');
        return;
    }

    const team = state.results.teams.find(entry => entry.team_name === event.currentTarget.dataset.team);
    if (!team || team.players.some(player => String(player.user_id) === userId)) {
        note('That player is already on this team\'s list.', 'caution');
        return;
    }

    try {
        await adminFetch(`/matches/${state.matchId}/results`, {
            method: 'PUT',
            body: { results: [{ user_id: userId, points: null, match_entry_id: team.match_entry_id }] }
        });
        note(`Added ${userId} to ${team.team_name}. Give them a score and save.`, 'success');
        await loadResults();
    } catch (error) {
        note(error.message);
    }
}

async function saveResults() {
    if (!state.dirty.size) return;

    const results = [...state.dirty].map(([key, points]) => {
        const [entry, user] = key.split(':');
        return { match_entry_id: Number(entry), user_id: user, points };
    });

    try {
        await adminFetch(`/matches/${state.matchId}/results`, { method: 'PUT', body: { results } });
        state.dirty.clear();
        note(`Saved ${plural(results.length, 'score')}.`, 'success');
        await loadResults();
    } catch (error) {
        note(error.message);
    }
}

async function savePenalties() {
    const penalties = {};
    els.panel.querySelectorAll('[data-penalty]').forEach(input => {
        penalties[input.dataset.penalty] = Number(input.value) || 0;
    });

    try {
        await adminFetch(`/matches/${state.matchId}/penalties`, { method: 'PUT', body: { penalties } });
        note('Penalties saved.', 'success');
        await loadResults();
    } catch (error) {
        note(error.message);
    }
}

async function setApproved(approved) {
    const action = approved ? 'approve' : 'reject';
    try {
        await adminFetch(`/matches/${state.matchId}/results/${action}`, { method: 'POST', body: {} });
        note(approved
            ? 'Results approved and added to the standings.'
            : 'Results rejected - the teams can edit again.', 'success');
        await refresh();
    } catch (error) {
        note(error.message);
    }
}

function renderHead() {
    const match = state.match;
    const teams = match.teams.map(team => team.team_name).join(' vs ');
    const when = `${match.tournament_date} ${String(match.start_time || '').slice(0, 5)}`;

    els.head.innerHTML = `<div class="match-head">
        <div>
            <h1>${escapeHtml(teams)}</h1>
            <div class="match-head-meta">
                <span>Match #${match.match_id}</span>
                <span>${escapeHtml(when)}</span>
                <span>${escapeHtml(match.game_name || 'Unknown game')}</span>
                ${match.test_match ? '<span class="admin-pill neutral">Test match</span>' : ''}
                <span class="admin-pill ${statusTone(match.status)}">${escapeHtml(statusLabel(match.status))}</span>
            </div>
        </div>
        <div class="admin-bar-spacer"></div>
        <a class="admin-btn small" href="/admin/">&larr; All matches</a>
    </div>`;

    els.dirtyFlag = null;
    els.saveButton = null;

    if (!writable()) {
        els.actions.innerHTML = '<p class="admin-muted">Read-only view. Editing is disabled on this panel.</p>';
        return;
    }

    els.actions.innerHTML = `
        <button class="admin-btn accent" data-action="save" disabled>Save scores</button>
        <span class="dirty-flag" id="dirty-flag"></span>
        <div class="admin-bar-spacer"></div>
        <div class="penalties">
            <span class="penalties-label">Penalties</span>
            ${state.results.teams.map(team => `<label class="penalty-field">
                <span>${escapeHtml(team.team_name)}</span>
                <input class="result-score" type="number" min="0" data-penalty="${team.team_id}"
                       value="${team.penalty || 0}" aria-label="Penalty for ${escapeHtml(team.team_name)}">
            </label>`).join('')}
        </div>
        <button class="admin-btn" data-action="penalties">Save penalties</button>
        <button class="admin-btn" data-action="reject">Reject</button>
        <button class="admin-btn accent" data-action="approve">Approve results</button>`;

    els.dirtyFlag = document.getElementById('dirty-flag');
    els.saveButton = els.actions.querySelector('[data-action="save"]');
}

function renderLive() {
    if (!state.live) {
        els.livePanel.innerHTML = '';
        els.livePanel.hidden = true;
        return;
    }

    const { teams, races } = state.live;

    els.livePanel.hidden = false;
    els.livePanel.innerHTML = `<div class="admin-panel live-panel">
        <div class="admin-panel-head">
            <h3>Live score overlay</h3>
            <div class="admin-bar-spacer"></div>
            ${races.length && writable() ? '<button class="admin-btn small danger" data-live-action="clear">Clear overlay</button>' : ''}
        </div>
        ${races.length ? races.map(race => `<div class="race-row">
            <span class="race-label">Race ${race.race}</span>
            <span class="race-track">${escapeHtml(race.track || 'No track')}</span>
            ${teams.map(team => `<span class="race-positions">
                <span class="race-team">${escapeHtml(team.team_name)}</span>
                ${escapeHtml((race[String(team.team_id)] || []).join(', ') || '—')}
            </span>`).join('')}
        </div>`).join('') : '<p class="admin-empty">No races recorded yet.</p>'}
    </div>`;
}

async function loadMatch() {
    state.match = await adminFetch(`/matches/${state.matchId}`);
}

async function loadResults() {
    state.results = await adminFetch(`/matches/${state.matchId}/results`);
}

async function loadLive() {
    try {
        state.live = await adminFetch(`/matches/${state.matchId}/live-score`);
    } catch {
        state.live = null;
    }
}

async function refresh() {
    await Promise.all([loadMatch(), loadResults(), loadLive()]);
    renderHead();
    renderEditor();
    renderLive();
    updateDirtyFlag();
}

const ACTIONS = {
    save: saveResults,
    penalties: savePenalties,
    approve: () => setApproved(true),
    reject: () => setApproved(false)
};

function wireEvents() {
    els.editor.addEventListener('input', event => {
        if (event.target.classList.contains('result-score')) onScoreInput(event);
    });

    els.editor.addEventListener('submit', event => {
        if (event.target.classList.contains('result-add-form')) onAddPlayer(event);
    });

    els.actions.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (button && !button.disabled) ACTIONS[button.dataset.action]?.();
    });

    els.livePanel.addEventListener('click', async event => {
        if (!event.target.closest('[data-live-action="clear"]')) return;
        try {
            await adminFetch(`/matches/${state.matchId}/live-score`, { method: 'DELETE', body: {} });
            note('Live overlay cleared.', 'success');
            await loadLive();
            renderLive();
        } catch (error) {
            note(error.message);
        }
    });

    window.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveResults();
        }
    });

    window.addEventListener('beforeunload', event => {
        if (!state.dirty.size) return;
        event.preventDefault();
        event.returnValue = '';
    });
}

async function init() {
    cacheElements();
    wireEvents();

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id || !/^\d+$/.test(id)) {
        note('No match id in the URL. Go back and pick a match.');
        return;
    }
    state.matchId = Number(id);

    const me = await whoAmI();
    if (!me) {
        els.login.addEventListener('click', () => login());
        els.signedOut.hidden = false;
        els.panel.hidden = true;
        return;
    }

    state.me = me;
    els.signedOut.hidden = true;
    els.panel.hidden = false;
    note(accessNotice(me), 'caution');

    try {
        await refresh();
    } catch (error) {
        note(error.status === 404 ? 'That match doesn\'t exist.' : error.message);
    }
}

document.addEventListener('DOMContentLoaded', init);