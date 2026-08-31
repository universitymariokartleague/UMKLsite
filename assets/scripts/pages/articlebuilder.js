// Elements
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

const imageModal = document.getElementById('imageModal');
const modalCard = document.getElementById('modalCard')
const modalUploadBtn = document.getElementById('modalUploadBtn');
const modalUrlBtn = document.getElementById('modalUrlBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');

const reqTitle = document.getElementById('reqTitle');
const reqSubtitle = document.getElementById('reqSubtitle');
const reqMainImage = document.getElementById('reqMainImage');
const reqCaption = document.getElementById('reqCaption');
const reqAuthor = document.getElementById('reqAuthor');
const reqTags = document.getElementById('reqTags');
const reqWords = document.getElementById('reqWords');

const checklistScore = document.getElementById('checklistScore');
const checklistProgressBar = document.getElementById('checklistProgressBar');
const widgetWordCount = document.getElementById('widgetWordCount');

const articleTitle = document.getElementById('articleTitle');
const articleSubtitle = document.getElementById('articleSubtitle');
const mainCaption = document.getElementById('mainCaption');

const MIN_WORDS = 500;

const STORAGE_KEY = 'umkl_article_builder_draft';

// --- CHECKLIST COLLAPSE/EXPAND LOGIC ---
const checklistWidget = document.getElementById('checklistWidget');
const checklistHeader = document.getElementById('checklistHeader');
const toggleChecklistBtn = document.getElementById('toggleChecklistBtn');

function toggleChecklist() {
    const isCollapsed = checklistWidget.classList.toggle('collapsed');
    localStorage.setItem('umkl_checklist_collapsed', isCollapsed);
}

// Toggle when clicking header or icon
if (checklistHeader) {
    checklistHeader.addEventListener('click', toggleChecklist);
}

// Auto-collapse on small mobile screens by default if not set
const savedState = localStorage.getItem('umkl_checklist_collapsed');
if (savedState === 'true' || (savedState === null && window.innerWidth <= 600)) {
    checklistWidget.classList.add('collapsed');
}


document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    const splashProgressBar = document.getElementById('splashProgressBar');
    const splashTip = document.getElementById('splashTip');

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;

        if (progress >= 90) {
            clearInterval(progressInterval);
        } else {
            splashProgressBar.style.width = `${progress}%`;
        }
    }, 80);

    // Complete loading after restoring draft state & resources
    window.addEventListener('load', () => {
        clearInterval(progressInterval);
        splashProgressBar.style.width = '100%';

        // Smooth transition out
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
        }, 300);
    });
});


// Save all form and editor data to localStorage
function saveDraft() {
    const draftData = {
        title: articleTitle.innerHTML,
        subtitle: articleSubtitle.innerHTML,
        mainCaption: mainCaption.innerHTML,
        mainImageUrl: mainImageUrl,
        isMainImageVisible: !mainImagePreview.classList.contains('hidden'),
        bodyHtml: bodyEditor.innerHTML,
        author: metaAuthor.value,
        tags: metaTags.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
}


function loadDraft() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const draft = JSON.parse(saved);

        if (draft.title) articleTitle.innerHTML = draft.title;
        if (draft.subtitle) articleSubtitle.innerHTML = draft.subtitle;
        if (draft.mainCaption) mainCaption.innerHTML = draft.mainCaption;

        if (draft.mainImageUrl && draft.isMainImageVisible) {
            setMainImage(draft.mainImageUrl);
        }

        if (draft.bodyHtml) bodyEditor.innerHTML = draft.bodyHtml;
        if (draft.author !== undefined) metaAuthor.value = draft.author;
        if (draft.tags !== undefined) metaTags.value = draft.tags;

    } catch (e) {
        console.error("Failed to restore article draft:", e);
    }
}


function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
}

// State
let mainImageUrl = "https://mario.wiki.gallery/images/thumb/4/48/MK8DX_Nintendo_Wallpaper_1.jpg/1600px-MK8DX_Nintendo_Wallpaper_1.jpg";
let activeImageCallback = null;
let activeFileInput = null;

