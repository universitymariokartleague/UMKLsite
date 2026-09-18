const API_URL = `https://api.umkl.co.uk/videos`;
const DEFAULT_VIDEO_COUNT = 12;
const TEAM_VIDEO_COUNT = 7;
const RETRY_DELAY_MS = 5000;
const RETRY_MAX_DELAY_MS = 30000;

function renderVideoCarouselSkeleton(container, count) {
    if (container.querySelector(".video-card-skeleton")) return;

    const skeletonCard = `
        <div class="video-card video-card-skeleton" aria-hidden="true">
            <div class="video-thumb-wrapper skeleton"></div>
            <p class="video-title skeleton"></p>
            <p class="video-date skeleton"></p>
        </div>
    `;
    container.innerHTML = skeletonCard.repeat(count);
}

async function fetchVideos() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function fetchVideosWithRetry() {
    let delay = RETRY_DELAY_MS;
    for (; ;) {
        try {
            return await fetchVideos();
        } catch (error) {
            console.error("Error fetching YouTube playlist, retrying:", error);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, RETRY_MAX_DELAY_MS);
        }
    }
}

async function loadVideoCarousel() {
    const container = document.getElementById("videoCarousel");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");

    if (!container) return;

    const teamFilter = new URLSearchParams(window.location.search).get("team");
    const videoCount = teamFilter ? TEAM_VIDEO_COUNT : DEFAULT_VIDEO_COUNT;

    renderVideoCarouselSkeleton(container, videoCount + 1);

    try {
        const data = await fetchVideosWithRetry();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos available.</p>`;
            return;
        }

        const videos = teamFilter
            ? data.filter(item => (item.match?.teams_involved || []).some(team => team.toLowerCase() === teamFilter.toLowerCase()))
            : data;

        if (videos.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos available for this team yet.</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        const locale = localStorage.getItem("locale") || "en-GB";

        videos.slice(0, videoCount).forEach(item => {
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
                    <img src="https://wsrv.nl/?height=300&q=50&output=webp&url=${thumbnailUrl}" alt="${title}" loading="lazy" />
                </div>
                <p class="video-title no-color-link"><i class="fa-solid fa-play"></i> ${title}</p>
                ${dateStr ? `<p class="video-date">${dateStr}</p>` : ""}
            `;

            fragment.appendChild(card);
        });

        const showMoreCard = document.createElement("a");
        showMoreCard.className = "video-card video-card-more";
        showMoreCard.href = teamFilter ? `/videos/?search=${encodeURIComponent(teamFilter)}` : "/videos/";
        showMoreCard.innerHTML = `
            <div class="video-thumb-wrapper video-more-thumb">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="6.78" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="6.5" y="6.78" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="12.5" y="6.78" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="18.5" y="6.78" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="0.5" y="10.59" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="6.5" y="10.59" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="12.5" y="10.59" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="18.5" y="10.59" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="0.5" y="14.4" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="6.5" y="14.4" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="12.5" y="14.4" width="5" height="2.81" rx="0.5"></rect>
                    <rect x="18.5" y="14.4" width="5" height="2.81" rx="0.5"></rect>
                </svg>
            </div>
            <p class="video-title no-color-link">View more videos</p>
        `;
        fragment.appendChild(showMoreCard);

        container.innerHTML = "";
        container.appendChild(fragment);

        if (prevBtn && nextBtn) {
            const scrollByCards = (direction) => {
                const card = container.querySelector(".video-card");
                if (!card) return;
                const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
                const cardWidth = card.getBoundingClientRect().width + gap;
                const visibleCount = Math.max(1, Math.floor(container.clientWidth / cardWidth));
                container.scrollBy({ left: direction * cardWidth * visibleCount, behavior: "smooth" });
            };

            prevBtn.addEventListener("click", () => scrollByCards(-1));
            nextBtn.addEventListener("click", () => scrollByCards(1));
        }

    } catch (error) {
        console.error("Error fetching YouTube playlist:", error);
        container.innerHTML = `<p class="carousel-loading">Failed to load videos.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadVideoCarousel);
