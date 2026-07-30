const CHANNEL_ID = "UCp_1NN3jc7pawWcaVJ1OX3w";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

async function loadVideosGrid() {
    const container = document.getElementById("videosGridContainer");
    if (!container) return;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.status !== "ok" || !data.items || data.items.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos found.</p>`;
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
                <h3 class="video-title">${item.title}</h3>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading UMKL YouTube videos grid:", error);
        container.innerHTML = `<p class="carousel-loading">Failed to load videos.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadVideosGrid);