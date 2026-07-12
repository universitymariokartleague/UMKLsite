/*
    This script is for a tools page where you tracks can be randomised, 
    with the option to disable repicks. It also has the option to show PAL names
    for tracks that have different names in PAL regions.
*/

import { disableThemeShortcut, disableSettingsShortcut } from './settings.js';
import { TRACKS as tracks } from './tracknames.js';

const gameSelect = document.getElementById("game-select");
const tracksContainer = document.getElementById("results");
const pickedTracksList = document.getElementById("pickedTracks");
const pickRandomTrackButton = document.getElementById("pickRandomTrack");
const clearRepicksButton = document.getElementById("clearRepicks");
const PALNamesCheckbox = document.getElementById("palNames");

let tracksPicked = [];
let lastTrack = null;

let isKeyPressed = false;
let keySequence = [];
const CTSequence = ['c', 't', 'g', 'p','r'];
const RRSequence = ['r', 'e', 't', 'r','o'];
const routesSequence = ['r','o','u','t','e'];

function pickRandomTrack() {
    const selectedGame = gameSelect.value;
    const trackList = tracks[selectedGame];
    let tempRandomTrack = trackList[Math.floor(Math.random() * trackList.length)];
    if (tracksPicked.length < tracks[selectedGame].length) {
        lastTrack = tempRandomTrack;
    }

    if (document.getElementById("disableRepicks").checked) {
        let tempTracksList = tracksPicked.slice().reverse();
        if (tracksPicked.length == tracks[selectedGame].length) {
            pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Max courses! Please clear!<br>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;
            return;
        }
        while (tracksPicked.includes(tempRandomTrack)) {
            tempRandomTrack = trackList[Math.floor(Math.random() * trackList.length)];
        }
        lastTrack = tempRandomTrack;
        tracksPicked.push(tempRandomTrack);
        tempTracksList = tracksPicked.slice().reverse();
        pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Picked courses (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;
    }

    if (tempRandomTrack.us) {
        if (PALNamesCheckbox.checked) {
            tempRandomTrack = tempRandomTrack.pal;
        } else {
            tempRandomTrack = tempRandomTrack.us;
        }
    }
    tracksContainer.innerHTML = `${tempRandomTrack}`;
}

function rerender(selectedGame) {
    if (document.getElementById("disableRepicks").checked) {
        if (tracksPicked.length == tracks[selectedGame].length) {
            let tempTracksList = tracksPicked.slice().reverse();
            pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Max tracks! Please clear!<br>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;
        } else {
            let tempTracksList = tracksPicked.slice().reverse();
            pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;    
        }
    }
    tracksContainer.innerHTML = `${lastTrack.us ? (PALNamesCheckbox.checked ? lastTrack.pal : lastTrack.us) : lastTrack}`;
}

function enableCTs() {
    const option = document.createElement("option");
    option.value = "CTGPR";
    option.textContent = "CTGP Revolution (Wii)";
    option.id = "ctgpr-option";

    const wiiOption = gameSelect.querySelector('option[value="Wii"]');
    if (wiiOption) {
        gameSelect.insertBefore(option, wiiOption.nextElementSibling);
    } else {
        gameSelect.appendChild(option);
    }

    gameSelect.value = "CTGPR"
    clearRepicks();
}

function enableRR() {
    const option = document.createElement("option");
    option.value = "RR";
    option.textContent = "Retro Rewind (Wii)";
    option.id = "rr-option";

    const wiiOption = gameSelect.querySelector('option[value="Wii"]');
    if (wiiOption) {
        gameSelect.insertBefore(option, wiiOption.nextElementSibling);
    } else {
        gameSelect.appendChild(option);
    }

    gameSelect.value = "RR"
    clearRepicks();
}

function enableMKWRoutes() {
    const option = document.createElement("option");
    option.value = "WORLD_ROUTES";
    option.textContent = "Mario Kart World - Routes Only (NS2)";
    option.id = "ns2-routes-option";

    const worldOption = gameSelect.querySelector('option[value="WORLD"]');
    if (worldOption) {
        gameSelect.insertBefore(option, worldOption.nextElementSibling);
    } else {
        gameSelect.appendChild(option);
    }

    gameSelect.value = "WORLD_ROUTES"
    clearRepicks();
}

function clearRepicks() {
    tracksPicked = [];
    tracksContainer.innerHTML = "Nothing picked";
    pickedTracksList.innerHTML = "";
}

gameSelect.addEventListener("change", function () {
    clearRepicks();
});

document.addEventListener("DOMContentLoaded", () => {
    const tempLocale = localStorage.getItem("locale") || "en-GB";
    PALNamesCheckbox.checked = tempLocale == "en-GB";
});

pickRandomTrackButton.addEventListener("click", pickRandomTrack);
clearRepicksButton.addEventListener("click", clearRepicks);
PALNamesCheckbox.addEventListener("click", function () {
    const selectedGame = gameSelect.value;
    rerender(selectedGame);
});

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (!isKeyPressed) {
        disableThemeShortcut();
        disableSettingsShortcut();
        keySequence.push(key);
        if (keySequence.length > CTSequence.length) {
            keySequence.shift();
        }
        if (keySequence.join('') == CTSequence.join('')) {
            enableCTs();
        }
        if (keySequence.join('') == RRSequence.join('')) {
            enableRR();
        }
        if (keySequence.join('') == routesSequence.join('')){
            enableMKWRoutes();
        }
    }
});

document.addEventListener('keyup', () => {
    isKeyPressed = false;
});
