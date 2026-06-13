/*
    This script generates the team info page for each team's individual page.
    It is similar to teamboxgenerate.js, but it focuses on displaying detailed information
    about a specific team, including their logo, location, institution,
    championships, wins-losses, and lifetime points. HTML elements are created dynamically.
*/

const teamBoxFormatHTML = `
    <div class="team-info-wrapper">
        <a href="{{highResSrc}}">
            <picture>
                <source srcset="{{logoSrcAvif}}" type="image/avif">
                <img width=200 height=200 src="{{logoSrc}}" alt="{{teamNamePossessive}} team logo" title="{{teamNamePossessive}} team logo\nClick to view a high-res version of this logo" class="team-info-logo" loading="lazy"
                onload="this.style.opacity=1" onerror="this.onerror=null; this.src='{{placeholderLogo}}'; this.parentNode.querySelector('source').srcset='{{placeholderLogoAvif}}';"/>
            </picture>
        </a>
        <div class="team-info-text">
            {{extraFields}}
        </div>
        <div class="current-season-info">
            <div class="heading-wrapper">
                <h2>Stats for</h2> <span style="margin-left: 8px">{{seasonHeading}}</span>
                <div class="live-dot"></div>
            </div>
            <div class="team-info-text">
                {{currentFields}}
            </div>
        </div>
    </div>

    {{mapHTML}}
`;

const mapDefaultHTML = `
    <div class="map">
        <iframe id="teamMapIFrame" title="A map of the UK showing the location of all the UMKL teams" src="pages/map/index.html?team={{teamName}}" frameborder="0"></iframe>
    </div>
`

const mapMobileHTML = `
    <details class="details-box">
        <summary>
            Open map
        </summary>
        <div class="map">
            <iframe id="teamMapIFrame" title="A map of the UK showing the location of all the UMKL teams" src="pages/map/index.html?team={{teamName}}" frameborder="0"></iframe>
        </div>
    </details>
`

const JSTeamBox = document.getElementById("JSTeamBox")
const teamNameBox = document.getElementById("teamNameBox")
const startYear = 2023;

const currentSeason = 2;

const UPDATEINVERVAL = 30000;
let refreshTimer = null;

let viewingSeason = null;
let latestSeason = null;

const CACHE_KEY = 'teamInfoCache';

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

const makePossessive = name =>
    !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

function formatChampionshipSeasons(championshipYears) {
    if (!Array.isArray(championshipYears) || championshipYears.length === 0) {
        return '';
    }

    const seasons = championshipYears.map(year => `${startYear + year}-${String(startYear + year + 1).slice(-2)}`);
    return `(${seasons.join(',<br>')})`;
}

function buildTeamInfoTable(teamData, isCurrent = false) {
    if (isCurrent) {
        return `
            <table class="team-info-table">
                <tr><td class="table-key">Matches Played</td><td>${teamData.season_matches_played}</td></tr>
                <tr><td class="table-key">Wins/Losses</td><td>${teamData.season_wins_losses[0]} - ${teamData.season_wins_losses[1]} ${teamData.team_season_points > 0 ? `(${toOrdinal(teamData.season_position)})` : ''}</td></tr>
                <tr><td class="table-key">Points</td><td>${teamData.team_season_points}</td></tr>
                <tr><td class="table-key">Penalties</td><td>${teamData.season_penalties || 'None'}</td></tr>
            </table>
        `;
    }

    return `
        <table class="team-info-table">
            ${teamData.team_place ? `<tr><td class="table-key">Location</td><td>${teamData.team_place}</td></tr>` : ''}
            <tr><td class="table-key">Institution</td><td>${teamData.team_full_name}</td></tr>
            <tr><td class="table-key">First Entry</td><td>${teamData.first_entry ? `Season ${teamData.first_entry}` : `N/A`} <span class="settings-extra-info">${teamData.first_entry ? `(${startYear + teamData.first_entry}-${String(startYear + 1 + teamData.first_entry).slice(-2)})` : ''}</span></td></tr>
            <tr><td class="table-key">Season Wins</td><td>${teamData.team_championships} <span class="settings-extra-info">${formatChampionshipSeasons(teamData.championship_seasons)}</span></td></tr>
            <tr><td class="table-key">Lifetime<br>Matches Played</td><td>${teamData.lifetime_matches_played}</td></tr>
            <tr><td class="table-key">Lifetime<br>Wins/Losses</td><td>${teamData.career_wins_losses[0]} - ${teamData.career_wins_losses[1]}</td></tr>
            <tr><td class="table-key">Lifetime Points</td><td>${teamData.team_career_points}</td></tr>
        </table>
    `;
}

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

