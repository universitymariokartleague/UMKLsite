import { createDebugLogger } from '/assets/scripts/utils/debuglogger.js';

const debugLog = createDebugLogger('articlebuilder.js', '#2dd4bf', '#99f6e4');

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
const insertVideoBtn = document.getElementById('insertVideoBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const exitBtn = document.getElementById('exitBtn');
const homeLink = document.getElementById('homeLink');
const storageUsageEl = document.getElementById('storageUsage');

const metaDate = document.getElementById('metaDate');
const metaAuthor = document.getElementById('metaAuthor');
const metaTags = document.getElementById('metaTags');

const imageModal = document.getElementById('imageModal');
const modalCard = document.getElementById('modalCard')
const modalUploadBtn = document.getElementById('modalUploadBtn');
const modalUrlBtn = document.getElementById('modalUrlBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');

const urlModal = document.getElementById('urlModal');
const urlModalCard = document.getElementById('urlModalCard');
const urlModalTitle = document.getElementById('urlModalTitle');
const urlModalSubtitle = document.getElementById('urlModalSubtitle');
const urlModalInput = document.getElementById('urlModalInput');
const urlModalCancelBtn = document.getElementById('urlModalCancelBtn');
const urlModalConfirmBtn = document.getElementById('urlModalConfirmBtn');

const conversionStatusEl = document.getElementById('conversionStatus');

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


const checklistWidget = document.getElementById('checklistWidget');
const checklistHeader = document.getElementById('checklistHeader');
const toggleChecklistBtn = document.getElementById('toggleChecklistBtn');

const ogPreviewImage = document.getElementById('ogPreviewImage');
const ogPreviewTitle = document.getElementById('ogPreviewTitle');
const ogPreviewDescription = document.getElementById('ogPreviewDescription');

const editableElements = [
    document.getElementById('articleTitle'),
    document.getElementById('articleSubtitle'),
    document.getElementById('mainCaption'),
    document.getElementById('bodyEditor')
];

// Config
const MIN_WORDS = 200;
const STORAGE_KEY = 'umkl_article_builder_draft';
const LOCAL_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // browsers typically cap each origin at ~5MB
const MAX_IMAGE_DIMENSION = 800; // cap uploaded body images to this before AVIF-encoding them
const MAX_MAIN_IMAGE_DIMENSION = 1000; // main image gets a bit more room since it's shown larger
const savedState = localStorage.getItem('umkl_checklist_collapsed');

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
    <meta property="og:site_name" content="umkl.co.uk" />
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

function toggleChecklist() {
    const isCollapsed = checklistWidget.classList.toggle('collapsed');
    localStorage.setItem('umkl_checklist_collapsed', isCollapsed);
}

if (checklistHeader) {
    checklistHeader.addEventListener('click', toggleChecklist);
}

if (savedState === 'true' || (savedState === null && window.innerWidth <= 600)) {
    checklistWidget.classList.add('collapsed');
}

// Forces all paste operations to not have formatting
function handlePlainTextPaste(e) {
    e.preventDefault();

    // Get plain text from clipboard
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');

    // Insert text at cursor position
    if (document.queryCommandSupported('insertText')) {
        document.execCommand('insertText', false, text);
    } else {
        // Fallback for browsers that don't support insertText
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(text));
    }
}

// Attach event listener to all editable regions
editableElements.forEach(el => {
    if (el) {
        el.addEventListener('paste', handlePlainTextPaste);
    }
});