// Exported article HTML template
const outputDocument = ({ title, subtitle, mainImageUrl, mainCaption, bodyContent, date, author, tagsMarkup }) => `<!DOCTYPE html>
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

// Default the date field to now, in UTC
const now = new Date();
const formattedDate = `${now.getUTCDate()} ${now.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })}, ${now.getUTCFullYear()} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;
metaDate.innerText = formattedDate;

// Image source modal (file upload or web URL)
function openImageModal(fileInput, callback) {
    activeFileInput = fileInput;
    activeImageCallback = callback;
    imageModal.classList.remove('hidden');
    imageModal.classList.remove('closing');
    imageModal.style.display = 'flex';
}

function closeImageModal() {
    if (imageModal.classList.contains('hidden') || imageModal.classList.contains('closing')) return;

    imageModal.classList.add('closing');
    modalCard.classList.add('closing');

    const onAnimationEnd = () => {
        imageModal.classList.add('hidden');
        imageModal.classList.remove('closing');
        modalCard.classList.remove('closing');

        imageModal.removeEventListener('animationend', onAnimationEnd);
        activeImageCallback = null;
        activeFileInput = null;
    };

    imageModal.addEventListener('animationend', onAnimationEnd, { once: true });
}

modalUploadBtn.addEventListener('click', () => {
    if (activeFileInput) {
        activeFileInput.click();
    }
    closeImageModal();
});

modalUrlBtn.addEventListener('click', () => {
    const url = prompt("Enter the direct Web URL for the image:");
    if (url && url.trim().length > 0 && activeImageCallback) {
        activeImageCallback(url.trim());
    }
    closeImageModal();
});

modalCloseBtn.addEventListener('click', closeImageModal);
imageModal.addEventListener('click', closeImageModal);

// Main image
function setMainImage(url) {
    mainImageUrl = url;
    mainImagePreview.src = mainImageUrl;
    mainImagePreview.classList.remove('hidden');
    mainPlus.classList.add('hidden');
    mainLabel.classList.add('hidden');
    validateArticleRequirements();
    saveDraft();
}

mainImageContainer.addEventListener('click', () => {
    openImageModal(mainFileInput, setMainImage);
});

mainFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => setMainImage(event.target.result);
        reader.readAsDataURL(file);
    }
});

function setItemState(element, isPassed) {
    if (!element) return;
    const icon = element.querySelector('.check-icon');
    if (isPassed) {
        element.classList.add('passed');
        if (icon) icon.innerText = '✓';
    } else {
        element.classList.remove('passed');
        if (icon) icon.innerText = '✕';
    }
}

function getBodyWordCount() {
    const clone = bodyEditor.cloneNode(true);
    clone.querySelectorAll('.article-image-caption, .btn-remove-image').forEach(el => el.remove());
    const text = clone.innerText || clone.textContent || '';
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function validateArticleRequirements() {
    const wordCount = getBodyWordCount();

    const titleText = articleTitle.innerText.trim();
    const titlePlaceholder = 'CLICK TO EDIT TITLE';
    const hasTitle = titleText.length > 0 && titleText !== titlePlaceholder;

    const subtitleText = articleSubtitle.innerText.trim();
    const subtitlePlaceholder = articleSubtitle.getAttribute('data-placeholder') || 'Click to edit subtitle';
    const hasSubtitle = subtitleText.length > 0 && subtitleText !== subtitlePlaceholder;

    const hasMainImage = !mainImagePreview.classList.contains('hidden') && mainImagePreview.getAttribute('src') !== '';

    const captionText = mainCaption.innerText.trim();
    const hasCaption = captionText.length > 0 && captionText !== 'Click to edit caption';

    const hasAuthor = metaAuthor.value.trim().length > 0;
    const rawTags = metaTags.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const hasTags = rawTags.length > 0;
    const hasWords = wordCount >= MIN_WORDS;

    setItemState(reqTitle, hasTitle);
    setItemState(reqSubtitle, hasSubtitle);
    setItemState(reqMainImage, hasMainImage);
    setItemState(reqCaption, hasCaption);
    setItemState(reqAuthor, hasAuthor);
    setItemState(reqTags, hasTags);
    setItemState(reqWords, hasWords);

    if (widgetWordCount) widgetWordCount.innerText = `${wordCount}/${MIN_WORDS}`;

    const checks = [hasTitle, hasSubtitle, hasMainImage, hasCaption, hasAuthor, hasTags, hasWords];
    const passedCount = checks.filter(Boolean).length;
    const totalChecks = checks.length;
    const percentage = (passedCount / totalChecks) * 100;

    if (checklistScore) checklistScore.innerText = `${passedCount} / ${totalChecks}`;
    if (checklistProgressBar) {
        checklistProgressBar.style.width = `${percentage}%`;
        if (passedCount === totalChecks) {
            checklistProgressBar.classList.add('progress-complete');
        } else {
            checklistProgressBar.classList.remove('progress-complete');
        }
    }

    return { isValid: passedCount === totalChecks, passedCount, totalChecks };
}

// Auto-save on any edit
[articleTitle, articleSubtitle, mainCaption, bodyEditor].forEach(el => {
    if (el) {
        el.addEventListener('input', () => {
            validateArticleRequirements();
            saveDraft();
        });
    }
});

[metaAuthor, metaTags].forEach(el => {
    if (el) {
        el.addEventListener('input', () => {
            validateArticleRequirements();
            saveDraft();
        });
    }
});

// Load draft on startup
loadDraft();
validateArticleRequirements();

// Toolbar state & selection detection
function updateToolbarState() {
    const activeElement = document.activeElement;
    const sel = window.getSelection();

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

document.addEventListener('selectionchange', updateToolbarState);
document.addEventListener('focusin', updateToolbarState);
updateToolbarState();

// Rich text
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

// Body images
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
        const range = sel.getRangeAt(0);

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
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            bodyEditor.appendChild(imageBlock);
            bodyEditor.appendChild(p);
        }
    }
    saveDraft();
}

