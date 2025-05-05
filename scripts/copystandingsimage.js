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

function cleanupPreview() {
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }
    
    if (currentPreview) {
        try {
            if (document.body.contains(currentPreview)) {
                currentPreview.remove();
            }
            const img = currentPreview.querySelector('img');
            if (img && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        } catch (error) {
            console.debug(`%ccopystandingsimage.js %c> %cError cleaning up preview: ${error}`, "color:#525eff", "color:#fff", "color:#969dff");
        } finally {
            currentPreview = null;
            isPopupShowing = false;
            shareButton.innerHTML = originalMessage;
        }
    }
}

function showImagePreview(blob) {
    cleanupPreview();

    const buttonRect = shareButton.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    const preview = document.createElement('div');
    preview.style.position = 'absolute'; // Changed from 'fixed' to 'absolute'
    preview.style.left = `${Math.max(10, buttonRect.left + scrollX + buttonRect.width/2 - 110)}px`;
    preview.style.top = `${buttonRect.bottom + scrollY + 10}px`;
    preview.style.zIndex = '1';
    preview.style.padding = '10px 10px 6px 10px';
    preview.style.backgroundColor = 'var(--bg-color)';
    preview.style.borderRadius = '10px';
    preview.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    preview.style.border = '1px solid #ccccccaa';
    preview.style.transform = 'scale(0.8) translateY(-20px)';
    preview.style.transformOrigin = 'center top';
    preview.style.opacity = '0';
    preview.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0.1, 1), opacity 0.2s cubic-bezier(0.2, 0, 0.1, 1)';
    
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.top = '-8px';
    arrow.style.left = '50%';
    arrow.style.transform = 'translateX(-50%)';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '8px solid transparent';
    arrow.style.borderRight = '8px solid transparent';
    arrow.style.borderBottom = '8px solid var(--bg-color)';
    arrow.style.borderTop = 'none';
    arrow.style.zIndex = '2'; // Make sure it's above the border
    
    // Create border arrow
    const arrowBorder = document.createElement('div');
    arrowBorder.style.position = 'absolute';
    arrowBorder.style.top = '-9px'; // 1px above the main arrow
    arrowBorder.style.left = '50%';
    arrowBorder.style.transform = 'translateX(-50%)';
    arrowBorder.style.width = '0';
    arrowBorder.style.height = '0';
    arrowBorder.style.borderLeft = '9px solid transparent'; // 1px larger
    arrowBorder.style.borderRight = '9px solid transparent'; // 1px larger
    arrowBorder.style.borderBottom = '9px solid #ccccccaa'; // Your border color
    arrowBorder.style.borderTop = 'none';
    arrowBorder.style.zIndex = '1'; // Behind the main arrow
    
    // Add both to preview
    preview.appendChild(arrowBorder);
    preview.appendChild(arrow);    
    const img = document.createElement('img');
    const blobUrl = URL.createObjectURL(blob);
    img.src = blobUrl;
    img.style.width = '200px';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.borderRadius = '4px';
    img.style.cursor = 'pointer';
    
    img.addEventListener('click', () => {
        window.open(blobUrl, '_blank');
    });
    
    const message = document.createElement('div');
    message.innerText = "Image copied to clipboard";
    message.style.marginTop = '4px';
    message.style.fontSize = '12px';
    message.style.color = 'var(--text-color)';
    message.style.textAlign = 'center';
    
    preview.appendChild(arrow);
    preview.appendChild(img);
    preview.appendChild(message);
    document.body.appendChild(preview);
    
    currentPreview = preview;
    isPopupShowing = true;
    
    setTimeout(() => {
        if (preview.parentNode) { // Check if still attached
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
            }, 300);
        } else {
            cleanupPreview();
        }
    }, 2000);
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
                "Check out the latest team standings in the UMKL!",
                blob
            );
        }

        setTimeout(() => {
            shareButton.innerHTML = originalMessage;
        }, 2000);
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

// Clean up when the page is unloaded
window.addEventListener('beforeunload', () => {
    cleanupPreview();
});