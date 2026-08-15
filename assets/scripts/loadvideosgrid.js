const API_URL = `https://api.umkl.co.uk/videos`;
const SKELETON_CARD_COUNT = 12;

const MAX_TAGS = 12;
const TEST_MATCH_TAG = "Test Match";

let allVideos = [];

function renderVideosGridSkeleton(container) {
    const skeletonCard = `
        <div class="video-card video-card-skeleton" aria-hidden="true">
            <div class="video-thumb-wrapper skeleton"></div>
            <div class="skeleton skeleton-line" style="width:90%;"></div>
            <div class="skeleton skeleton-line" style="width:55%; margin-top:6px;"></div>
            <div class="skeleton skeleton-line" style="width:35%; height:10px; margin-top:8px;"></div>
        </div>
    `;
    container.innerHTML = skeletonCard.repeat(SKELETON_CARD_COUNT);
}

function getVideoSeason(item) {
    if (item.match?.season != null) return item.match.season;
    const seasonMatch = item.title?.match(/Season\s*(\d+)/i);
    return seasonMatch ? parseInt(seasonMatch[1], 10) : null;
}

function isRoundReveal(item) {
    return !item.match && /Round\s*\d+/i.test(item.title || "");
}

function isTestMatch(item) {
    return /\(Test Match\)/i.test(item.title || "");
}

function getRoundNumber(item) {
    const roundMatch = item.title?.match(/Round\s*(\d+)/i);
    return roundMatch ? parseInt(roundMatch[1], 10) : null;
}

// sort videos by seasons and rounds
function computeEffectiveSeasons(list) {
    let forcedSeason = null;
    list.forEach(item => {
        const reveal = isRoundReveal(item);
        const season = (forcedSeason != null && !reveal) ? forcedSeason : getVideoSeason(item);
        if (reveal) forcedSeason = null;

        item._effectiveSeason = season;

        if (reveal) {
            const roundNumber = getRoundNumber(item);
            if (roundNumber === 1 && season != null) forcedSeason = season - 1;
        }
    });
}

// builds date search terms
function getDateSearchText(item) {
    if (!item.published) return "";
    const date = new Date(item.published);
    if (isNaN(date.getTime())) return "";

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayPad = String(day).padStart(2, '0');
    const monthPad = String(month).padStart(2, '0');
    const monthLong = date.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase();
    const monthShort = date.toLocaleDateString('en-GB', { month: 'short' }).toLowerCase();

    return [
        `${year}-${monthPad}-${dayPad}`,   // 2026-04-23
        `${dayPad}/${monthPad}/${year}`,   // 23/04/2026
        `${dayPad}-${monthPad}-${year}`,   // 23-04-2026
        `${monthPad}/${dayPad}`,           // 04/23
        `${monthPad}-${dayPad}`,           // 04-23
        `${dayPad}/${monthPad}`,           // 23/04
        `${dayPad}-${monthPad}`,           // 23-04
        `${day}/${month}`,                 // 23/4
        `${day}-${month}`,                 // 23-4
        `${day} ${monthLong} ${year}`,     // 23 april 2026
        `${day} ${monthShort} ${year}`,    // 23 apr 2026
        `${monthLong} ${day}`,             // april 23
        `${monthShort} ${day}`,            // apr 23
        monthLong,                         // april
        monthShort,                        // apr
        String(year),                      // 2026
    ].join(' ');
}

function precomputeSearchData(list) {
    computeEffectiveSeasons(list);
    list.forEach(item => { item._dateSearchText = getDateSearchText(item); });
}

