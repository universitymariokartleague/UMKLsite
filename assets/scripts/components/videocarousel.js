const API_URL = `https://api.umkl.co.uk/videos`;
const SKELETON_CARD_COUNT = 6;
const RETRY_DELAY_MS = 5000;
const RETRY_MAX_DELAY_MS = 30000;

function renderVideoCarouselSkeleton(container) {
    if (container.querySelector(".video-card-skeleton")) return;

    const skeletonCard = `
        <div class="video-card video-card-skeleton" aria-hidden="true">
            <div class="video-thumb-wrapper skeleton"></div>
            <p class="video-title skeleton"></p>
            <p class="video-date skeleton"></p>
        </div>
    `;
    container.innerHTML = skeletonCard.repeat(SKELETON_CARD_COUNT);
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

    renderVideoCarouselSkeleton(container);

    try {
        const data = await fetchVideosWithRetry();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos available.</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        const locale = localStorage.getItem("locale") || "en-GB";

        data.slice(0, 10).forEach(item => {
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
                    <img src="https://wsrv.nl/?height=300&q=50&url=${thumbnailUrl}" alt="${title}" loading="lazy" />
                    <div class="play-icon-overlay">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
                <p class="video-title no-color-link">${title}</p>
                ${dateStr ? `<p class="video-date">${dateStr}</p>` : ""}
            `;

            fragment.appendChild(card);
        });

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
