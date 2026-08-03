const API_URL = `https://api.umkl.co.uk/videos`;

async function loadVideosGrid() {
    const container = document.getElementById("videosGridContainer");
    if (!container) return;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `<p class="carousel-loading">No videos found.</p>`;
            return;
        }

        container.innerHTML = "";

        data.forEach(item => {
            const thumbnailUrl = item.thumbnail || `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`;
            const title = item.title || item.match?.title || "UMKL Video";

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
                <h3 class="video-title">${title}</h3>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading UMKL YouTube videos grid:", error);
        container.innerHTML = `<p class="carousel-loading">Failed to load videos.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadVideosGrid);