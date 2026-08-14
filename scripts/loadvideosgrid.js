const API_URL = `https://api.umkl.co.uk/videos`;
const SKELETON_CARD_COUNT = 12;

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

function getRoundNumber(item) {
    const roundMatch = item.title?.match(/Round\s*(\d+)/i);
    return roundMatch ? parseInt(roundMatch[1], 10) : null;
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

    list.forEach((item, index) => {
        const season = getVideoSeason(item);

        if (index > 0) {
            if (season != null && season !== lastSeason) {
                fragment.appendChild(createDivider(`Season ${season}`));
            } else if (pendingDivider) {
                fragment.appendChild(createDivider(pendingDivider.label));
            }
        }
        pendingDivider = null;

        if (season != null) lastSeason = season;

        // A "Round X Matches Revealed" video is published before round X is played, so it
        // belongs with round X's own matches (published later, above it in this newest-first
        // list) - the boundary into the next, older round only starts after this card.
        if (isRoundReveal(item)) {
            const roundNumber = getRoundNumber(item);
            const label = roundNumber != null && roundNumber > 1 ? `Round ${roundNumber - 1}` : undefined;
            pendingDivider = { label };
        }

        fragment.appendChild(buildVideoCard(item, locale, searchTerm));
    });

    container.innerHTML = "";
    container.appendChild(fragment);
}

function matchesSearch(item, term) {
    if (!term) return true;
    const title = (item.title || item.match?.title || "").toLowerCase();
    const teams = (item.match?.teams_involved || []).join(" ").toLowerCase();
    return title.includes(term) || teams.includes(term);
}

function setupVideoSearch(container) {
    const searchInput = document.getElementById("videos-search");
    const noResultsMsg = document.getElementById("videos-no-results");
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const term = e.target.value.trim().toLowerCase();
            const filtered = allVideos.filter(item => matchesSearch(item, term));

            renderVideos(container, filtered, term);
            if (noResultsMsg) noResultsMsg.style.display = filtered.length === 0 ? "block" : "none";
        }, 50);
    });
}

async function loadVideosGrid() {
    const container = document.getElementById("videosGridContainer");
    if (!container) return;

    renderVideosGridSkeleton(container);
    setupVideoSearch(container);

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos found.</p>`;
            return;
        }

        allVideos = data;
        renderVideos(container, allVideos);

    } catch (error) {
        console.error("Error loading UMKL YouTube videos grid:", error);
        container.innerHTML = `<p class="carousel-loading">Failed to load videos.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadVideosGrid);