function createDivider(label) {
    const div = document.createElement("div");
    div.className = "videos-divider";
    div.innerHTML = label ? `<hr><span class="videos-divider-label">${label}</span>` : `<hr>`;
    return div;
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, term) {
    const escaped = escapeHTML(text);
    if (!term) return escaped;
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function buildVideoCard(item, locale, searchTerm) {
    const thumbnailUrl = item.thumbnail || `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`;
    const title = item.title || item.match?.title || "UMKL Video";
    const date = item.published ? new Date(item.published) : null;
    const dateStr = date ? date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "";

    const card = document.createElement("a");
    card.className = "video-card";
    card.href = item.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    card.innerHTML = `
        <div class="video-thumb-wrapper">
            <img src="${thumbnailUrl}" alt="${escapeHTML(title)}" loading="lazy" />
            <div class="play-icon-overlay">
                <i class="fa-solid fa-play"></i>
            </div>
        </div>
        <h3 class="video-title no-color-link">${highlightMatch(title, searchTerm)}</h3>
        ${dateStr ? `<p class="video-date">${dateStr}</p>` : ""}
    `;

    return card;
}

function renderVideos(container, list, searchTerm = "") {
    const locale = localStorage.getItem("locale") || "en-GB";
    const fragment = document.createDocumentFragment();
    let lastSeason;
    let pendingDivider = null; // divider to insert before the next item, carried over from the previous one

    const currentRoundReveal = list.find(isRoundReveal);
    if (currentRoundReveal) {
        const currentRound = getRoundNumber(currentRoundReveal);
        const currentSeason = currentRoundReveal._effectiveSeason;
        if (currentRound != null) {
            fragment.appendChild(createDivider(currentSeason != null ? `Season ${currentSeason} Round ${currentRound}` : `Round ${currentRound}`));
        }
    }

    list.forEach((item, index) => {
        const season = item._effectiveSeason;

        if (index > 0) {
            if (season != null && season !== lastSeason) {
                fragment.appendChild(createDivider(`Season ${season}`));
            } else if (pendingDivider) {
                fragment.appendChild(createDivider(pendingDivider.label));
            }
        }
        pendingDivider = null;

        if (season != null) lastSeason = season;

        if (isRoundReveal(item)) {
            const roundNumber = getRoundNumber(item);
            if (roundNumber != null && roundNumber > 1) {
                pendingDivider = { label: season != null ? `Season ${season} Round ${roundNumber - 1}` : `Round ${roundNumber - 1}` };
            } else if (roundNumber === 1 && season != null) {
                pendingDivider = { label: `Season ${season - 1}` };
            } else {
                pendingDivider = { label: undefined };
            }
        }

        fragment.appendChild(buildVideoCard(item, locale, searchTerm));
    });

    container.innerHTML = "";
    container.appendChild(fragment);
}

function matchesSearch(item, term) {
    if (!term) return true;

    const seasonQuery = term.match(/^season\s*(\d+)$/i);
    if (seasonQuery) return item._effectiveSeason === parseInt(seasonQuery[1], 10);

    if (term === TEST_MATCH_TAG.toLowerCase()) return isTestMatch(item);

    const title = (item.title || item.match?.title || "").toLowerCase();
    const teams = (item.match?.teams_involved || []).join(" ").toLowerCase();
    if (title.includes(term) || teams.includes(term)) return true;

    return item._dateSearchText != null && item._dateSearchText.includes(term);
}

function getAvailableTags(list, limit = MAX_TAGS) {
    const counts = new Map();
    const addCount = (tag) => counts.set(tag, (counts.get(tag) || 0) + 1);

    list.forEach(item => {
        if (item._effectiveSeason != null) addCount(`Season ${item._effectiveSeason}`);
        if (isTestMatch(item)) addCount(TEST_MATCH_TAG);
        (item.match?.teams_involved || []).forEach(team => addCount(team));
    });

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([tag]) => tag);
}

function renderTags(tagsContainer, tags) {
    tagsContainer.innerHTML = "";
    tags.forEach(tag => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "videos-tag";
        btn.textContent = tag;
        btn.dataset.tag = tag;
        tagsContainer.appendChild(btn);
    });
}

function updateActiveTag(tagsContainer, term) {
    tagsContainer.querySelectorAll(".videos-tag").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tag.toLowerCase() === term);
    });
}

function setupVideoSearch(container) {
    const searchInput = document.getElementById("videos-search");
    const noResultsMsg = document.getElementById("videos-no-results");
    const clearSearchBtn = document.getElementById("videos-clear-search");
    const tagsContainer = document.getElementById("videos-tags");
    const testMatchToggle = document.getElementById("videos-test-match-toggle");
    if (!searchInput) return null;

    let showTestMatches = testMatchToggle ? testMatchToggle.checked : true;

    const runSearch = (term) => {
        const filtered = allVideos.filter(item => {
            if (!showTestMatches && isTestMatch(item)) return false;
            return matchesSearch(item, term);
        });
        renderVideos(container, filtered, term);
        if (noResultsMsg) noResultsMsg.style.display = filtered.length === 0 ? "block" : "none";
        if (tagsContainer) updateActiveTag(tagsContainer, term);
    };

    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => runSearch(e.target.value.trim().toLowerCase()), 50);
    });

    clearSearchBtn?.addEventListener("click", () => {
        searchInput.value = "";
        runSearch("");
        searchInput.focus();
    });

    tagsContainer?.addEventListener("click", (e) => {
        const btn = e.target.closest(".videos-tag");
        if (!btn) return;

        const alreadyActive = btn.classList.contains("active");
        const term = alreadyActive ? "" : btn.dataset.tag;
        searchInput.value = term;
        runSearch(term.toLowerCase());
        btn.blur();
    });

    testMatchToggle?.addEventListener("change", () => {
        showTestMatches = testMatchToggle.checked;

        // Hiding test matches while the "Test Match" tag/search is active would otherwise
        // wipe the grid to zero results, which reads as the toggle being broken rather than
        // working as intended - clear the now-contradictory filter instead.
        if (!showTestMatches && searchInput.value.trim().toLowerCase() === TEST_MATCH_TAG.toLowerCase()) {
            searchInput.value = "";
        }

        runSearch(searchInput.value.trim().toLowerCase());
    });

    return runSearch;
}

async function loadVideosGrid() {
    const container = document.getElementById("videosGridContainer");
    if (!container) return;

    renderVideosGridSkeleton(container);
    const runSearch = setupVideoSearch(container);

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos found.</p>`;
            return;
        }

        allVideos = data;
        precomputeSearchData(allVideos);
        runSearch ? runSearch("") : renderVideos(container, allVideos);

        const tagsContainer = document.getElementById("videos-tags");
        if (tagsContainer) renderTags(tagsContainer, getAvailableTags(allVideos));

    } catch (error) {
        console.error("Error loading UMKL YouTube videos grid:", error);
        container.innerHTML = `<p class="carousel-loading">Failed to load videos.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadVideosGrid);
