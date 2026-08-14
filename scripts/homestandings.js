/*
    homestandings.js
    Generates a condensed team standings view for the homepage.
*/

const JSTeamTable = document.getElementById("HomeJSTeamTable");
const JSTeamTableLoading = document.getElementById("HomeTeamTableLoading");
const SeasonTop3 = document.getElementById("HomeSeasonTop3");
const toggleShowAllBtn = document.getElementById("toggleShowAll");

const API_BASE = 'https://api.umkl.co.uk';
const CACHE_KEY = 'teamDataCache';
const SEASON_CACHE_KEY = 'seasonInfoCache';

let allTeamsData = [];
let isExpanded = false;

const fetchAPI = async (endpoint, body) => {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const getSeasonInfoCache = () => {
    try { return JSON.parse(localStorage.getItem(SEASON_CACHE_KEY)) || {}; } catch { return {}; }
};

const fetchTeamData = async (season) => {
    return fetchAPI('teamdata', { team: "", season: `${season}` });
};

function updateToggleBtnState(totalTeams) {
    if (!toggleShowAllBtn) return;

    if (totalTeams <= 5) {
        toggleShowAllBtn.style.display = 'none';
        return;
    }

    toggleShowAllBtn.style.display = 'inline-block';
    toggleShowAllBtn.innerHTML = isExpanded ? 'Show less &#9650;' : 'Show all &#9660;';
}


const darkenColor = (color, percent = 20) => {
  if (!/^#?[0-9A-Fa-f]{6}$/.test(color)) return color;

  const num = parseInt(color.replace('#', ''), 16);
  let [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255].map(v => v / 255);

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  l = Math.max(0, l * (1 - percent / 100));

  const f = (n) => {
    const k = (n + (d === 0 ? 0 : (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4)) * 2) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };

  return `#${((1 << 24) + (f(0) << 16) + (f(8) << 8) + f(4)).toString(16).slice(1)}`;
};

const isLightColor = (color) => {
    if (!color) return false;
    const hex = color.trim().replace(/^#/, '');
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return false;
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 0xFF;
    const g = (num >> 8) & 0xFF;
    const b = num & 0xFF;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 172;
    };

async function renderHomeStandings(data) {
    if (!JSTeamTable || !SeasonTop3) return;

    allTeamsData = data;
    JSTeamTable.innerHTML = "";
    SeasonTop3.innerHTML = "";
    if (JSTeamTableLoading) JSTeamTableLoading.innerHTML = "";

    const sorted = data.slice().sort((a, b) => Number(b.team_season_points) - Number(a.team_season_points));

    const positionMap = new Map();
    let lastPoints = null, lastPosition = 0;
    for (let i = 0; i < sorted.length; i++) {
        const pts = Number(sorted[i].team_season_points);
        if (pts !== lastPoints) { lastPosition = i + 1; lastPoints = pts; }
        positionMap.set(sorted[i], lastPosition);
    }

    const podiumOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
    
    for (const team of podiumOrder) {
        const pos = positionMap.get(team);
        const name = team.team_name;
        const nameUpper = name.toUpperCase();
        const points = team.team_season_points ?? 0;
        const avif = `https://api.umkl.co.uk/teamemblems/${nameUpper}?og`;
        const dest = `/pages/teams/details/?team=${encodeURIComponent(name)}`;
        const ordinal = pos === 1 ? '1<sup>ST</sup>' : pos === 2 ? '2<sup>ND</sup>' : '3<sup>RD</sup>';

        const card = document.createElement('div');
        card.className = `podium-card pos-${pos}`;
        card.style.backgroundImage = `linear-gradient(90deg, ${team.team_color} 0%, ${darkenColor(team.team_color, 10)} 100%)`;
        card.style.color = team.team_color ? (isLightColor(team.team_color) ? 'var(--brand-dark' : 'var(--brand-light)') : '';
        card.onclick = () => window.location.href = dest;

        card.innerHTML = `
        <div class="teamStandingPattern" style="background-color: ${team.team_color};"></div>
        <div class="podium-text">
            <div class="podium-header">
                <div class="podium-pos">${ordinal}</div>
            </div>
            <div class="podium-body">
                <div class="podium-team-name">${name}</div>
                <div class="podium-pts"><strong>${points}</strong> <span>PTS</span></div>
            </div>
        </div>
        <div class="podium-emblem">
            <img class="podium-emblem" src="${avif}" alt="${name} logo" />
        </div>
        `;
        SeasonTop3.appendChild(card);
    }

    const table = document.createElement('table');
    table.className = 'standings-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th class="column-position">Pos</th>
                <th class="column-team">Team</th>
                <th class="column-played">Played</th>
                <th class="column-points">Points</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement('tbody');

    sorted.forEach((team, index) => {
        const pos = positionMap.get(team);
        const name = team.team_name;
        const nameUpper = name.toUpperCase();
        const points = team.team_season_points ?? 0;
        const avif = `https://api.umkl.co.uk/teamemblems/${nameUpper}`;
        const png = `https://api.umkl.co.uk/teamemblems/${nameUpper}?og`;
        const dest = `/pages/teams/details/?team=${encodeURIComponent(name)}`;

        const row = document.createElement('tr');
        row.className = 'standings-row';
        
        if (index >= 5 && !isExpanded) {
            row.classList.add('hidden-row');
        }

        row.onclick = () => window.location.href = dest;

        row.innerHTML = `
            <td class="column-position">${pos}</td>
            <td class="column-team">
                <div class="team-info">
                    <picture>
                        <source srcset="${avif}" type="image/avif">
                        <img class="team-logo" src="${png}" alt="${name} emblem" loading="lazy">
                    </picture>
                    <span class="team-name">${name}</span>
                </div>
            </td>
            <td class="column-played">${team.season_matches_played}</td>
            <td class="column-points"><strong>${points}</strong></td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    JSTeamTable.appendChild(table);

    updateToggleBtnState(sorted.length);
}

toggleShowAllBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    isExpanded = !isExpanded;

    const rows = document.querySelectorAll('.standings-row');
    rows.forEach((row, idx) => {
        if (idx >= 5) {
            row.classList.toggle('hidden-row', !isExpanded);
        }
    });

    updateToggleBtnState(allTeamsData.length);
});

document.addEventListener("DOMContentLoaded", async () => {
    let currentSeason = 3;
    const seasonCache = getSeasonInfoCache();
    if (seasonCache[0] != null) currentSeason = parseInt(seasonCache[0]) || 3;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed?.length > 0) renderHomeStandings(parsed);
        } catch {}
    }

    try {
        const teamData = await fetchTeamData(currentSeason);
        renderHomeStandings(teamData);
        localStorage.setItem(CACHE_KEY, JSON.stringify(teamData));
    } catch (e) {
        if (JSTeamTableLoading) {
            JSTeamTableLoading.innerHTML = `<blockquote class="fail">Failed to load standings preview.</blockquote>`;
        }
    }
});