// localStorage usage indicator
function getLocalStorageUsageBytes() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        total += (key.length + (localStorage.getItem(key) || '').length) * 2;
    }
    return total;
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function updateStorageUsage() {
    if (!storageUsageEl) return;
    const used = getLocalStorageUsageBytes();
    const percent = ((used / LOCAL_STORAGE_LIMIT_BYTES) * 100).toFixed(1);

    if (!autoSaveEnabled) {
        storageUsageEl.textContent = `Draft storage full! Changes won't be autosaved, so please download your draft instead.`;
        storageUsageEl.classList.add('storage-usage-error');
    } else {
        storageUsageEl.textContent = `Draft storage used: ${formatBytes(used)} / ${formatBytes(LOCAL_STORAGE_LIMIT_BYTES)} (${percent}%)`;
        storageUsageEl.classList.remove('storage-usage-error');
    }
}

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

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
        autoSaveEnabled = true;
    } catch (e) {
        autoSaveEnabled = false;
        console.error('Failed to save draft, likely over the local storage limit:', e);
    }
    updateStorageUsage();
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
let activeUrlCallback = null;
let autoSaveEnabled = true;

// Date field: defaults to now, and auto-corrects to this format whenever it's edited
function formatDate(date) {
    return `${date.getDate()} ${date.toLocaleString('en-GB', { month: 'long' })}, ${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Accepts "28/2/26", "28-02-2026", "28th Feb 2026", etc., in addition to whatever Date() understands natively
function parseDateInput(value) {
    const cleaned = value.trim().replace(/,\s*$/, '');
    if (!cleaned) return null;

    const numeric = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/);
    if (numeric) {
        const day = parseInt(numeric[1], 10);
        const month = parseInt(numeric[2], 10);
        let year = parseInt(numeric[3], 10);
        const hour = numeric[4] ? parseInt(numeric[4], 10) : 0;
        const minute = numeric[5] ? parseInt(numeric[5], 10) : 0;
        if (year < 100) year += 2000;
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;

        const date = new Date(year, month - 1, day, hour, minute);
        // Reject overflow days (e.g. 31 February) that Date() would otherwise roll into the next month
        if (date.getDate() !== day || date.getMonth() !== month - 1) return null;
        return date;
    }

    const withoutOrdinals = cleaned.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
    const parsed = new Date(withoutOrdinals);
    return isNaN(parsed.getTime()) ? null : parsed;
}

let lastValidDate = new Date();
metaDate.value = formatDate(lastValidDate);

metaDate.addEventListener('blur', () => {
    const value = metaDate.value.trim();
    if (value) {
        const parsed = parseDateInput(value);
        if (parsed) {
            lastValidDate = parsed;
        } else {
            alert('Could not understand that date, reverting to the last valid value.');
        }
    }
    metaDate.value = formatDate(lastValidDate);
});

// Image source modal (file upload or web URL)
function openImageModal(fileInput, callback) {
    activeFileInput = fileInput;
    activeImageCallback = callback;
    imageModal.classList.remove('hidden');
    imageModal.classList.remove('closing');
    imageModal.style.display = 'flex';
}

function closeImageModal(onComplete) {
    if (imageModal.classList.contains('hidden') || imageModal.classList.contains('closing')) {
        if (typeof onComplete === 'function') onComplete();
        return;
    }

    imageModal.classList.add('closing');
    modalCard.classList.add('closing');

    const onAnimationEnd = () => {
        imageModal.classList.add('hidden');
        imageModal.classList.remove('closing');
        modalCard.classList.remove('closing');

        imageModal.removeEventListener('animationend', onAnimationEnd);
        activeImageCallback = null;
        activeFileInput = null;
        if (typeof onComplete === 'function') onComplete();
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
    const callback = activeImageCallback;
    closeImageModal(() => {
        openUrlModal({
            title: 'Insert Image from URL',
            subtitle: 'Enter the direct web URL for the image',
            placeholder: 'https://example.com/image.jpg'
        }, (url) => {
            if (callback) callback(url);
        });
    });
});

modalCloseBtn.addEventListener('click', () => closeImageModal());
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) closeImageModal();
});

// Generic URL-entry modal
function openUrlModal({ title, subtitle, placeholder = 'https://', defaultValue = '' }, callback) {
    urlModalTitle.textContent = title;
    urlModalSubtitle.textContent = subtitle;
    urlModalInput.placeholder = placeholder;
    urlModalInput.value = defaultValue;
    activeUrlCallback = callback;

    urlModal.classList.remove('hidden');
    urlModal.classList.remove('closing');
    urlModal.style.display = 'flex';

    requestAnimationFrame(() => {
        urlModalInput.focus();
        urlModalInput.select();
    });
}

function closeUrlModal() {
    if (urlModal.classList.contains('hidden') || urlModal.classList.contains('closing')) return;

    urlModal.classList.add('closing');
    urlModalCard.classList.add('closing');

    const onAnimationEnd = () => {
        urlModal.classList.add('hidden');
        urlModal.classList.remove('closing');
        urlModalCard.classList.remove('closing');

        urlModal.removeEventListener('animationend', onAnimationEnd);
        activeUrlCallback = null;
    };

    urlModal.addEventListener('animationend', onAnimationEnd, { once: true });
}

function confirmUrlModal() {
    const value = urlModalInput.value.trim();
    const callback = activeUrlCallback;
    closeUrlModal();
    if (value && callback) {
        callback(value);
    }
}

urlModalConfirmBtn.addEventListener('click', confirmUrlModal);
urlModalCancelBtn.addEventListener('click', closeUrlModal);
urlModal.addEventListener('click', (e) => {
    if (e.target === urlModal) closeUrlModal();
});
urlModalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        confirmUrlModal();
    } else if (e.key === 'Escape') {
        closeUrlModal();
    }
});

// Uploaded images - convert to AVIF (skip GIFs)
// uses jSquash's WASM build https://github.com/jamsinclair/jSquash
let avifEncoderPromise = null;
function loadAvifEncoder() {
    if (!avifEncoderPromise) {
        avifEncoderPromise = import('https://esm.sh/@jsquash/avif@2.1.1').then(mod => mod.encode);
    }
    return avifEncoderPromise;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function convertImageToAvif(file, maxDimension = MAX_IMAGE_DIMENSION) {
    if (file.type === 'image/gif' || file.type === 'image/avif') {
        return readFileAsDataUrl(file);
    }

    if (conversionStatusEl) conversionStatusEl.classList.remove('hidden');

    try {
        const objectUrl = URL.createObjectURL(file);
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = objectUrl;
        });

        // Encode time scales with pixel count, and no article image needs more than this
        const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);

        const imageData = ctx.getImageData(0, 0, width, height);
        const encode = await loadAvifEncoder();

        const t0 = performance.now();
        const avifBuffer = await encode(imageData, { speed: 8, quality: 80 });
        const encodeMs = Math.round(performance.now() - t0);

        debugLog(`AVIF conversion: ${formatBytes(file.size)} -> ${formatBytes(avifBuffer.byteLength)} in ${encodeMs}ms (${width}x${height})`);

        return await readFileAsDataUrl(new Blob([avifBuffer], { type: 'image/avif' }));
    } catch (e) {
        console.error('AVIF conversion failed, using the original file instead:', e);
        return readFileAsDataUrl(file);
    } finally {
        if (conversionStatusEl) conversionStatusEl.classList.add('hidden');
    }
}

// Main image
function setMainImage(url) {
    mainImageUrl = url;
    mainImagePreview.src = mainImageUrl;
    mainImagePreview.classList.remove('hidden');
    mainPlus.classList.add('hidden');
    mainLabel.classList.add('hidden');
    validateArticleRequirements();
    updateOgPreview();
    saveDraft();
}

mainImageContainer.addEventListener('click', () => {
    openImageModal(mainFileInput, setMainImage);
});

mainFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        convertImageToAvif(file, MAX_MAIN_IMAGE_DIMENSION).then(setMainImage);
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
    const titlePlaceholder = 'Click to edit title';
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

// Mirrors the og:title/og:description/og:image to OG preview
function updateOgPreview() {
    if (!ogPreviewTitle) return;

    const titleText = articleTitle.innerText.trim();
    const titlePlaceholder = 'Click to edit title';
    const hasTitle = titleText.length > 0 && titleText !== titlePlaceholder;

    const subtitleText = articleSubtitle.innerText.trim();
    const subtitlePlaceholder = articleSubtitle.getAttribute('data-placeholder') || 'Click to edit subtitle';
    const hasSubtitle = subtitleText.length > 0 && subtitleText !== subtitlePlaceholder;

    ogPreviewTitle.innerText = `${hasTitle ? titleText : 'Untitled Article'} | UMKL`;
    ogPreviewDescription.innerText = hasSubtitle ? subtitleText : 'Add a subtitle to fill in this description.';
    ogPreviewImage.src = mainImageUrl;
}

// Auto-save on any edit
[articleTitle, articleSubtitle, mainCaption, bodyEditor].forEach(el => {
    if (el) {
        el.addEventListener('input', () => {
            validateArticleRequirements();
            updateOgPreview();
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
updateOgPreview();
updateStorageUsage();

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

        while (parentBlock && parentBlock !== bodyEditor && !['P', 'H3', 'BLOCKQUOTE', 'DIV'].includes(parentBlock.tagName)) {
            parentBlock = parentBlock.parentNode;
        }

        if (parentBlock && parentBlock !== bodyEditor) {
            const tag = parentBlock.tagName.toLowerCase();
            if (['p', 'h3', 'blockquote', 'div'].includes(tag)) {
                blockTypeSelect.value = tag === 'div' ? 'p' : tag;
            }
        }
    }

    // Disable toolbar controls when focused outside bodyEditor
    const controls = [blockTypeSelect, boldBtn, linkBtn, insertImageBtn, insertVideoBtn];
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
    if (linkBtn.disabled) return;

    // Preserve the selection: opening the modal moves focus to its input,
    // which would otherwise clear the range createLink needs to wrap.
    const sel = window.getSelection();
    const range = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;

    openUrlModal({
        title: 'Insert Link',
        subtitle: 'Enter the URL for the selected text',
        placeholder: 'https://umkl.co.uk',
        defaultValue: ''
    }, (url) => {
        bodyEditor.focus();
        if (range) {
            const restoredSel = window.getSelection();
            restoredSel.removeAllRanges();
            restoredSel.addRange(range);
        }
        document.execCommand('createLink', false, url);
    });
});

blockTypeSelect.addEventListener('change', (e) => {
    if (!blockTypeSelect.disabled) {
        const tag = e.target.value;
        if (document.queryCommandSupported('defaultParagraphSeparator')) {
            document.execCommand('defaultParagraphSeparator', false, 'p');
        }
        document.execCommand('formatBlock', false, `<${tag}>`);
    }
});

bodyEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && document.queryCommandSupported('defaultParagraphSeparator')) {
        document.execCommand('defaultParagraphSeparator', false, 'p');
    }
});

// Body images
function insertBlockToBody(block) {
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
            currentBlock.after(block);
            block.after(p);
        } else {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            bodyEditor.appendChild(block);
            bodyEditor.appendChild(p);
        }
    }
    saveDraft();
}

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
    insertBlockToBody(imageBlock);
}

insertImageBtn.addEventListener('click', () => {
    if (!insertImageBtn.disabled) {
        openImageModal(bodyFileInput, insertImageToBody);
    }
});

bodyFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        convertImageToAvif(file).then(insertImageToBody);
    }
});

// Video (YouTube embeds)
function getYouTubeVideoId(url) {
    const match = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function insertVideoToBody(videoId) {
    const videoBlock = document.createElement('div');
    videoBlock.className = 'article-video-container';
    videoBlock.setAttribute('contenteditable', 'false');
    videoBlock.innerHTML = `
        <div class="article-video-wrapper">
            <button type="button" class="btn-remove-image btn-remove-video" title="Remove video">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="article-video-embed">
                <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="YouTube video player"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen></iframe>
            </div>
            <span class="article-image-caption" contenteditable="true">Lorem ipsum dolor sit amet</span>
        </div>
    `;
    insertBlockToBody(videoBlock);
}

insertVideoBtn.addEventListener('click', () => {
    if (insertVideoBtn.disabled) return;

    openUrlModal({
        title: 'Insert YouTube Video',
        subtitle: 'Paste a YouTube video URL',
        placeholder: 'https://www.youtube.com/watch?v=ZcGLlh8WkDA&pp=0gcJCRoMAYcqIYzv'
    }, (url) => {
        const videoId = getYouTubeVideoId(url);
        if (!videoId) {
            alert("Couldn't find a YouTube video in that URL. Try a link like https://www.youtube.com/watch?v=ZcGLlh8WkDA&pp=0gcJCRoMAYcqIYzv");
            return;
        }
        insertVideoToBody(videoId);
    });
});

bodyEditor.addEventListener('click', (e) => {
    if (e.target.closest('.btn-remove-image')) {
        const container = e.target.closest('.article-image-container, .article-video-container');
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


function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

saveBtn.addEventListener('click', async () => {
    // Derive the folder name from the article title instead of asking
    const folderName = slugify(articleTitle.textContent.trim()) || 'untitled-article';

    const zip = new JSZip();

    // Format date for folder name and json date (YYYY-MM-DD)
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const dateFormattedString = `${year}-${month}-${day}`;

    // Path format: news/YYYY-MM-DD/folder-name/
    const targetFolder = zip.folder(`news/${dateFormattedString}/${folderName}`);

    let imageCounter = 1;
    let finalMainImageUrl = mainImageUrl;

    // Main image
    if (mainImageUrl.startsWith('data:image')) {
        const extension = mainImageUrl.substring("data:image/".length, mainImageUrl.indexOf(";base64"));
        const fileName = `main-image.${extension}`;
        const blob = dataURLtoBlob(mainImageUrl);
        targetFolder.file(fileName, blob);
        finalMainImageUrl = `/news/${dateFormattedString}/${folderName}/${fileName}`;
    }

    // Body and body images
    const bodyClone = bodyEditor.cloneNode(true);
    bodyClone.querySelectorAll('.btn-remove-image').forEach(btn => btn.remove());

    const bodyImages = bodyClone.querySelectorAll('img');
    bodyImages.forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('data:image')) {
            const extension = src.substring("data:image/".length, src.indexOf(";base64"));
            const fileName = `image-${imageCounter++}.${extension}`;
            const blob = dataURLtoBlob(src);
            targetFolder.file(fileName, blob);
            img.setAttribute('src', `/news/${dateFormattedString}/${folderName}/${fileName}`);
        }
    });

    // Metadata
    const title = articleTitle.textContent.trim() || 'Untitled Article';
    const subtitle = articleSubtitle.textContent.trim();
    const mainCapText = mainCaption.textContent.trim();
    const author = metaAuthor.value.trim() || 'Anonymous';
    const dateStr = metaDate.value.trim() || formatDate(lastValidDate);
    const bodyContent = bodyClone.innerHTML.trim();

    const rawTags = metaTags.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const tagsMarkup = rawTags.length > 0
        ? rawTags.map(tag => `                        <tag translate="no">${tag}</tag>`).join('\n')
        : '                        <tag translate="no">News</tag>';

    // index.html file inside the .zip folder
    const htmlContent = outputDocument({
        title,
        subtitle,
        mainImageUrl: finalMainImageUrl,
        mainCaption: mainCapText,
        bodyContent,
        date: dateStr,
        author,
        tagsMarkup
    });
    targetFolder.file("index.html", htmlContent);

    // Create a json entry
    // This is stored in a separate file but can be pasted into news.json
    const articleLink = `/news/${dateFormattedString}/${folderName}/`;
    const newsJsonEntry = {
        title: title,
        link: articleLink,
        date: dateFormattedString,
        image: finalMainImageUrl,
        alt: mainCapText,
        description: subtitle,
        tags: rawTags.length > 0 ? rawTags : ["News"]
    };

    zip.file("news_entry.json", JSON.stringify(newsJsonEntry, null, 4));

    // Compile a .zip to be downloaded
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.revokeObjectURL(zipBlob);
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${dateFormattedString}-${folderName}-article.zip`;
    downloadLink.click();
    URL.revokeObjectURL(downloadLink.href);
});
