/*
    newsgenerate.js
    Fetches news/news.json and renders article previews on the homepage
    (hero + small cards) and the full news listing page. On the listing
    page it also wires up tag links and the search/filter box.
*/

const NEWS_JSON_URL = "/news/news.json";

function formatDate(isoDate) {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
}

async function fetchNews() {
    const response = await fetch(NEWS_JSON_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = await response.json();
    return items.slice().sort((a, b) => b.date.localeCompare(a.date));
}

function renderHomeNewsSkeleton() {
    const container = document.querySelector(".news-grid-container");
    if (!container) return;

    const smallCardSkeleton = `
        <article class="small-card" aria-hidden="true">
            <div class="img-wrapper">
                <div class="skeleton" style="position:absolute;inset:0;border-radius:10px;"></div>
            </div>
            <h3 class="skeleton"></h3>
            <p class="skeleton"></p>
            <div class="small-card-meta skeleton"></div>
        </article>
    `;

    container.innerHTML = `
        <article class="hero-card" aria-hidden="true">
            <div class="skeleton" style="position:absolute;inset:0;"></div>
        </article>
        <div class="right-column">
            ${smallCardSkeleton.repeat(4)}
        </div>
    `;
}

function renderNewsListingSkeleton() {
    const container = document.getElementById("news-container");
    if (!container) return;

    const cardSkeleton = `
        <article class="news-card" aria-hidden="true">
            <div class="news-card-image">
                <div class="skeleton" style="position:absolute;inset:0;border-radius:10px;"></div>
            </div>
            <div class="news-card-body">
                <div class="skeleton skeleton-line" style="width:90%;"></div>
                <div class="skeleton skeleton-line" style="width:70%;"></div>
            </div>
            <div class="skeleton skeleton-line" style="width:90px;height:14px;margin-top:10px;"></div>
        </article>
    `;

    container.innerHTML = cardSkeleton.repeat(8);
}

function renderHomeNews(news) {
    const container = document.querySelector(".news-grid-container");
    if (!container) return;

    const [hero, ...rest] = news;
    if (!hero) return;

    const smallCards = rest.slice(0, 4).map(item => {
        const tagsHTML = item.tags.map(tag => `<tag translate="no">${tag}</tag>`).join("");
        return `
        <article class="small-card">
            <a href="${item.link}" class="small-card-link">
                <div class="img-wrapper">
                    <img loading="lazy" src="${item.image}" alt="${item.alt}">
                </div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="small-card-meta">
                    <span class="small-card-date">${formatDate(item.date)}</span>
                    <div class="small-card-tags">${tagsHTML}</div>
                </div>
            </a>
        </article>
    `;
    }).join("");

    const heroTagsHTML = hero.tags.map(tag => `<tag translate="no">${tag}</tag>`).join("");

    container.innerHTML = `
        <article class="hero-card">
            <a href="${hero.link}" class="hero-card-link">
                <img loading="lazy" src="${hero.image}" alt="${hero.alt}">
                <div class="hero-content">
                    <h2>${hero.title}</h2>
                    <p>${hero.description}</p>
                    <div class="hero-meta">
                        <span class="hero-date">${formatDate(hero.date)}</span>
                        <div class="hero-tags">${heroTagsHTML}</div>
                    </div>
                </div>
            </a>
        </article>
        <div class="right-column">
            ${smallCards}
        </div>
    `;
}

function buildNewsCard(item) {
    const tagsHTML = item.tags.map(tag => `<tag translate="no">${tag}</tag>`).join("");
    return `
        <article class="news-card">
            <a href="${item.link}" class="news-card-link">
                <div class="news-card-image">
                    <img alt="${item.alt}" loading="lazy" onload="this.style.opacity=1" src="${item.image}" />
                </div>
                <div class="news-card-body">
                    <span class="news-title">${item.title}</span>
                    <span class="news-desc">${item.description}</span>
                </div>
            </a>
            <span class="news-date">${formatDate(item.date)}
                <span class="tags">${tagsHTML}</span>
            </span>
        </article>
    `;
}

function renderNewsListing(news) {
    const container = document.getElementById("news-container");
    if (!container) return;
    container.innerHTML = news.map(buildNewsCard).join("");

    // Images can finish loading (from cache) before this inline onload
    // handler is attached during the innerHTML parse, which would leave
    // them stuck at opacity:0. Catch that case here.
    container.querySelectorAll(".news-card-image img").forEach(img => {
        if (img.complete) img.style.opacity = 1;
    });
}

/* --- Tag links + search/filter box for the full news listing page --- */

const params = new URLSearchParams(window.location.search);
const selectedTag = params.get("tag");
const existingSearch = params.get("search") || "";

function addLinksToTags() {
    const newsDates = document.querySelectorAll(".news-date");
    const tagLower = selectedTag ? selectedTag.toLowerCase() : null;
    let hasAnimatedTags = false;

    const style = document.createElement("style");
    style.textContent = `@keyframes news-tag-scroll { 0% { transform: translateX(0); } 50% { transform: translateX(var(--scroll-amount)); } 100% { transform: translateX(0); } }`;
    document.head.appendChild(style);

    newsDates.forEach((element) => {
        const tags = element.querySelectorAll("tag");

        tags.forEach(tag => {
            const tagText = tag.textContent.trim();
            const isSelected = tagLower && tagText.toLowerCase() === tagLower;
            const href = isSelected ? "/news/" : `/news/?tag=${encodeURIComponent(tagText.toLowerCase())}`;

            const anchor = document.createElement("a");
            anchor.href = href;
            anchor.className = "tag-link";

            tag.translate = false;
            tag.className = "tag-link-text";
            tag.parentNode.replaceChild(anchor, tag);
            anchor.appendChild(tag);
        });

        const rect = element.getBoundingClientRect();
        const width = rect.width;

        if (width > 205) {
            element.style.setProperty("--scroll-amount", `-${width - 200}px`);
            element.style.animation = "news-tag-scroll 5s ease-in-out infinite";
            hasAnimatedTags = true;
        }
    });

    if (!hasAnimatedTags) style.remove();

    if (tagLower) {
        document.querySelectorAll(".news-date tag").forEach(tag => {
            if (tag.textContent.trim().toLowerCase() === tagLower) {
                tag.classList.add("tag-selected");
            }
        });

        const containers = document.querySelectorAll("#news-container > *");
        containers.forEach(container => {
            const newsDate = container.querySelector(".news-date");
            if (newsDate) {
                const hasMatch = Array.from(newsDate.querySelectorAll("tag")).some(
                    tag => tag.textContent.trim().toLowerCase() === tagLower
                );
                if (!hasMatch) container.style.display = "none";
            }
        });
    }
}

function addSearchBar() {
    const newsContainer = document.getElementById("news-container");
    if (!newsContainer) return;

    let searchWrapper = document.getElementById("news-search-wrapper");
    let searchInput = document.getElementById("news-search");

    const tagChip = selectedTag ? `<span class="news-search-tag-chip">${selectedTag}<button class="news-search-tag-remove" aria-label="Remove tag">&times;</button></span>` : "";
    const disabledAttr = selectedTag ? "disabled" : "";
    const placeholder = selectedTag ? "" : "Search news...";

    searchWrapper.innerHTML = `
        ${tagChip}
        <input type="text" id="news-search" placeholder="${placeholder}" value="${existingSearch}" ${disabledAttr} />
    `;

    searchInput = document.getElementById("news-search");

    let noResultsMsg = document.getElementById("news-no-results");
    if (!noResultsMsg) {
        noResultsMsg = document.createElement("div");
        noResultsMsg.id = "news-no-results";
        noResultsMsg.innerHTML = `
            <p>No results found</p>
            <button id="news-clear-search">Clear search</button>
        `;
        noResultsMsg.style.display = "none";
        newsContainer.parentNode.insertBefore(noResultsMsg, newsContainer.nextSibling);
    }

    document.getElementById("news-clear-search")?.addEventListener("click", () => {
        const url = new URL(window.location);
        url.searchParams.delete("search");
        window.location.href = url.toString();
    });

    const tagRemoveBtn = searchWrapper.querySelector(".news-search-tag-remove");
    if (tagRemoveBtn) {
        tagRemoveBtn.addEventListener("click", () => {
            const url = new URL(window.location);
            url.searchParams.delete("tag");
            window.location.href = url.toString();
        });
    }

    const containers = document.querySelectorAll("#news-container > *");
    const tagLower = selectedTag ? selectedTag.toLowerCase() : null;
    let debounceTimer;

    function filterNews(searchTerm) {
        const term = searchTerm.toLowerCase();
        let visibleCount = 0;

        containers.forEach(container => {
            const titleEl = container.querySelector(".news-title");
            const descEl = container.querySelector(".news-desc");
            const dateEl = container.querySelector(".news-date");

            const title = titleEl ? titleEl.textContent.toLowerCase() : "";
            const desc = descEl ? descEl.textContent.toLowerCase() : "";
            const date = dateEl ? dateEl.textContent.toLowerCase() : "";

            let tagMatch = true;
            if (tagLower) {
                const tagElements = container.querySelectorAll("tag, .tag-link-text");
                tagMatch = Array.from(tagElements).some(tag =>
                    tag.textContent.trim().toLowerCase() === tagLower
                );
            }

            const textMatch = !term || title.includes(term) || desc.includes(term) || date.includes(term);

            container.style.display = (textMatch && tagMatch) ? "" : "none";
            if (textMatch && tagMatch) visibleCount++;
        });

        noResultsMsg.style.display = visibleCount === 0 ? "block" : "none";
    }

    function updateURL(searchTerm) {
        const url = new URL(window.location);
        if (searchTerm) {
            url.searchParams.set("search", searchTerm);
        } else {
            url.searchParams.delete("search");
        }
        window.history.replaceState({}, "", url);
    }

    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = e.target.value.trim();
            filterNews(searchTerm);
            updateURL(searchTerm);
        }, 10);
    });

    if (existingSearch) {
        filterNews(existingSearch);
    } else if (selectedTag) {
        filterNews("");
    }
}

async function init() {
    renderHomeNewsSkeleton();
    renderNewsListingSkeleton();

    let news;
    try {
        news = await fetchNews();
    } catch (err) {
        console.error(`%cnewsgenerate.js%c > %cFailed to load news.json: ${err}`, "color:#fcce27", "color:#fff", "color:#ffefb5");
        return;
    }

    renderHomeNews(news);

    if (document.getElementById("news-container")) {
        renderNewsListing(news);
        addSearchBar();
        addLinksToTags();
    }
}

document.addEventListener("DOMContentLoaded", init);
