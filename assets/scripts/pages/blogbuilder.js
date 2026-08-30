document.addEventListener('DOMContentLoaded', () => {

    const mainImageContainer = document.getElementById('mainImageContainer');
    const mainFileInput = document.getElementById('mainFileInput');
    const mainImagePreview = document.getElementById('mainImagePreview');
    const mainPlus = document.getElementById('mainPlus');
    const mainLabel = document.getElementById('mainLabel');

    const bodyEditor = document.getElementById('bodyEditor');
    const bodyFileInput = document.getElementById('bodyFileInput');

    const blockTypeSelect = document.getElementById('blockTypeSelect');
    const boldBtn = document.getElementById('boldBtn');
    const linkBtn = document.getElementById('linkBtn');
    const insertImageBtn = document.getElementById('insertImageBtn');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exitBtn = document.getElementById('exitBtn');

    const metaDate = document.getElementById('metaDate');
    const metaAuthor = document.getElementById('metaAuthor');
    const metaTags = document.getElementById('metaTags');

    // fallback in case the user doesn't add a main image (will have figure out how to make the main image a required input)
    let mainImageUrl = "https://mario.wiki.gallery/images/thumb/4/48/MK8DX_Nintendo_Wallpaper_1.jpg/1600px-MK8DX_Nintendo_Wallpaper_1.jpg";

    // Set current datetime on startup (UTC)
    const now = new Date();
    const formattedDate = `${now.getUTCDate()} ${now.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })}, ${now.getUTCFullYear()} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;
    metaDate.innerText = formattedDate;

    // --- MAIN IMAGE ---
    mainImageContainer.addEventListener('click', () => {
        mainFileInput.click();
    });

    mainFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                mainImageUrl = event.target.result;
                mainImagePreview.src = mainImageUrl;
                mainImagePreview.classList.remove('hidden');
                mainPlus.classList.add('hidden');
                mainLabel.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // --- RICH TEXT ---
    boldBtn.addEventListener('click', () => {
        document.execCommand('bold', false, null);
    });

    linkBtn.addEventListener('click', () => {
        const url = prompt('Enter the link URL:', 'https://');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    });

    blockTypeSelect.addEventListener('change', (e) => {
        const tag = e.target.value;
        document.execCommand('formatBlock', false, `<${tag}>`);
    });

    // --- BODY IMAGES ---
    insertImageBtn.addEventListener('click', () => {
        bodyFileInput.click();
    });

    bodyFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgUrl = event.target.result;

                const imageBlock = document.createElement('div');
                imageBlock.className = 'article-image-container';
                imageBlock.setAttribute('contenteditable', 'false');
                imageBlock.innerHTML = `
                    <div class="article-image-wrapper">
                        <img loading="lazy" class="image article-content-image" src="${imgUrl}" />
                        <span class="article-image-caption" contenteditable="true">Lorem ipsum dolor sit amet</span>
                    </div>
                `;

                // insert at cursor location
                bodyEditor.focus();
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.insertNode(imageBlock);

                    // Add an empty paragraph after a body image
                    const p = document.createElement('p');
                    p.innerHTML = '<br>';
                    imageBlock.after(p);
                }
            };
            reader.readAsDataURL(file);
        }
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all article content?')) {
            bodyEditor.innerHTML = '<p><br></p>';
        }
    });

    exitBtn.addEventListener('click', () => {
        if (confirm('Discard changes and leave the article builder?')) {
            window.location.href = '/news/';
        }
    });

    // --- EXPORT TO HTML FILE ---
    saveBtn.addEventListener('click', () => {
        const title = document.getElementById('articleTitle').innerText.trim() || 'Untitled Article';
        const subtitle = document.getElementById('articleSubtitle').innerText.trim();
        const mainCaption = document.getElementById('mainCaption').innerText.trim();
        const author = metaAuthor.value.trim() || 'Anonymous';
        const date = metaDate.innerText;

        // Convert comma separated tags into tag elements
        const rawTags = metaTags.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
        const tagsMarkup = rawTags.length > 0
            ? rawTags.map(tag => `                        <tag translate="no">${tag}</tag>`).join('\n')
            : '                        <tag translate="no">News</tag>';

        const bodyContent = bodyEditor.innerHTML.trim();

        const outputDocument = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="dark light">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${title} | UMKL</title>
    <meta name="description"
        content="${subtitle}">
    <link rel="icon" href="/assets/media/brand/favicon.png" type="image/png">
    <link rel="stylesheet" href="/assets/css/base/style.css">
    <link rel="stylesheet" href="/assets/css/base/settings.css">
    <link rel="stylesheet" href="/assets/css/pages/newsarticle.css">
    <link rel="stylesheet" href="/assets/css/ext/fontawesome.min.css">

    <meta property="og:title" content="${title} | UMKL" />
    <meta property="og:site_name" content="UMKL" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://umkl.co.uk/news/" />
    <meta property="og:image" content="${mainImageUrl}" />
    <meta property="og:description"
        content="${subtitle}" />
    <meta content="#bc0839" name="theme-color" />

    <meta name="twitter:card" content="summary_large_image">

    <link rel="modulepreload" href="/assets/components/navbar.js">
    <link rel="modulepreload" href="/assets/components/footer.js">
    <script type="module" src="/assets/components/navbar.js" defer></script>
    <script type="module" src="/assets/components/footer.js" defer></script>

    <script src="/assets/scripts/base/theme.js"></script>
    <script type="module" src="/assets/scripts/base/settings.js" defer></script>
    <script defer src="/assets/scripts/base/imagefade.js" type="module"></script>
</head>

<body id="top">
    <umkl-navbar></umkl-navbar>

    <main class="article-main">
        <div class="bubble-link-wrapper">
            <a href="/news/" class="bubble-link no-color-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"
                    role="presentation">
                    <path fill="currentColor"
                        d="M22 13H4.94l5.18 5.29-1.38 1.42-6.17-6.3a2 2 0 0 1 0-2.82l6.17-6.3 1.38 1.42L4.94 11H22z">
                    </path>
                </svg>
                All news</a>
        </div>

        <div class="article-wrapper">

            <div class="article-content">
                <div class="article-header">
                    <h1>${title}</h1>
                    <span class="article-subtitle">${subtitle}</span>
                    <div class="article-image-container">
                        <div class="article-image-wrapper">
                            <img loading="lazy" class="image article-header-image" height="auto" width="100%"
                                src="${mainImageUrl}" />
                            <span class="article-image-caption">${mainCaption}</span>

                        </div>

                    </div>
                </div>

                <div class="article-body">
${bodyContent}
                </div>
            </div>

            <div class="article-meta">
                <div class="article-meta-item">
                    <span class="article-meta-heading">Date</span>
                    <span class="article-meta-value">${date}</span>
                </div>
                <div class="article-meta-item">
                    <span class="article-meta-heading">Author</span>
                    <span class="article-meta-value">${author}</span>
                </div>
                <div class="article-meta-item">
                    <span class="article-meta-heading">Tags</span>
                    <div class="tag-container">
${tagsMarkup}
                    </div>

                </div>
            </div>

        </div>

    </main>

    <umkl-footer></umkl-footer>
</body>

</html>`;

        // Export
        const blob = new Blob([outputDocument], { type: 'text/html' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
    });
});