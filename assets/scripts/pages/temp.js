// --- ELEMENTS ---
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
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    const splashProgressBar = document.getElementById('splashProgressBar');
    const splashTip = document.getElementById('splashTip');




    // Simulate progress sequence during cache initialization
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

// Restore saved data on load
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

// Clear draft when article is successfully exported or cleared
function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
}

// --- STATE ---
let mainImageUrl = "https://mario.wiki.gallery/images/thumb/4/48/MK8DX_Nintendo_Wallpaper_1.jpg/1600px-MK8DX_Nintendo_Wallpaper_1.jpg";
let activeImageCallback = null;
let activeFileInput = null;

// Default UTC date initialization
const now = new Date();
const formattedDate = `${now.getUTCDate()} ${now.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })}, ${now.getUTCFullYear()} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;
metaDate.innerText = formattedDate;

// --- IMAGE MODAL LOGIC ---
function openImageModal(fileInput, callback) {
    activeFileInput = fileInput;
    activeImageCallback = callback;
    imageModal.classList.remove('hidden');
}

function closeImageModal() {
    imageModal.classList.add('hidden');
    activeImageCallback = null;
    activeFileInput = null;
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

// --- MAIN IMAGE HANDLING ---
function setMainImage(url) {
    mainImageUrl = url;
    mainImagePreview.src = mainImageUrl;
    mainImagePreview.classList.remove('hidden');
    if (mainPlus) mainPlus.classList.add('hidden');
    if (mainLabel) mainLabel.classList.add('hidden');
    validateArticleRequirements();
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

// --- REQUIREMENTS & WORD COUNT CHECKLIST ---
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

// --- TOOLBAR STATE ---
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

    const controls = [blockTypeSelect, boldBtn, linkBtn, insertImageBtn];
    controls.forEach(ctrl => {
        if (ctrl) {
            ctrl.disabled = !isBodyActive;
            ctrl.style.opacity = isBodyActive ? '1' : '0.4';
            ctrl.style.cursor = isBodyActive ? 'pointer' : 'not-allowed';
        }
    });
}

document.addEventListener('selectionchange', updateToolbarState);
document.addEventListener('focusin', updateToolbarState);
updateToolbarState();

// --- RICH TEXT ---
boldBtn.addEventListener('click', () => {
    if (!boldBtn.disabled) document.execCommand('bold', false, null);
});

linkBtn.addEventListener('click', () => {
    if (!linkBtn.disabled) {
        const url = prompt('Enter the link URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
    }
});

blockTypeSelect.addEventListener('change', (e) => {
    if (!blockTypeSelect.disabled) {
        document.execCommand('formatBlock', false, `<${e.target.value}>`);
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
        const range = sel.getRangeAt(0);
        let currentBlock = range.startContainer;
        if (currentBlock.nodeType === 3) currentBlock = currentBlock.parentNode;

        while (currentBlock && currentBlock.parentNode !== bodyEditor && currentBlock !== bodyEditor) {
            currentBlock = currentBlock.parentNode;
        }

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
    validateArticleRequirements();
}

insertImageBtn.addEventListener('click', () => {
    if (!insertImageBtn.disabled) openImageModal(bodyFileInput, insertImageToBody);
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
            validateArticleRequirements();
        }
    }
});

// --- ACTIONS & EXPORT ---
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
    }
});

exitBtn.addEventListener('click', () => {
        window.location.href = '/tools/';
});

if (homeLink) {
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = homeLink.href;
        
    });
}

saveBtn.addEventListener('click', () => {
    const { isValid, passedCount, totalChecks } = validateArticleRequirements();

    if (!isValid) {
        alert(`You have completed ${passedCount} of ${totalChecks} export requirements. Please complete all checklist items before exporting.`);
        return;
    }

    const title = articleTitle.textContent.trim() || 'Untitled Article';
    const subtitle = articleSubtitle.textContent.trim();
    const caption = mainCaption.textContent.trim();
    const author = metaAuthor.value.trim() || 'Anonymous';
    const date = metaDate.innerText;

    const rawTags = metaTags.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const tagsMarkup = rawTags.length > 0
        ? rawTags.map(tag => `                        <tag translate="no">${tag}</tag>`).join('\n')
        : '                        <tag translate="no">News</tag>';

    const clone = bodyEditor.cloneNode(true);
    clone.querySelectorAll('.btn-remove-image').forEach(btn => btn.remove());
    const bodyContent = clone.innerHTML.trim();

    const outputDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} | UMKL</title>
    <meta name="description" content="${subtitle}">
    <link rel="stylesheet" href="/assets/css/pages/newsarticle.css">
</head>
<body>
    <main class="article-main">
        <h1>${title}</h1>
        <h2>${subtitle}</h2>
        <img src="${mainImageUrl}" />
        <p>${caption}</p>
        <div>${bodyContent}</div>
        <div>Date: ${date} | Author: ${author}</div>
        <div>${tagsMarkup}</div>
    </main>
</body>
</html>`;

    const blob = new Blob([outputDocument], { type: 'text/html' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
    downloadLink.click();
    URL.revokeObjectURL(downloadLink.href);
});