/*
    Fills the shared article template from the news API.
*/

const ARTICLES_API = "https://api.umkl.co.uk/articles";

// /news/<date>/<slug>/ -> <slug>. Returns null on any other path.
function slugFromPath(pathname) {
    const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts[0] !== 'news' || parts.length !== 3) return null;
    return parts[2] || null;
}

function setMeta(selector, content) {
    const element = document.querySelector(selector);
    if (element && content) element.setAttribute('content', content);
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderMeta(article) {
    const meta = document.querySelector('.article-meta');
    if (!meta) return;

    const date = new Date(article.published_date);
    const locale = localStorage.getItem('locale') || 'en-GB';
    const items = [
        ['Date', date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })],
        ['Author', article.author || 'UMKL']
    ];
    if (article.tags?.length) items.push(['Tags', null]);

    meta.innerHTML = items.map(([heading, value]) => `
        <div class="article-meta-item">
            <span class="article-meta-heading">${escapeHtml(heading)}</span>
            ${value === null
            ? `<div class="tag-container">${article.tags.map(tag =>
                `<tag translate="no">${escapeHtml(tag)}</tag>`).join('')}</div>`
            : `<span class="article-meta-value">${escapeHtml(value)}</span>`}
        </div>`).join('');
}

function renderArticle(article) {
    document.title = `${article.title} | UMKL`;
    setMeta('meta[name="description"]', article.description);
    setMeta('meta[property="og:title"]', `${article.title} | UMKL`);
    setMeta('meta[property="og:description"]', article.description);
    setMeta('meta[property="og:url"]', `https://umkl.co.uk${article.link}`);
    if (article.image_url) setMeta('meta[property="og:image"]', article.image_url);

    document.querySelector('.article-content').outerHTML = article.body_html;
    renderMeta(article);
}

async function loadArticle() {
    const slug = slugFromPath(window.location.pathname);
    if (!slug) return;

    try {
        const response = await fetch(`${ARTICLES_API}/${encodeURIComponent(slug)}`);
        if (response.status === 404) throw new Error('missing');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        renderArticle(await response.json());
    } catch (error) {
        console.error(`%carticlerender.js%c > %cCouldn't load article "${slug}": ${error}`,
            'color:#fcce27', 'color:#fff', 'color:#ffefb5');
    }
}

loadArticle();