function generateTeamBox(teamData, showError) {
    JSTeamBox.innerHTML = "";
    JSTeamBox.classList.remove('fade-in');

    const placeholderLogoAvif = "assets/media/teamemblems/DEFAULT.avif";
    const placeholderLogoPng = "assets/media/teamemblems/og/DEFAULT.png";
    const teamNameUpper = teamData.team_name.toUpperCase();
    const logoUrl = `assets/media/teamemblems/og/${teamNameUpper}.png`;
    const logoUrlAvif = `assets/media/teamemblems/hres/${teamNameUpper}.avif`;

    latestSeason = teamData.season;
    viewingSeason = latestSeason;

    const minSeason = teamData.first_entry || 1;
    let seasonHeading;
    if (latestSeason <= minSeason) {
        seasonHeading = `<h2>Season ${latestSeason}</h2>`;
    } else {
        const options = Array.from(
            { length: latestSeason - minSeason + 1 },
            (_, i) => minSeason + i
        ).map(s => `<option value="${s}"${s === latestSeason ? ' selected' : ''}>Season ${s}</option>`).join('');
        seasonHeading = `<select id="team-season-select">${options}</select>`;
    }

    const tempTeamBox = teamBoxFormatHTML
        .replace("{{mapHTML}}", window.innerWidth > 767 ? mapDefaultHTML : mapMobileHTML)
        .replace("{{seasonHeading}}", seasonHeading)
        .replaceAll("{{teamName}}", teamData.team_name)
        .replaceAll("{{teamNamePossessive}}", makePossessive(teamData.team_name))
        .replace("{{logoSrc}}", logoUrl)
        .replace("{{logoSrcAvif}}", logoUrlAvif)
        .replace("{{highResSrc}}", logoUrl)
        .replace("{{placeholderLogo}}", placeholderLogoPng)
        .replace("{{placeholderLogoAvif}}", placeholderLogoAvif)
        .replace("{{extraFields}}", buildTeamInfoTable(teamData))
        .replace("{{currentFields}}", buildTeamInfoTable(teamData, true));

    document.documentElement.style.setProperty('--highlight-color', `${teamData.team_color}80`);
    document.documentElement.style.setProperty('--team-color', teamData.team_color);
    JSTeamBox.innerHTML = tempTeamBox;
    JSTeamBox.classList.add('fade-in');

    const seasonSelect = JSTeamBox.querySelector('#team-season-select');
    const liveDot = JSTeamBox.querySelector('.live-dot');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', async function () {
            const season = parseInt(this.value);
            viewingSeason = season;
            if (liveDot) liveDot.style.display = season === latestSeason ? '' : 'none';

            const currentSeasonInfo = JSTeamBox.querySelector('.current-season-info .team-info-text');
            if (!currentSeasonInfo) return;

            if (season === latestSeason) {
                currentSeasonInfo.innerHTML = buildTeamInfoTable(teamData, true);
                return;
            }

            const teamName = new URLSearchParams(window.location.search).get('team');
            const cached = getSeasonCache(teamName, season);
            if (cached) currentSeasonInfo.innerHTML = buildTeamInfoTable(cached, true);

            try {
                const data = await getPlayerdata(teamName, `${season}`);
                setSeasonCache(teamName, season, data[0]);
                if (viewingSeason === season) {
                    currentSeasonInfo.innerHTML = buildTeamInfoTable(data[0], true);
                }
            } catch (error) {
                console.debug(`%cteaminfogenerate.js %c> %cFailed to fetch season ${season} data: ${error.message}`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
                if (!cached) currentSeasonInfo.innerHTML = `<p>Failed to load Season ${season} data.</p>`;
            }
        });
    }

    JSTeamBox.querySelector('details')?.addEventListener('toggle', function () {
        if (this.open) {
            const iframe = this.querySelector('iframe');
            if (iframe) {
                iframe.style.width = '50%';
                requestAnimationFrame(() => { iframe.style.width = '100%'; });
            }
        }
    });

    if (teamData.championship_seasons?.includes(currentSeason)) {
        if (!document.getElementById('champion-banner')) {
            const banner = document.createElement('blockquote');
            banner.id = 'champion-banner';
            banner.className = 'champion';
            banner.innerHTML = `<b>Season ${currentSeason} Champions!</b><br>Congratulations to ${teamData.team_name} on winning Season ${currentSeason} of the UMKL!`;
            document.querySelector('main')?.insertBefore(banner, JSTeamBox);
            spawnConfetti();
        }
    }

    let liveDotStyle = document.getElementById('live-dot-style');
    if (!liveDotStyle) {
        liveDotStyle = document.createElement('style');
        liveDotStyle.id = 'live-dot-style';
        document.head.appendChild(liveDotStyle);
    }
    liveDotStyle.textContent = `
        .live-dot {
            background-color: ${teamData.team_color};
            box-shadow: 0 0 0 0 ${teamData.team_color}80;
        }
        @keyframes live-dot-pulse {
            0% {
                box-shadow: 0 0 0 0 ${teamData.team_color}80;
            }
            70% {
                box-shadow: 0 0 0 8px ${teamData.team_color}00;
            }
            100% {
                box-shadow: 0 0 0 0 ${teamData.team_color}00;
            }
        }
    `;

    showErrorBox(showError);
}

