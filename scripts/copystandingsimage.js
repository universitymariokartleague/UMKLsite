
const shareButton = document.getElementById("shareButton");

async function copyImageToClipboard(blob) {
    const clipboardItem = new ClipboardItem({
            [blob.type]: blob
        });
    await navigator.clipboard.write([clipboardItem]);
    return true;
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
        console.log("Shared successfully");
    } catch (err) {
        console.error(`Error: ${err}`);
    };
};

function isWindowsOrLinux() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.platform.includes('Windows') || navigator.userAgentData.platform.includes('Linux');
    }
    return navigator.userAgent.includes('Windows') || navigator.userAgent.includes('Linux');
}

shareButton.addEventListener("click", async () => {
    const blob = await fetch('https://umkl.co.uk/assets/pythongraphics/output/team_standings.png').then(r=>r.blob())
    
    if (isWindowsOrLinux()) {
        const success = await copyImageToClipboard(blob);
        if (success) {
            let originalMessage = shareButton.innerText
            setTimeout(() => {
                shareButton.innerText = originalMessage;
            }, 2000);
            shareButton.innerText = "Image copied to clipboard!";
        }
    } else {
        shareImage(
            "UMKL Team Standings", 
            "Check out the latest team standings in the UMKL!", 
            blob
        );
    }
});

