/*
    This script handles the sharing of images using the Web Share API or the Clipboard API.
    Since the web share API doesn't work well on Windows/Linux, those platforms get a small
    preview of the image before it's copied to the clipboard. 
    It works as expected on mobile devices and MacOS.

    The preview is a small popup that shows the image and a message indicating 
    that it has been copied.
*/
import { isWindowsOrLinux, copyImageToClipboard, shareImage, showImagePreview, setOriginalMessage, getOriginalMessage, getIsPopupShowing } from "./shareAPIhelper.js";
import { generateTeamStandingsImage } from './generateteamstandingsimage.js';

const shareButton = document.getElementById("shareButton");
const currentSeason = document.getElementById("season-select");
setOriginalMessage(shareButton.innerHTML);

let blob;

function generateMessage() {
    const randomChance = Math.random();
    return randomChance < 0.01
        ? `初音ミクが語るUMKLシーズン${currentSeason.value}！`
        : `Take a look at Season ${currentSeason.value}'s team standings in the University Mario Kart League!`;
}

shareButton.addEventListener("click", async () => {    
    if (getIsPopupShowing()) return;

    try {
        const useClipboard = isWindowsOrLinux() || !navigator.canShare;
        if (useClipboard) shareButton.innerHTML = "Generating image...";

        if (useClipboard) {
            if (!blob) {
                blob = await generateTeamStandingsImage(currentSeason.value);
            }
            const success = await copyImageToClipboard(blob);
            shareButton.innerText = success ? "Image copied to clipboard!" : "Failed to copy!";
            if (success) {
                showImagePreview(blob, blob.url, generateMessage());
            } else {
                setTimeout(() => {
                    shareButton.innerHTML = getOriginalMessage();
                }, 2000);
            }
        } else {
            await shareImage(
                "UMKL Team Standings",
                generateMessage(),
                blob,
                `team_standings_season_${currentSeason.value}.png`,
            );
        }

    } catch (error) {
        console.error('Error in share button click:', error);
        shareButton.innerText = "Error occurred!";
        setTimeout(() => {
            shareButton.innerHTML = getOriginalMessage();
        }, 2000);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    blob = await generateTeamStandingsImage(currentSeason.value);
});