
const shareButton = document.getElementById("shareButton");

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

shareButton.addEventListener("click", async () => {
    const blob = await fetch('https://umkl.co.uk/assets/pythongraphics/output/team_standings.png').then(r => r.blob());
    const originalMessage = shareButton.innerText;

    if (isWindowsOrLinux() || !navigator.canShare) {
        const success = await copyImageToClipboard(blob);
        shareButton.innerText = success ? "Image copied to clipboard!" : "Failed to copy!";
    } else {
        await shareImage(
            "UMKL Team Standings",
            "Check out the latest team standings in the UMKL!",
            blob
        );
    }

    setTimeout(() => {
        shareButton.innerText = originalMessage;
    }, 2000);
});