/*
    This script providers helper functions for shareAPI calls from
    other scripts.
*/

import { createDebugLogger } from '/assets/scripts/utils/debuglogger.js';

const debugLog = createDebugLogger('shareAPIhelper.js', '#525eff', '#969dff');
export { isWindowsOrLinux, copyTextToClipboard, copyImageToClipboard, shareText, shareImage, showTextPopup, showImagePreview, setOriginalMessage, getOriginalMessage, getIsPopupShowing };

let previewTimeout = null;
let isPopupShowing = false;
let currentPreview = null;
let originalMessage = "";

function isWindowsOrLinux() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.platform.includes('Windows') || navigator.userAgentData.platform.includes('Linux');
    }
    return navigator.userAgent.includes('Windows') || navigator.userAgent.includes('Linux');
}

function setOriginalMessage(input) {
    originalMessage = input;
}

function getOriginalMessage() {
    return originalMessage;
}

function getIsPopupShowing() {
    return isPopupShowing;
}

async function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        debugLog(`Clipboard API not supported`);
        return false;
    }
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        debugLog(`Failed to copy text to clipboard ${err}`);
        return false;
    }
}

async function copyImageToClipboard(blob) {
    if (!navigator.clipboard || !window.ClipboardItem) {
        debugLog(`Clipboard API not supported`);
        return false;
    }
    try {
        const clipboardItem = new ClipboardItem({
            [blob.type]: blob
        });
        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch (err) {
        debugLog(`Failed to copy image to clipboard ${err}`);
        return false;
    }
}

async function shareText(title, text) {
    const shareData = {
        title: title,
        text: text,
    };

    try {
        await navigator.share(shareData);
        debugLog(`Shared successfully`);
    } catch (error) {
        debugLog(`Error: ${error}`);
    };
};

async function shareImage(title, text, blob, filename) {
    const shareData = {
        files: [
            new File([blob], filename, {
                type: blob.type,
            })
        ],
        title: title,
        text: text,
    };

    try {
        await navigator.share(shareData);
        debugLog(`Shared successfully`);
    } catch (error) {
        debugLog(`Error: ${error}`);
    };
};

function showTextPopup(input) {
    showPreview(input, false);
}

function showImagePreview(blob, imagePath, input) {
    showPreview(input, true, imagePath, blob);
}

function showPreview(message, isImage, imagePath, blob) {
    cleanupPreview();

    const buttonRect = shareButton.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const preview = document.createElement('div');
    preview.className = `preview ${isImage ? 'image-preview' : 'text-preview'}`;
    preview.style.left = `${Math.max(10, buttonRect.left + scrollX + buttonRect.width / 2 - 110)}px`;
    preview.style.top = `${buttonRect.bottom + scrollY + 10}px`;

    preview.innerHTML = `
        <div class="arrow"></div>
        <div class="arrow-border"></div>
    `;

    if (isImage && blob) {
        const img = document.createElement('img');
        const blobUrl = URL.createObjectURL(blob);
        img.src = blobUrl;
        img.className = 'preview-image';
        img.addEventListener('click', () => window.open(imagePath || blobUrl, '_blank'));
        preview.appendChild(img);
        preview._blobUrl = blobUrl; // Store to revoke later
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `preview-message${isImage ? ' preview-message-image' : ''}`;
    msgDiv.innerHTML = message;
    preview.appendChild(msgDiv);

    document.body.appendChild(preview);
    currentPreview = preview;
    isPopupShowing = true;

    const closePreview = () => {
        if (!preview.parentNode) return;
        preview.style.transform = 'scale(0.95) translateY(-10px)';
        preview.style.opacity = '0';
        document.removeEventListener('mousedown', handleClickOutside);
        setTimeout(cleanupPreview, 150);
    };

    const handleClickOutside = (e) => {
        if (!preview.contains(e.target)) closePreview();
    };

    const handlePress = (e) => {
        const key = e.key.toLowerCase();

        if (key == 's') closePreview();
    };

    setTimeout(() => {
        preview.style.transform = 'scale(1) translateY(0)';
        preview.style.opacity = '1';
    }, 10);

    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    setTimeout(() => document.addEventListener('keydown', handlePress), 0);
    previewTimeout = setTimeout(closePreview, 3000);
}

function cleanupPreview() {
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
        shareButton.innerHTML = originalMessage;
    }

    if (currentPreview) {
        if (currentPreview._blobUrl) {
            URL.revokeObjectURL(currentPreview._blobUrl);
        }
        currentPreview.remove();
        currentPreview = null;
    }

    isPopupShowing = false;
}