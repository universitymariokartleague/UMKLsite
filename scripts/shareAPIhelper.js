export { isWindowsOrLinux, copyTextToClipboard, copyImageToClipboard, shareImage };

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