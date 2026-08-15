const API_URL = `https://api.umkl.co.uk/videos`;
const SKELETON_CARD_COUNT = 6;

function renderVideoCarouselSkeleton(container) {
    const skeletonCard = `
        <div class="video-card video-card-skeleton" aria-hidden="true">
            <div class="video-thumb-wrapper skeleton"></div>
            <div class="skeleton skeleton-line" style="width:90%;"></div>
            <div class="skeleton skeleton-line" style="width:35%; height:10px; margin-top:8px;"></div>
        </div>
    `;
    container.innerHTML = skeletonCard.repeat(SKELETON_CARD_COUNT);
}

async function loadVideoCarousel() {
    const container = document.getElementById("videoCarousel");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");

    if (!container) return;

    renderVideoCarouselSkeleton(container);

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

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
                    <img src="${thumbnailUrl}" alt="${title}" loading="lazy" />
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
            prevBtn.addEventListener("click", () => {
                container.scrollBy({ left: -container.clientWidth * 0.75, behavior: "smooth" });
            });

            nextBtn.addEventListener("click", () => {
                container.scrollBy({ left: container.clientWidth * 0.75, behavior: "smooth" });
            });
        }

    } catch (error) {
        console.error("Error fetching YouTube playlist:", error);
        container.innerHTML = `<p class="carousel-loading">Failed to load videos.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadVideoCarousel);