insertImageBtn.addEventListener('click', () => {
    if (!insertImageBtn.disabled) {
        openImageModal(bodyFileInput, insertImageToBody);
    }
});

bodyFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => insertImageToBody(event.target.result);
        reader.readAsDataURL(file);

    }
});

bodyEditor.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-image')) {
        const container = e.target.closest('.article-image-container');
        if (container) {
            container.remove();
        }
    }
});

// Actions
clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all article content?')) {
        articleTitle.textContent = 'Click to edit title';
        articleSubtitle.textContent = 'Click to edit subtitle';
        mainCaption.textContent = 'Click to edit caption';

        mainImageUrl = "https://mario.wiki.gallery/images/thumb/4/48/MK8DX_Nintendo_Wallpaper_1.jpg/1600px-MK8DX_Nintendo_Wallpaper_1.jpg";
        mainImagePreview.src = '';
        mainImagePreview.classList.add('hidden');
        mainPlus.classList.remove('hidden');
        mainLabel.classList.remove('hidden');
        mainFileInput.value = '';

        metaAuthor.value = '';
        metaTags.value = '';
        bodyEditor.innerHTML = '<h3>Start the body with a heading</h3><p>Start writing the body of the article</p>';

        updateToolbarState();
        validateArticleRequirements();
        saveDraft();
    }
});

exitBtn.addEventListener('click', () => {
    window.location.href = '/tools/';

});

homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = homeLink.href;
});

// Export to HTML file
saveBtn.addEventListener('click', () => {
    const title = document.getElementById('articleTitle').textContent.trim() || 'Untitled Article';
    const subtitle = document.getElementById('articleSubtitle').textContent.trim();
    const mainCaption = document.getElementById('mainCaption').textContent.trim();
    const author = metaAuthor.value.trim() || 'Anonymous';
    const date = metaDate.innerText;

    const rawTags = metaTags.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const tagsMarkup = rawTags.length > 0
        ? rawTags.map(tag => `                        <tag translate="no">${tag}</tag>`).join('\n')
        : '                        <tag translate="no">News</tag>';

    const clone = bodyEditor.cloneNode(true);
    clone.querySelectorAll('.btn-remove-image').forEach(btn => btn.remove());
    const bodyContent = clone.innerHTML.trim();

    const blob = new Blob([outputDocument({ title, subtitle, mainImageUrl, mainCaption, bodyContent, date, author, tagsMarkup })], { type: 'text/html' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
    downloadLink.click();
    URL.revokeObjectURL(downloadLink.href);
});
