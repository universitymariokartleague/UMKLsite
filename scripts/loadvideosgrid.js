const API_URL = `https://api.umkl.co.uk/videos`;
const SKELETON_CARD_COUNT = 12;

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

async function loadVideosGrid() {
    const container = document.getElementById("videosGridContainer");
    if (!container) return;

    renderVideosGridSkeleton(container);

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos found.</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        const locale = localStorage.getItem("locale") || "en-GB";

        data.forEach(item => {
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
                    <img src="${thumbnailUrl}" alt="${title}" loading="lazy" />
                    <div class="play-icon-overlay">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
                <h3 class="video-title no-color-link">${title}</h3>
                ${dateStr ? `<p class="video-date">${dateStr}</p>` : ""}
            `;

            fragment.appendChild(card);
        });

        container.innerHTML = "";
        container.appendChild(fragment);

    } catch (error) {
        console.error("Error loading UMKL YouTube videos grid:", error);
        container.innerHTML = `<p class="carousel-loading">Failed to load videos.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadVideosGrid);
