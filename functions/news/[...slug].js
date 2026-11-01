/*
    Serves the news article pages with the Open Graph/Twitter tags filled in
    from the articles API, so link previews work without running JavaScript.
*/

const ARTICLES_API = 'https://api.umkl.co.uk/articles';

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function articleHead({ title, description, image_url, image_alt, link }) {
    const ogTitle = `${title} | UMKL`;
    const ogDescription = description || '';
    const ogUrl = `https://umkl.co.uk${link || ''}`;
    const ogImage = image_url ? new URL(image_url, 'https://umkl.co.uk').href : '';
    const ogImageAlt = image_alt || title;

    let ogImageTags = '';
    if (ogImage) {
        ogImageTags = `
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}" />`;
    }

    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${escapeHtml(ogTitle)}</title>
    <meta name="description" content="${escapeHtml(ogDescription)}">
    <link rel="icon" href="/_assets/media/brand/favicon.jpg" type="image/png">
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:site_name" content="umkl.co.uk" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(ogUrl)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
${ogImageTags}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
    ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}
</head>

<body>
    <main class="article-main">
        <div class="article-wrapper">
            <div class="article-content"></div>
            <div class="article-meta">
                <div class="article-meta-fields"></div>
            </div>
        </div>
    </main>
</body>

</html>`;
}

export async function onRequestGet(context) {
    const segments = (context.params.slug || []).filter(Boolean);

    // /news/<date>/<slug> is the article route
    if (segments.length < 2) return context.next();

    const slug = segments[1];
    const response = await fetch(`${ARTICLES_API}/${encodeURIComponent(slug)}`);
    if (response.status === 404) return new Response('Not Found', { status: 404 });
    const article = await response.json();

    return new Response(articleHead(article), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
