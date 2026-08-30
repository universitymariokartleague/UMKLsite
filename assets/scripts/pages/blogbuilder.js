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
    const homeLink = document.getElementById('homeLink');

    const metaDate = document.getElementById('metaDate');
    const metaAuthor = document.getElementById('metaAuthor');
    const metaTags = document.getElementById('metaTags');

    let mainImageUrl = "https://mario.wiki.gallery/images/thumb/4/48/MK8DX_Nintendo_Wallpaper_1.jpg/1600px-MK8DX_Nintendo_Wallpaper_1.jpg";

    // Set current datetime on startup (UTC)
    const now = new Date();
    const formattedDate = `${now.getUTCDate()} ${now.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })}, ${now.getUTCFullYear()} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;
    metaDate.innerText = formattedDate;

    // Helper: Prompts for File Upload OR Web URL
// Modal Target Elements
    const imageModal = document.getElementById('imageModal');
    const modalUploadBtn = document.getElementById('modalUploadBtn');
    const modalUrlBtn = document.getElementById('modalUrlBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    let activeImageCallback = null;
    let activeFileInput = null;

    // Open Custom Image Selection Modal
    function openImageModal(fileInput, callback) {
        activeFileInput = fileInput;
        activeImageCallback = callback;
        imageModal.classList.remove('hidden');
    }

    // Close Modal
    function closeImageModal() {
        imageModal.classList.add('hidden');
        activeImageCallback = null;
        activeFileInput = null;
    }

    // Option 1: File Upload Selected
    modalUploadBtn.addEventListener('click', () => {
        if (activeFileInput) {
            activeFileInput.click();
        }
        closeImageModal();
    });

    // Option 2: Web URL Selected
    modalUrlBtn.addEventListener('click', () => {
        const url = prompt("Enter the direct Web URL for the image:");
        if (url && url.trim().length > 0 && activeImageCallback) {
            activeImageCallback(url.trim());
        }
        closeImageModal();
    });

    modalCloseBtn.addEventListener('click', closeImageModal);

    // Click triggers updated to use Modal
    mainImageContainer.addEventListener('click', () => {
        openImageModal(mainFileInput, (url) => {
            mainImageUrl = url;
            mainImagePreview.src = mainImageUrl;
            mainImagePreview.classList.remove('hidden');
            mainPlus.classList.add('hidden');
            mainLabel.classList.add('hidden');
        });
    });

    insertImageBtn.addEventListener('click', () => {
        if (!insertImageBtn.disabled) {
            openImageModal(bodyFileInput, (url) => {
                insertImageToBody(url);
            });
        }
    });

    // --- TOOLBAR STATE & SELECTION DETECTION ---
    function updateToolbarState() {
        const activeElement = document.activeElement;
        const sel = window.getSelection();
        
        // Determine if selection or cursor is inside body editor
        let isBodyActive = bodyEditor.contains(activeElement);
        if (sel && sel.rangeCount > 0) {
            const anchorNode = sel.anchorNode;
            if (anchorNode && bodyEditor.contains(anchorNode.nodeType === 3 ? anchorNode.parentNode : anchorNode)) {
                isBodyActive = true;
            }
        }

        // Auto-select heading if editor is blank/empty
        const cleanText = bodyEditor.innerText.replace(/\s/g, '');
        if (cleanText === '') {
            blockTypeSelect.value = 'h3';
        } else if (isBodyActive && sel && sel.rangeCount > 0) {
            // Detect block element under cursor inside body editor
            let parentBlock = sel.anchorNode;
            if (parentBlock.nodeType === 3) parentBlock = parentBlock.parentNode;
            
            while (parentBlock && parentBlock !== bodyEditor && !['P', 'H3'].includes(parentBlock.tagName)) {
                parentBlock = parentBlock.parentNode;
            }

            if (parentBlock && parentBlock !== bodyEditor) {
                const tag = parentBlock.tagName.toLowerCase();
                if (['p', 'h3'].includes(tag)) {
                    blockTypeSelect.value = tag;
                }
            }
        }

        // Disable toolbar controls when focused outside bodyEditor
        const controls = [blockTypeSelect, boldBtn, linkBtn, insertImageBtn];
        controls.forEach(ctrl => {
            ctrl.disabled = !isBodyActive;
            ctrl.style.opacity = isBodyActive ? '1' : '0.4';
            ctrl.style.cursor = isBodyActive ? 'pointer' : 'not-allowed';
        });
    }

    // Monitor changes across selection and focus
    document.addEventListener('selectionchange', updateToolbarState);
    document.addEventListener('focusin', updateToolbarState);
    updateToolbarState();

    // --- MAIN IMAGE ---
    mainImageContainer.addEventListener('click', () => {
        getImageUrl(mainFileInput, (url) => {
            mainImageUrl = url;
            mainImagePreview.src = mainImageUrl;
            mainImagePreview.classList.remove('hidden');
            mainPlus.classList.add('hidden');
            mainLabel.classList.add('hidden');
        });
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
        if (!boldBtn.disabled) {
            document.execCommand('bold', false, null);
        }
    });

    linkBtn.addEventListener('click', () => {
        if (!linkBtn.disabled) {
            const url = prompt('Enter the link URL:', 'https://');
            if (url) {
                document.execCommand('createLink', false, url);
            }
        }
    });

    blockTypeSelect.addEventListener('change', (e) => {
        if (!blockTypeSelect.disabled) {
            const tag = e.target.value;
            document.execCommand('formatBlock', false, `<${tag}>`);
        }
    });

    // --- BODY IMAGES ---
    function insertImageToBody(imgUrl) {
        const imageBlock = document.createElement('div');
        imageBlock.className = 'article-image-container';
        imageBlock.setAttribute('contenteditable', 'false');
        imageBlock.innerHTML = `
            <div class="article-image-wrapper">
                <button type="button" class="btn-remove-image" title="Remove image">&times;</button>
                <img loading="lazy" class="image article-content-image" src="${imgUrl}" />
                <span class="article-image-caption" contenteditable="true">Lorem ipsum dolor sit amet</span>
            </div>
        `;

        bodyEditor.focus();
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            let range = sel.getRangeAt(0);

            // Find block element under selection
            let currentBlock = range.startContainer;
            if (currentBlock.nodeType === 3) currentBlock = currentBlock.parentNode;

            // Ensure placement is inside bodyEditor
            while (currentBlock && currentBlock.parentNode !== bodyEditor && currentBlock !== bodyEditor) {
                currentBlock = currentBlock.parentNode;
            }

            // Create new line if inserting mid-text line
            if (currentBlock && currentBlock !== bodyEditor) {
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                currentBlock.after(imageBlock);
                imageBlock.after(p);
            } else {
                bodyEditor.appendChild(imageBlock);
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                bodyEditor.appendChild(p);
            }
        }
    }

    insertImageBtn.addEventListener('click', () => {
        if (!insertImageBtn.disabled) {
            getImageUrl(bodyFileInput, (url) => {
                insertImageToBody(url);
            });
        }
    });

    bodyFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                insertImageToBody(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Delegated delete handler for body images
    bodyEditor.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-image')) {
            const container = e.target.closest('.article-image-container');
            if (container) {
                container.remove();
            }
        }
    });

    // --- ACTIONS ---
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all article content?')) {
            bodyEditor.innerHTML = '<p><br></p>';
            updateToolbarState();
        }
    });

    exitBtn.addEventListener('click', () => {
        if (confirm('Discard changes and leave the article builder?')) {
            window.location.href = '/news/';
        }
    });

    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Discard changes and leave the article builder?')) {
            window.location.href = homeLink.href;
        }
    });

    // --- EXPORT TO HTML FILE ---
    saveBtn.addEventListener('click', () => {
        const title = document.getElementById('articleTitle').innerText.trim() || 'Untitled Article';
        const subtitle = document.getElementById('articleSubtitle').innerText.trim();
        const mainCaption = document.getElementById('mainCaption').innerText.trim();
        const author = metaAuthor.value.trim() || 'Anonymous';
        const date = metaDate.innerText;

        const rawTags = metaTags.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
        const tagsMarkup = rawTags.length > 0
            ? rawTags.map(tag => `                        <tag translate="no">${tag}</tag>`).join('\n')
            : '                        <tag translate="no">News</tag>';

        // Clone editor content to strip out builder-only remove buttons before exporting
        const clone = bodyEditor.cloneNode(true);
        clone.querySelectorAll('.btn-remove-image').forEach(btn => btn.remove());
        const bodyContent = clone.innerHTML.trim();

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

        const blob = new Blob([outputDocument], { type: 'text/html' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
    });
});