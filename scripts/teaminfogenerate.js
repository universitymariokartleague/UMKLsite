/*
    This script generates the F1-styled team page for each team's individual page.
    It formats data into a Hero banner, Current Season stats grid, and All-Time Team Summary card.
*/

const startYear = 2023;
const currentSeason = 3;
const UPDATEINVERVAL = 30000;
let refreshTimer = null;

let viewingSeason = null;
let latestSeason = null;

const CACHE_KEY = 'teamInfoCache';

/* --- COLOR UTILITIES --- */
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

/* --- CACHE UTILITIES --- */
const getTeamCache = (team) => {
    try {
        const cached = (JSON.parse(localStorage.getItem(CACHE_KEY)) || {})[team];
        if (cached) return cached;
    } catch { }
    try {
        const teamDataCache = JSON.parse(localStorage.getItem('teamDataCache')) || [];
        return teamDataCache.find(t => t.team_name === team) || null;
    } catch { return null; }
};

const setTeamCache = (team, data) => {
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
        cache[team] = data;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { }
};

const getSeasonCache = (team, season) => {
    try { return (JSON.parse(localStorage.getItem(CACHE_KEY)) || {})[`${team}_s${season}`] || null; } catch { return null; }
};

const setSeasonCache = (team, season, data) => {
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
        cache[`${team}_s${season}`] = data;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { }
};

/* --- FORMATTERS --- */
const makePossessive = name =>
    !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

function toOrdinal(n) {
    if (!n) return 'N/A';
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    switch (v % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
    }
}

function formatChampionshipSeasons(championshipYears) {
    if (!Array.isArray(championshipYears) || championshipYears.length === 0) {
        return '';
    }
    const seasons = championshipYears.map(year => `${startYear + year}-${String(startYear + year + 1).slice(-2)}`);
    return `(${seasons.join(', ')})`;
}

/* --- RENDERERS --- */
function renderSeasonStats(seasonData) {
    const grid = document.getElementById('seasonStatsGrid');
    if (!grid) return;

    if (!seasonData) {
        grid.innerHTML = `<p style="grid-column: span 2; opacity: 0.6;">No season statistics available.</p>`;
        return;
    }

    const winsLosses = seasonData.season_wins_losses ? `${seasonData.season_wins_losses[0]} - ${seasonData.season_wins_losses[1]}` : 'N/A';
    const posFormatted = seasonData.season_position ? toOrdinal(seasonData.season_position) : 'N/A';

    grid.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Season Position</span>
            <span class="stat-value">${posFormatted}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Season Points</span>
            <span class="stat-value">${seasonData.team_season_points ?? 0}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Matches Played</span>
            <span class="stat-value">${seasonData.season_matches_played ?? 0}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Record (W - L)</span>
            <span class="stat-value">${winsLosses}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Penalties</span>
            <span class="stat-value">${seasonData.season_penalties || 'None'}</span>
        </div>
    `;
}

function renderTeamSummary(teamData) {
    const summaryList = document.getElementById('teamSummaryList');
    if (!summaryList) return;

    const locationHTML = teamData.team_place 
        ? `<a href="https://www.google.com/maps/search/?q=${encodeURIComponent(teamData.team_place)}" target="_blank" rel="noopener noreferrer" style="color:${teamData.team_color}">${teamData.team_place}</a>` 
        : 'N/A';

    const entryYearStr = teamData.first_entry ? `Season ${teamData.first_entry} (${startYear + teamData.first_entry}-${String(startYear + 1 + teamData.first_entry).slice(-2)})` : 'N/A';
    const championshipsStr = `${teamData.team_championships || 0} ${formatChampionshipSeasons(teamData.championship_seasons)}`;
    const careerWL = teamData.career_wins_losses ? `${teamData.career_wins_losses[0]} - ${teamData.career_wins_losses[1]}` : 'N/A';

    summaryList.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Institution</span>
            <span class="summary-value">${teamData.team_full_name || teamData.team_name}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Location</span>
            <span class="summary-value">${locationHTML}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">First Entry</span>
            <span class="summary-value">${entryYearStr}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Championships</span>
            <span class="summary-value">${championshipsStr}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Lifetime Matches</span>
            <span class="summary-value">
        <a href="/pages/results/details/?team=${encodeURIComponent(teamData.team_name)}" title="View all matches for ${teamData.team_name}">
            ${teamData.lifetime_matches_played ?? 0} (View All)
        </a>
            </span>
        </div>  
        <div class="summary-row">
            <span class="summary-label">Lifetime Record</span>
            <span class="summary-value">${careerWL}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Lifetime Points</span>
            <span class="summary-value">${teamData.team_career_points ?? 0}</span>
        </div>
    `;
}

