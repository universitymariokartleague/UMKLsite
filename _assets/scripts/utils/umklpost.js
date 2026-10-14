/*
    Builds the .umklpost an Article Builder export is made of.
*/

export { buildPost, outputDocument, DRAFT_STORAGE_KEY, ISO_DATE, slugify, isoDate };

const DRAFT_STORAGE_KEY = 'umkl_article_builder_draft';

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[arr.length - 1]);
    let u8arr = new Uint8Array(bstr.length);
    let n = u8arr.length;
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isoDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function todayISO() {
    return isoDate(new Date());
}

async function buildPost(draft) {
    const {
        title = '', subtitle = '', mainCaption = '', mainImageUrl = '',
        bodyHtml = '', author = '', tags = '', date: requestedDate = '',
    } = draft;

    const slug = slugify(title) || 'untitled-article';
    const date = ISO_DATE.test(requestedDate) ? requestedDate : todayISO();
    const folderPath = `news/${date}/${slug}`;

    const zip = new JSZip();
    const folder = zip.folder(folderPath);

    let imageCounter = 1;
    let heroUrl = mainImageUrl;

    if (mainImageUrl.startsWith('data:image')) {
        const extension = mainImageUrl.substring('data:image/'.length, mainImageUrl.indexOf(';base64'));
        const fileName = `main-image.${extension}`;
        folder.file(fileName, dataURLtoBlob(mainImageUrl));
        heroUrl = `/${folderPath}/${fileName}`;
    }

    const body = document.createElement('div');
    body.innerHTML = bodyHtml;
    body.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('data:image')) {
            const extension = src.substring('data:image/'.length, src.indexOf(';base64'));
            const fileName = `image-${imageCounter++}.${extension}`;
            folder.file(fileName, dataURLtoBlob(src));
            img.setAttribute('src', `/${folderPath}/${fileName}`);
        }
    });

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const tagsMarkup = (tagList.length > 0 ? tagList : ['News'])
        .map(tag => `                        <tag translate="no">${tag}</tag>`).join('\n');

    folder.file('index.html', outputDocument({
        title: title || 'Untitled Article',
        subtitle,
        mainImageUrl: heroUrl,
        mainCaption: mainCaption,
        bodyContent: body.innerHTML.trim(),
        date,
        author: author || 'Anonymous',
        tagsMarkup,
    }));

    zip.file('news_entry.json', JSON.stringify({
        title: title || 'Untitled Article',
        link: `/news/${date}/${slug}/`,
        date,
        image: heroUrl,
        alt: mainCaption,
        description: subtitle,
        author: author || 'Anonymous',
        tags: tagList.length > 0 ? tagList : ['News'],
    }, null, 4));

    return {
        blob: await zip.generateAsync({ type: 'blob' }),
        slug,
        date,
        title: title || 'Untitled Article',
        tagList,
    };
}

function outputDocument({ title, subtitle, mainImageUrl, mainCaption, bodyContent, date, author, tagsMarkup }) {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${title} | UMKL</title>
    <meta name="description" content="${subtitle}">
    <link rel="icon" href="/_assets/media/brand/favicon.jpg" type="image/png">
    <link rel="stylesheet" href="/_assets/css/base/style.css">
    <link rel="stylesheet" href="/_assets/css/pages/newsarticle.css">

    <link rel="modulepreload" href="/_assets/webcomponents/navbar.js">
    <link rel="modulepreload" href="/_assets/webcomponents/footer.js">
    <script type="module" src="/_assets/webcomponents/navbar.js" defer></script>
    <script type="module" src="/_assets/webcomponents/footer.js" defer></script>

    <script src="/_assets/scripts/base/theme.js"></script>
    <script type="module" src="/_assets/scripts/base/settings.js" defer></script>
    <script defer src="/_assets/scripts/base/imagefade.js" type="module"></script>
    <script type="module" src="/_assets/scripts/pages/codehighlight.js" defer></script>
</head>

<body id="top">
    <umkl-navbar></umkl-navbar>

    <main class="article-main">
        <div class="article-wrapper">
            <div class="article-content">
                <div class="article-header">
                    <h1>${title}</h1>
                    <span class="article-subtitle">${subtitle}</span>
                    ${mainImageUrl ? `
                    <div class="article-image-container">
                        <div class="article-image-wrapper">
                            <img loading="lazy" class="image article-header-image" height="auto" width="100%"
                                src="${mainImageUrl}" alt="${mainCaption}" />
                            <span class="article-image-caption">${mainCaption}</span>
                        </div>
                    </div>` : ''}
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
}
