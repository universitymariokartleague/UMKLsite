export { isWindowsOrLinux, copyTextToClipboard, copyImageToClipboard, shareImage, showImagePreview };

let previewTimeout = null;

function isWindowsOrLinux() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.platform.includes('Windows') || navigator.userAgentData.platform.includes('Linux');
    }
    return navigator.userAgent.includes('Windows') || navigator.userAgent.includes('Linux');
}

async function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        console.debug(`%cshareAPIhelper.js %c> %cClipboard API not supported`, "color:#525eff", "color:#fff", "color:#969dff");
        return false;
    }
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.debug(`%cshareAPIhelper.js %c> %cFailed to copy text to clipboard ${err}`, "color:#525eff", "color:#fff", "color:#969dff");
        return false;
    }
}

async function copyImageToClipboard(blob) {
    if (!navigator.clipboard || !window.ClipboardItem) {
        console.debug(`%cshareAPIhelper.js %c> %cClipboard API not supported`, "color:#525eff", "color:#fff", "color:#969dff");
        return false;
    }
    try {
        const clipboardItem = new ClipboardItem({
            [blob.type]: blob
        });
        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch (err) {
        console.debug(`%cshareAPIhelper.js %c> %cFailed to copy image to clipboard ${err}`, "color:#525eff", "color:#fff", "color:#969dff");
        return false;
    }
}

async function shareImage(title, filename, text, blob) {
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
        console.debug(`%cshareAPIhelper.js %c> %cShared successfully`, "color:#525eff", "color:#fff", "color:#969dff");
    } catch (error) {
        console.debug(`%cshareAPIhelper.js %c> %cError: ${error}`, "color:#525eff", "color:#fff", "color:#969dff");
    };
};

function showImagePreview(blob) {
    cleanupPreview();
    const buttonRect = shareButton.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    const preview = document.createElement('div');
    preview.classList.add('image-preview');
    preview.style.left = `${Math.max(10, buttonRect.left + scrollX + buttonRect.width/2 - 110)}px`;
    preview.style.top = `${buttonRect.bottom + scrollY + 10}px`;

    const arrow = document.createElement('div');
    arrow.classList.add('arrow');
    
    const arrowBorder = document.createElement('div');
    arrowBorder.classList.add('arrow-border');
    
    const img = document.createElement('img');
    const blobUrl = URL.createObjectURL(blob);
    img.src = blobUrl;
    img.classList.add('preview-image');
    img.addEventListener('click', () => {
        window.open(blobUrl, '_blank');
    });
    
    const message = document.createElement('div');
    message.innerText = generateMessage();
    message.classList.add('preview-message');
    
    preview.appendChild(arrow);
    preview.appendChild(arrowBorder);
    preview.appendChild(img);
    preview.appendChild(message);
    document.addEventListener('click', handleDocumentClick);
    document.body.appendChild(preview);

    currentPreview = preview;
    isPopupShowing = true;
    
    setTimeout(() => {
        if (preview.parentNode) {
            preview.style.transform = 'scale(1) translateY(0)';
            preview.style.opacity = '1';
        }
    }, 10);
    
    previewTimeout = setTimeout(() => {
        if (preview.parentNode) {
            preview.style.transform = 'scale(0.95) translateY(-10px)';
            preview.style.opacity = '0';
            setTimeout(() => {
                cleanupPreview();
            }, 150);
        } else {
            cleanupPreview();
        }
    }, 3000);
}

function cleanupPreview() {
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }

    if (currentPreview) {
        if (currentPreview.parentNode) {
            currentPreview.remove();
        }
        const img = currentPreview.querySelector('img');
        if (img?.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
        currentPreview = null;
        isPopupShowing = false;
        shareButton.innerHTML = originalMessage;
    }
}