function generateTeamBox(teamData, showError) {
    const teamNameUpper = teamData.team_name.toUpperCase();
    const logoUrl = `https://api.umkl.co.uk/teamemblems/${teamNameUpper}?og`;

    latestSeason = teamData.season;
    viewingSeason = latestSeason;
    
    const teamHero = document.getElementById('teamHero');
    const heroPattern = document.getElementById('heroPattern')
    if (teamHero) {
        teamHero.style.backgroundImage = `linear-gradient(0deg, ${teamData.team_color} 0%, ${darkenColor(teamData.team_color)} 100%)`;
        heroPattern.style.backgroundColor = teamData.team_color;
    }

    const heroLogo = document.getElementById('teamHeroLogo');
    if (heroLogo) {
        heroLogo.src = logoUrl;
        heroLogo.alt = `${makePossessive(teamData.team_name)} team logo`;
    }

    const teamNameBox = document.getElementById('teamNameBox');
    if (teamNameBox) teamNameBox.textContent = teamData.team_name;
    if (isLightColor(teamData.team_color)) teamNameBox.style.color = 'var(--brand-dark)'

    // Build Season Dropdown Selector
    const minSeason = teamData.first_entry;
    const hasPlayed = !!minSeason;
    const selectWrapper = document.getElementById('teamSeasonSelectWrapper');
    const seasonHeading = document.getElementById('currentSeasonHeading');

    if (selectWrapper && hasPlayed) {
        if (latestSeason <= minSeason) {
            selectWrapper.innerHTML = `<span class="season-badge">Season ${latestSeason}</span>`;
        } else {
            const options = Array.from(
                { length: latestSeason - minSeason + 1 },
                (_, i) => minSeason + i
            ).map(s => `<option value="${s}"${s === latestSeason ? ' selected' : ''}>Season ${s}</option>`).join('');
            selectWrapper.innerHTML = `<select id="team-season-select">${options}</select>`;
        }
    }

    // Render Stats Grids
    renderSeasonStats(hasPlayed ? teamData : null);
    renderTeamSummary(teamData);

    // Event Listener for Season Switch
    const seasonSelect = document.getElementById('team-season-select');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', async function () {
            const season = parseInt(this.value);
            viewingSeason = season;

            if (seasonHeading) seasonHeading.textContent = `SEASON ${season}`;

            if (season === latestSeason) {
                renderSeasonStats(teamData);
                return;
            }

            const teamName = new URLSearchParams(window.location.search).get('team');
            const cached = getSeasonCache(teamName, season);
            if (cached) renderSeasonStats(cached);

            try {
                const data = await getPlayerdata(teamName, `${season}`);
                setSeasonCache(teamName, season, data[0]);
                if (viewingSeason === season) {
                    renderSeasonStats(data[0]);
                }
            } catch (error) {
                console.debug(`%cteaminfogenerate.js %c> %cFailed to fetch season ${season} data: ${error.message}`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
                if (!cached) renderSeasonStats(null);
            }
        });
    }

    // Championship Banner / Confetti
    if (teamData.championship_seasons?.includes(currentSeason)) {
        if (!document.getElementById('champion-banner')) {
            const banner = document.createElement('blockquote');
            banner.id = 'champion-banner';
            banner.className = 'champion';
            banner.innerHTML = `<b>Season ${currentSeason} Champions!</b><br>Congratulations to ${teamData.team_name} on winning Season ${currentSeason} of the UMKL!`;
            document.querySelector('main')?.insertBefore(banner, document.querySelector('.stats-section'));
            spawnConfetti();
        }
    }

    showErrorBox(showError);
}

function editTeamBox(teamData) {
    renderTeamSummary(teamData);
    if (viewingSeason === teamData.season && teamData.first_entry) {
        renderSeasonStats(teamData);
    }
}

function showErrorBox(showError) {
    let errorBlock = document.getElementById("team-api-error");
    const mainElem = document.querySelector("main");

    if (showError === 1 || showError === 2) {
        if (!errorBlock) {
            errorBlock = document.createElement("blockquote");
            errorBlock.className = "fail";
            errorBlock.id = "team-api-error";
            mainElem?.prepend(errorBlock);
        }
        if (showError === 1) {
            const retryMsg = window.retryCount ? `<b>API error - Retrying: attempt ${window.retryCount}</b><br>` : "<b>API error</b><br>";
            errorBlock.innerHTML = `${retryMsg}Failed to fetch team data from the API, the below information may not be up to date!`;
        } else {
            errorBlock.innerHTML = "<b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.";
        }
    } else if (errorBlock) {
        errorBlock.remove();
    }
}

