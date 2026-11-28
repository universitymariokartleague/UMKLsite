/*
    Fills the shared article template from the news API.
*/

import { trimTrailingPadding } from '/_assets/scripts/utils/articlebody.js';

const ARTICLES_API = "https://api.umkl.co.uk/articles";
const ANIMATED_VIDEO_ATTR = 'data-animated-mp4';

let av1Supported;

// Whether the browser can decode AV1
function canPlayAv1() {
    if (av1Supported !== undefined) return av1Supported;
    const video = document.createElement('video');
    av1Supported = [
        'video/mp4; codecs="av01.0.05M.08"',
        'video/mp4; codecs="av01.0.05M.10"'
    ].some(type => video.canPlayType(type) !== '');
    return av1Supported;
}

// Animated article images keep a WebP <img> in the HTML. Where AV1 works,
// upgrade them to the smaller silent looping <video> the server remuxed.
function upgradeAnimatedImages(root) {
    if (!root || !canPlayAv1()) return;

    root.querySelectorAll(`img[${ANIMATED_VIDEO_ATTR}]`).forEach(img => {
        const mp4 = img.getAttribute(ANIMATED_VIDEO_ATTR);
        if (!mp4) return;

        const video = document.createElement('video');
        for (const attr of ['class', 'alt', 'width', 'height', 'id', 'title', 'loading']) {
            if (img.hasAttribute(attr)) video.setAttribute(attr, img.getAttribute(attr));
        }
        video.classList.add('article-content-video');
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('poster', img.currentSrc || img.src);
        // Safari paints a blank first frame without a tiny media fragment.
        video.setAttribute('src', mp4.includes('#') ? mp4 : `${mp4}#t=0.001`);

        img.replaceWith(video);
        video.play().catch(() => { });
    });
}

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

function upsertMeta(attr, key, content) {
    let element = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
    }
    if (content) element.setAttribute('content', content);
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderMeta(article) {
    if (!document.querySelector('.article-meta-fields')) return;

    const date = new Date(article.published_date);
    const locale = localStorage.getItem('locale') || 'en-GB';
    const items = [
        ['Date', date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })],
        ['Author', article.author]
    ].filter(([, value]) => value);  // no author set, no row
    if (article.tags?.length) items.push(['Tags', null]);

    document.querySelector('.article-meta-fields').innerHTML = items.map(([heading, value]) => `
        <div class="article-meta-item">
            <span class="article-meta-heading">${escapeHtml(heading)}</span>
            ${value === null
            ? `<div class="tag-container">${article.tags.map(tag =>
                `<tag translate="no">${escapeHtml(tag)}</tag>`).join('')}</div>`
            : `<span class="article-meta-value">${escapeHtml(value)}</span>`}
        </div>`).join('');

    document.dispatchEvent(new CustomEvent('article:rendered'));
}

function renderArticle(article) {
    document.title = `${article.title} | UMKL`;
    setMeta('meta[name="description"]', article.description);
    setMeta('meta[property="og:title"]', `${article.title} | UMKL`);
    setMeta('meta[property="og:description"]', article.description);
    setMeta('meta[property="og:url"]', `https://umkl.co.uk${article.link}`);
    const ogImage = article.image_url ? new URL(article.image_url, 'https://umkl.co.uk').href : '';
    if (ogImage) setMeta('meta[property="og:image"]', ogImage);
    upsertMeta('property', 'og:image:alt', article.image_alt || article.title);
    upsertMeta('property', 'og:type', 'article');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', `${article.title} | UMKL`);
    upsertMeta('name', 'twitter:description', article.description);
    upsertMeta('name', 'twitter:image', ogImage);

    document.querySelector('.article-content').outerHTML = article.body_html;

    const content = document.querySelector('.article-content');
    if (content) trimTrailingPadding(content.querySelector('.article-body') || content);
    upgradeAnimatedImages(content);

    document.querySelectorAll('.article-content [contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    document.querySelectorAll('.article-content').forEach(el => el.removeAttribute('contenteditable'));

    renderMeta(article);
}

// Counts one view per browsing session
function recordView(slug) {
    fetch(`${ARTICLES_API}/${encodeURIComponent(slug)}/views`, { method: 'POST' })
        .catch(() => { });
}

async function loadArticle() {
    const slug = slugFromPath(window.location.pathname);
    if (!slug) return;

    try {
        const response = await fetch(`${ARTICLES_API}/${encodeURIComponent(slug)}`);
        if (response.status === 404) throw new Error('missing');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        renderArticle(await response.json());
        recordView(slug);
    } catch (error) {
        console.error(`%carticlerender.js%c > %cCouldn't load article "${slug}": ${error}`,
            'color:#fcce27', 'color:#fff', 'color:#ffefb5');
    }
}

loadArticle();
