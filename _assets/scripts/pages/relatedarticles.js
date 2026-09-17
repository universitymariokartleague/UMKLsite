const normalizePath = (path) => path.endsWith('/') ? path : `${path}/`;

function formatDate(isoDate) {
    const locale = localStorage.getItem("locale") || "en-GB";
    return new Date(isoDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

async function loadRelatedArticles() {
    const articleMeta = document.querySelector('.article-meta');
    if (!articleMeta) return;

    const response = await fetch('/news/news.json');
    if (!response.ok) return;
    const articles = await response.json();

    const currentPath = normalizePath(window.location.pathname);
    const current = articles.find(a => normalizePath(a.link) === currentPath);
    const others = articles.filter(a => normalizePath(a.link) !== currentPath);
    if (!others.length) return;

    const currentTags = current?.tags || [];
    // Rank by shared tags first, then recency, so a same-topic article always
    // beats a merely-newer one, but there's still something to show without tags.
    const related = others
        .map(article => ({ article, sharedTags: article.tags?.filter(t => currentTags.includes(t)).length || 0 }))
        .sort((a, b) => b.sharedTags - a.sharedTags || new Date(b.article.date) - new Date(a.article.date))
        .slice(0, 4)
        .map(({ article }) => article);

    const item = document.createElement('div');
    item.className = 'article-meta-item related-articles';
    item.innerHTML = `
        <span class="article-meta-heading">Related Articles</span>
        <div class="related-article-list">
            ${related.map(a => `
                <a class="related-article-item" href="${a.link}">
                    <div class="related-article-thumb-wrapper">
                        <img class="related-article-thumb" src="${a.image}" alt="${a.alt || ''}" loading="lazy">
                    </div>
                    <div class="related-article-body">
                        <span class="related-article-title">${a.title}</span>
                        <div class="small-card-meta">
                            <span class="small-card-date">${formatDate(a.date)}</span>
                            <div class="small-card-tags">${(a.tags || []).map(t => `<tag translate="no">${t}</tag>`).join('')}</div>
                        </div>
                    </div>
                </a>
            `).join('')}
            <a class="related-article-item related-article-more" href="/news/">
                <div class="related-article-thumb-wrapper related-more-thumb">
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
                <div class="related-article-body">
                    <span class="related-article-title">View more news</span>
                </div>
            </a>
        </div>
    `;
    articleMeta.appendChild(item);
}

// Make the article's own tags clickable
function linkifyArticleTags() {
    document.querySelectorAll('.article-meta .tag-container tag').forEach(tag => {
        const anchor = document.createElement('a');
        anchor.href = `/news/?tag=${encodeURIComponent(tag.textContent.trim().toLowerCase())}`;
        anchor.className = 'no-color-link no-underline-link';
        tag.parentNode.replaceChild(anchor, tag);
        anchor.appendChild(tag);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadRelatedArticles();
    linkifyArticleTags();
});