/* --- CONFETTI ANIMATION --- */
function spawnConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const colors = ['#FFD700', '#FFC200', '#FFB800', '#FFE066', '#FFF3A3', '#FFFFFF'];
    const countStart = Math.round(window.innerWidth / 12);
    const countEnd = Math.round(countStart * 0.5);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const onResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const makeParticle = () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 1.5 + 0.5,
        drift: (Math.random() - 0.5) * 0.8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
        dying: false,
    });

    const particles = Array.from({ length: countStart }, makeParticle);

    setTimeout(() => {
        let excess = particles.length - countEnd;
        for (let i = particles.length - 1; i >= 0 && excess > 0; i--, excess--) {
            particles[i].dying = true;
        }
    }, 1000);

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            ctx.save();
            ctx.globalAlpha = 0.75;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();

            p.y += p.speed;
            p.x += p.drift;
            p.angle += p.spin;

            if (p.y > canvas.height + 10) {
                if (p.dying) {
                    particles.splice(i, 1);
                } else {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
            }
        }

        if (particles.length > 0) {
            requestAnimationFrame(draw);
        } else {
            window.removeEventListener('resize', onResize);
            canvas.remove();
        }
    }

    requestAnimationFrame(draw);
}

/* --- API FETCH --- */
async function getPlayerdata(team = "", season = "") {
    const response = await fetch('https://api.umkl.co.uk/teamdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, season })
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { error: `HTTP error! status: ${response.status}` };
        }
        throw errorData;
    }

    return response.json();
}

/* --- INITIALIZATION --- */
document.addEventListener("DOMContentLoaded", async () => {
    const startTime = performance.now();
    console.debug(`%cteaminfogenerate.js %c> %cGenerating team info page`, "color:#d152ff", "color:#fff", "color:#e6a1ff");

    const urlParams = new URLSearchParams(window.location.search);
    const currentTeam = urlParams.get('team');

    if (!currentTeam) {
        window.location.href = "/pages/teams";
        return;
    }

    document.title = `${currentTeam} | UMKL`;

    let showError = 0;
    let playerData = [];
    const cachedData = getTeamCache(currentTeam);

    if (cachedData) {
        console.debug(`%cteaminfogenerate.js %c> %cGenerating team info box (cache)...`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
        generateTeamBox(cachedData, 0);
    }

    try {
        playerData = await getPlayerdata(currentTeam);
        setTeamCache(currentTeam, playerData[0]);
        if (cachedData) {
            editTeamBox(playerData[0]);
        } else {
            generateTeamBox(playerData[0], 0);
        }
    } catch (error) {
        if (error?.error === "Team not found" || error?.error === "Team not enabled") {
            window.location.href = "/pages/teams";
            return;
        }
        console.debug(`%cteaminfogenerate.js %c> %cFailed to fetch team data: ${error.message}`, "color:#d152ff", "color:#fff", "color:#e6a1ff");

        showError = error?.message?.includes('429') ? 2 : 1;

        if (!cachedData) {
            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    window.retryCount = (window.retryCount ?? 0) + 1;
                    playerData = await getPlayerdata(currentTeam);
                    setTeamCache(currentTeam, playerData[0]);
                    showError = 0;
                    generateTeamBox(playerData[0], showError);
                } catch {
                    showErrorBox(showError);
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }

        showErrorBox(showError);
    }

    if (refreshTimer) clearTimeout(refreshTimer);
    const updateFetch = async () => {
        try {
            console.debug(`%cteaminfogenerate.js %c> %cRefreshing live data...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
            playerData = await getPlayerdata(currentTeam);
            setTeamCache(currentTeam, playerData[0]);
            showError = 0;
            editTeamBox(playerData[0]);
            showErrorBox(showError);
        } catch (error) {
            showError = error?.message?.includes('429') ? 2 : 1;
            showErrorBox(showError);
        } finally {
            refreshTimer = setTimeout(updateFetch, UPDATEINVERVAL);
        }
    };
    refreshTimer = setTimeout(updateFetch, UPDATEINVERVAL);

    console.debug(`%cteaminfogenerate.js %c> %cGenerated team page in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
});