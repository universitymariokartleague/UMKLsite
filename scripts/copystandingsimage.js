/*
    This script handles the sharing of images using the Web Share API or the Clipboard API.
    Since the web share API doesn't work well on Windows/Linux, they get a nice little
    preview of the image before it's copied to the clipboard instead. It works as expected 
    on mobile devices and MacOS.

    The preview is a small popup that shows the image and a message indicating 
    that it has been copied.
*/

import { isWindowsOrLinux, copyImageToClipboard, shareImage, showImagePreview } from "./shareAPIhelper.js";

const shareButton = document.getElementById("shareButton");
const currentSeason = document.getElementById("season-select");
const originalMessage = shareButton.innerHTML;

let isPopupShowing = false;
let currentPreview = null;

function generateMessage() {
    const randomChance = Math.random();
    return randomChance < 0.01
        ? `今、イースターエッグはないけど... シーズン${currentSeason.value}の結果を見てよ！`
        : `Take a look at Season ${currentSeason.value}'s team standings in the University Mario Kart League!`;
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
                `team_standings_season${currentSeason.value}.png`,
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