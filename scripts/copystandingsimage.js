/*
    This script handles the sharing of images using the Web Share API or the Clipboard API.
    Since the web share API is doesn't work well on Windows/Linux, they get a nice little
    preview of the image before it's copied to the clipboard instead. It works as expected 
    on mobile devices and MacOS.

    The preview is a small popup that shows the image and a message indicating 
    that it has been copied.
*/

const shareButton = document.getElementById("shareButton");
const currentSeason = document.getElementById("season-select");
const originalMessage = shareButton.innerHTML;

let isPopupShowing = false;
let currentPreview = null;
let previewTimeout = null;

async function copyImageToClipboard(blob) {
    if (!navigator.clipboard || !window.ClipboardItem) {
        console.debug(`%ccopystandingsimage.js %c> %cClipboard API not supported`, "color:#525eff", "color:#fff", "color:#969dff");
        return false;
    }
    try {
        const clipboardItem = new ClipboardItem({
            [blob.type]: blob
        });
        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch (err) {
        console.error("Failed to copy image to clipboard:", err);
        return false;
    }
}

function generateMessage() {
    const randomChance = Math.random();
    return randomChance < 0.01
        ? `今、イースターエッグはないけど...シーズン${currentSeason.value}の結果を見てよ！`
        : `Take a look at Season ${currentSeason.value}'s team standings in the University Mario Kart League!`;
}

async function shareImage(title, text, blob) {
    const shareData = {
        files: [
            new File([blob], "team_standings.png", {
                type: blob.type,
            })
        ],
        title: title,
        text: text,
    };

    try {
        await navigator.share(shareData);
        console.debug(`%ccopystandingsimage.js %c> %cShared successfully`, "color:#525eff", "color:#fff", "color:#969dff");
    } catch (error) {
        console.debug(`%ccopystandingsimage.js %c> %cError: ${error}`, "color:#525eff", "color:#fff", "color:#969dff");
    };
};

function isWindowsOrLinux() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.platform.includes('Windows') || navigator.userAgentData.platform.includes('Linux');
    }
    return navigator.userAgent.includes('Windows') || navigator.userAgent.includes('Linux');
}

function handleDocumentClick(event) {
    if (isPopupShowing && currentPreview && !currentPreview.contains(event.target) && event.target !== shareButton) {
        if (currentPreview.parentNode) {
            currentPreview.style.transform = 'scale(0.95) translateY(-10px)';
            currentPreview.style.opacity = '0';
            setTimeout(() => {
                cleanupPreview();
            }, 150);
        } else {
            cleanupPreview();
        }
    }
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

shareButton.addEventListener("click", async () => {    
    if (isPopupShowing) return;
    
    try {
        const useClipboard = isWindowsOrLinux() || !navigator.canShare;

        if (useClipboard) shareButton.innerHTML = "Loading shareable image...";
        const blob = await fetch(`assets/pythongraphics/output/team_standings_season${currentSeason.value}.png`).then(r => r.blob());
        if (useClipboard) {
            const success = await copyImageToClipboard(blob);
            shareButton.innerText = success ? "Image copied to clipboard!" : "Failed to copy!";

            if (success) {
                showImagePreview(blob);
            }
        } else {
            await shareImage(
                "UMKL Team Standings",
                generateMessage(),
                blob
            );
        }
    } catch (error) {
        console.error('Error in share button click:', error);
        shareButton.innerText = "Error occurred!";
        setTimeout(() => {
            shareButton.innerHTML = originalMessage;
        }, 2000);
    }
});

currentSeason.addEventListener("change", () => {
    cleanupPreview();
});

window.addEventListener('beforeunload', () => {
    cleanupPreview();
});