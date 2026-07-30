const PLAYLIST_ID = "PLA9y6mUhnL26V_rzLhRYC_KCGVCJrgu04"; 

const RSS_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

async function loadVideoCarousel() {
    const container = document.getElementById("videoCarousel");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");

    if (!container) return;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.status !== "ok" || !data.items || data.items.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos available.</p>`;
            return;
        }

        container.innerHTML = "";

        data.items.forEach(item => {
            const videoId = item.link.split("v=")[1]?.split("&")[0];
            const thumbnailUrl = videoId 
                ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` 
                : item.thumbnail;

            const card = document.createElement("a");
            card.className = "video-card";
            card.href = item.link;
            card.target = "_blank";
            card.rel = "noopener noreferrer";

            card.innerHTML = `
                <div class="video-thumb-wrapper">
                    <img src="${thumbnailUrl}" alt="${item.title}" loading="lazy" />
                    <div class="play-icon-overlay">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
                <p class="video-title no-color-link">${item.title}</p>
            `;

            container.appendChild(card);
        });

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