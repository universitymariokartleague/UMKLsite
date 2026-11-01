/*
    Serves the news article pages with the Open Graph/Twitter tags filled in
    from the articles API, so link previews work without running JavaScript.
    Route: /news/<date>/<slug>  ->  functions/news/[date]/[slug].js
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
    <meta name="description" content="${escapeHtml(ogDescription)}">
    <link rel="icon" href="/_assets/media/brand/favicon.jpg" type="image/png">
    <link rel="apple-touch-icon" href="/_assets/media/brand/favicon.jpg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap">
    <link rel="stylesheet" href="/_assets/css/base/style.css">
    <link rel="stylesheet" href="/_assets/css/base/settings.css">
    <link rel="stylesheet" href="/_assets/css/pages/newsarticle.css">

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

    <link rel="modulepreload" href="/_assets/webcomponents/navbar.js">
    <link rel="modulepreload" href="/_assets/webcomponents/footer.js">
    <script type="module" src="/_assets/webcomponents/navbar.js" defer></script>
    <script type="module" src="/_assets/webcomponents/footer.js" defer></script>

    <script src="/_assets/scripts/base/theme.js"></script>
    <script type="module" src="/_assets/scripts/base/settings.js" defer></script>
    <script defer src="/_assets/scripts/base/imagefade.js" type="module"></script>
    <script type="module" src="/_assets/scripts/pages/codehighlight.js" defer></script>
    <script type="module" src="/_assets/scripts/base/smartback.js" defer></script>
    <script type="module" src="/_assets/scripts/pages/relatedarticles.js" defer></script>
    <script type="module" src="/_assets/scripts/pages/articlerender.js" defer></script>
</head>

<body id="top">
    <umkl-navbar></umkl-navbar>

    <main class="article-main">
        <div class="article-wrapper">
            <div class="article-content"></div>
            <div class="article-meta">
                <div class="article-meta-fields"></div>
            </div>
        </div>
    </main>

    <umkl-footer></umkl-footer>
</body>

</html>`;
}

export async function onRequestGet(context) {
    const date = Array.isArray(context.params.date) ? context.params.date[0] : context.params.date;
    const slug = Array.isArray(context.params.slug) ? context.params.slug[0] : context.params.slug;
    if (!date || !slug) return context.next();

    const response = await fetch(`${ARTICLES_API}/${encodeURIComponent(slug)}`);
    if (response.status === 404) return new Response('Not Found', { status: 404 });
    const article = await response.json();

    return new Response(articleHead(article), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