function editTeamBox(teamData) {
    const currentSeasonInfo = JSTeamBox.querySelector('.current-season-info .team-info-text');
    const extraFieldsInfo = JSTeamBox.querySelector('.team-info-text');
    if (!currentSeasonInfo || !extraFieldsInfo) return;

    extraFieldsInfo.innerHTML = buildTeamInfoTable(teamData);
    if (viewingSeason === teamData.season) {
        currentSeasonInfo.innerHTML = buildTeamInfoTable(teamData, true);
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
            const hr = mainElem?.querySelector('hr');
            if (hr) hr.after(errorBlock);
            else mainElem?.prepend(errorBlock);
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

function toOrdinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    switch (v % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
    }
}

async function getPlayerdata(team = "", season = "") {
    const response = await fetch('https://api.umkl.co.uk/teamdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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

document.addEventListener("DOMContentLoaded", async () => {
    const startTime = performance.now();
    console.debug(`%cteaminfogenerate.js %c> %cGenerating team info box`, "color:#d152ff", "color:#fff", "color:#e6a1ff");

    const urlParams = new URLSearchParams(window.location.search);
    const currentTeam = urlParams.get('team');
    document.title = `${currentTeam} | UMKL`;
    teamNameBox.innerText = currentTeam;

    const backButton = document.getElementById("backButton");
    if (backButton) {
        const referrer = document.referrer;
        if (referrer.includes("/teams/") || referrer.includes("/matches/")) {
            backButton.href = "javascript:history.back()";
        }
    }

    if (!currentTeam) {
        window.location.href = "/pages/teams";
        return;
    }

    let showError = 0;
    let playerData = [];
    const cachedData = getTeamCache(currentTeam);

    if (cachedData) {
        console.debug(`%cteaminfogenerate.js %c> %cGenerating team info box (cache)...`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
        generateTeamBox(cachedData, 0);
    } else {
        JSTeamBox.innerHTML = "Loading team information...";
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

    console.debug(`%cteaminfogenerate.js %c> %cGenerated team info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#d152ff", "color:#fff", "color:#e6a1ff");
});
