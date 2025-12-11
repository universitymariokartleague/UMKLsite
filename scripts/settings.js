/*
    This script manages the settings panel for the website. It creates a settings 
    menu that allows users to change the theme, locale, and various other settings.
    It saves the settings in local storage and applies them to the page. 
*/

import { halloweenEasterEgg, winterEasterEgg } from './eastereggs.js';
export { toggleSettingsPanel, disableThemeShortcut, disableSettingsShortcut  }

const settingsBoxHTML = `
    <div class="hidden BGBlur" id="BGBlur"></div>
    <div translate="no" class="hidden hide-settings-box" id="settingsBox" data-overlayscrollbars-initialize>
        <div class="settings-box-close-button">
            <button id="settings-box-close-button">Close</button>
        </div>
        <div translate="yes" class="settings-title">Settings</div>
        <div class="setting-options" id="settingsBoxJS"></div>
    </div>
`;

const cookiesBox = `
    <dialog open class="cookie-popup" id="cookie-popup">
        <p style="margin: 0 0 5px 0;">
            This site uses cookies to store your preferences. Cloudflare is also used for site analytics.
            By using this site, you agree to these uses.<br>
            You can read our privacy policy <a href="pages/privacy/">here</a>.
        </p>
        <form method="dialog">
            <button id="cookieAccept">OK</button> 
            <button id="cookieSettings">Settings</button>
        </form>
    </dialog>
`;

document.body.insertAdjacentHTML('beforeend', settingsBoxHTML);

const BGBlur = document.getElementById('BGBlur');
const settingsBox = document.getElementById('settingsBox');
const settingsBoxJS = document.getElementById('settingsBoxJS');
let settingsOpen = false;

const weekdayNamesFull = ["Sunday", "Monday"];

let easterEgg;

const toggleSettingsPanel = () => {
    BGBlur.classList.toggle("hidden");
    settingsBox.classList.toggle('hide-settings-box');
    if (!settingsOpen) {
        generateSettingsPanel();
        settingsBox.classList.remove('hidden');
        BGBlur.addEventListener("click", toggleSettingsPanel);
    }
    settingsOpen = !settingsOpen;
};

document.getElementById('settings-box-close-button').addEventListener('click', toggleSettingsPanel);

const meta = document.querySelector('meta[name="color-scheme"]');
const root = document.querySelector(":root");
let darkThemeEnabled = meta.content == "dark" ? 1 : 0;

function generateSettingsPanel() {
    try {
        const tempTheme = localStorage.getItem("darktheme") == 1 ? "Dark" : (localStorage.getItem("darktheme") == 0 ? "Light" : "Automatic");
        const gridView = localStorage.getItem("teamsGridView") == 1 || false;
        const calendarListView = localStorage.getItem("calendarListView") == 1 || false;
        
        const tempLocale = localStorage.getItem("locale") || "en-GB";
        const tempLocaleDisplay = tempLocale === "en-GB" ? "English (UK)" : "English (US)";
        const tempStartDay = localStorage.getItem("startDay") || 1;
        const tempOverseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1 || false;

        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;

        settingsBoxJS.innerHTML = `
            <div translate="yes" class="setting-sub-heading">Appearance</div><hr>
            <span translate="yes" class="settings-hover-info" data-info="Light, dark or automatic">Page theme</span><button id="toggleTheme" class="settings-option">${tempTheme}</button><br>
            <span translate="yes" class="settings-hover-info" data-info="List or grid view">Teams page layout</span><button id="toggleListView" class="settings-option">${gridView ? "Grid view" : "List view"}</button><br>
            <span translate="yes" class="settings-hover-info" data-info="Calendar or list view">Matches page layout</span><button id="toggleCalendarListView" class="settings-option">${calendarListView ? "List view" : "Calendar view"}</button><br>

            <div translate="yes" class="setting-sub-heading">${tempLocale == "en-GB" ? "Localisation" : "Localization"}</div><hr class="settings-hr">
            <span translate="yes" class="settings-hover-info" data-info="UK or US date/time format">Locale</span><button id="toggleLocaleTypeButton" class="settings-option">${tempLocaleDisplay}</button><br/>
            <span translate="yes" class="settings-hover-info" data-info="Monday or Sunday">First day of week</span><button id="toggleStartDayButton" class="settings-option">${weekdayNamesFull[tempStartDay]}</button><br/>
            <span translate="yes" class="settings-hover-info" data-info="Use UK or local dates when overseas">Overseas date type</span><button id="toggleOverseasDateDisplayButton" class="settings-option">${tempOverseasDateDisplay ? 'Overseas' : 'UK'}</button><br/>
            
            <div translate="yes" class="setting-sub-heading">Website Data</div><hr>
            <span translate="yes">API requests sent: <span class="settings-option">${apiReqsSent}</span></span><br/>
            <span translate="yes" class="settings-hover-info" data-info="Reloads the page">Reset settings to default</span><button id="clearLocalStorage" class="settings-option">Reset</button>

            <div translate="yes" class="settings-instructions">Hover/tap the options to see more information</div>
        `;
    } catch (error) {
        settingsBoxJS.innerHTML = `<br>Failed to load settings<br><code translate="no">${error.stack}</code>`;
    }
    generateEventListeners();
};
generateSettingsPanel();

function toggleTheme() {
    let current = localStorage.getItem("darktheme");
    let next = current === null ? 0 : current == 0 ? 1 : current == 1 ? null : 0;

    if (next === null) {
        localStorage.removeItem("darktheme");
        darkThemeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0;
    } else {
        localStorage.setItem("darktheme", next);
        darkThemeEnabled = next;
    }

    meta.content = darkThemeEnabled ? "dark" : "light";
    root.classList.toggle("dark-theme", !!darkThemeEnabled);
    root.classList.toggle("light-theme", !darkThemeEnabled);
    console.debug(`%csettings.js %c> %c${next === null ? "Clearing theme" : `Set theme to ${meta.content}`}`, "color:#ff4576", "color:#fff", "color:#ff9eb8");
    sendThemeChangeEvent();
    generateSettingsPanel();
}

function toggleThemeLightDarkOnly() {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const root = document.querySelector(":root");

    let next = meta.content === "dark" ? 0 : 1;
    localStorage.setItem("darktheme", next);
    darkThemeEnabled = next;

    meta.content = darkThemeEnabled ? "dark" : "light";
    root.classList.toggle("dark-theme", !!darkThemeEnabled);
    root.classList.toggle("light-theme", !darkThemeEnabled);
    console.debug(`%csettings.js %c> %cSet theme to ${meta.content}`, "color:#ff4576", "color:#fff", "color:#ff9eb8");
    sendThemeChangeEvent();
    generateSettingsPanel();
}

function toggleListView() {
    const newListView = localStorage.getItem("teamsGridView") == 1 ? 0 : 1;
    localStorage.setItem("teamsGridView", newListView);
    console.debug(`%csettings.js %c> %cset teamsGridView to ${newListView}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    document.dispatchEvent(new CustomEvent('listViewChange'));
    generateSettingsPanel();
}

function toggleCalendarListView() {
    const calendarListView = localStorage.getItem("calendarListView") == 1 ? 0 : 1;
    localStorage.setItem("calendarListView", calendarListView);
    console.debug(`%csettings.js %c> %cset calendarListView to ${calendarListView}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    document.dispatchEvent(new CustomEvent('calendarListViewChange'));
    generateSettingsPanel();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!localStorage.getItem("darktheme")) {
        darkThemeEnabled = event.matches ? 1 : 0;
        meta.content = darkThemeEnabled ? "dark" : "light";
        root.classList.toggle("dark-theme", darkThemeEnabled);
        root.classList.toggle("light-theme", !darkThemeEnabled);
        console.debug(`%csettings.js %c> %cDevice theme changed to ${meta.content}`, "color:#ff4576", "color:#fff", "color:#ff9eb8");
        sendThemeChangeEvent();
        generateSettingsPanel();
    }
});

function sendThemeChangeEvent() {
    document.dispatchEvent(new CustomEvent('themeChange', { detail: { darkThemeEnabled } }));
}

document.addEventListener('scrollbarToCalendarListView', (event) => {
    document.dispatchEvent(new CustomEvent('addScrollbarToCalendarListView', { detail: { darkThemeEnabled, scrollToY: event.detail.scrollToY } }));
})

function toggleStartDay() {
    const newStartDay = localStorage.getItem("startDay") == 0 ? 1 : 0;
    localStorage.setItem("startDay", newStartDay);
    console.debug(`%csettings.js %c> %cset startDay to ${newStartDay} (${weekdayNamesFull[newStartDay]})`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    document.dispatchEvent(new CustomEvent('startDayChange'));
    generateSettingsPanel();
}

function toggleLocale() {    
    const locales = ["en-GB", "en-US"];
    const currentLocale = localStorage.getItem("locale") || "en-GB";
    const newLocale = locales[(locales.indexOf(currentLocale) + 1) % locales.length];
    localStorage.setItem("locale", newLocale);
    console.debug(`%csettings.js %c> %cset locale to ${newLocale}`, "color:#ff4576", "color:#fff", "color:#ff9eb8");
    document.dispatchEvent(new CustomEvent('startDayChange'));
    generateSettingsPanel();
}

function toggleOverseasDateDisplayButton() {
    const newOverseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1 ? 0 : 1;
    localStorage.setItem("overseasDateDisplay", newOverseasDateDisplay);
    console.debug(`%csettings.js %c> %cset overseasDateDisplay to ${newOverseasDateDisplay}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    document.dispatchEvent(new CustomEvent('startDayChange'));
    generateSettingsPanel();
}

function clearLocalStorage() {
    localStorage.clear();
    window.location.reload();
}

function generateEventListeners() {
    document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
    document.getElementById('toggleListView').addEventListener('click', toggleListView);
    document.getElementById('toggleCalendarListView').addEventListener('click', toggleCalendarListView);
    document.getElementById('toggleStartDayButton').addEventListener('click', toggleStartDay);
    document.getElementById('toggleLocaleTypeButton').addEventListener('click', toggleLocale);
    document.getElementById('toggleOverseasDateDisplayButton').addEventListener('click', toggleOverseasDateDisplayButton);
    document.getElementById('clearLocalStorage').addEventListener('click', clearLocalStorage);
}

sendThemeChangeEvent();

function generateCookiesPopup() {
    document.body.insertAdjacentHTML('beforeend', cookiesBox);
    const cookiePopup = document.getElementById('cookie-popup');
    const cookieAcceptButton = document.getElementById('cookieAccept');
    const cookieSettingsButton = document.getElementById('cookieSettings');

    cookieAcceptButton.addEventListener('click', () => {
        localStorage.setItem("cookiesAccepted", "true");
        cookiePopup.close();
        cookiePopup.remove();
    });

    cookieSettingsButton.addEventListener('click', () => {
        toggleSettingsPanel();
    });
}

function checkEasterEggs() {
    function checkDate(day, month) {
        return currentDate.getMonth() + 1 === month && currentDate.getDate() === day;
    }

    function checkDatePeriod(startDay, startMonth, endDay, endMonth) {
        const start = new Date(currentDate.getFullYear(), startMonth - 1, startDay);
        const end = new Date(currentDate.getFullYear(), endMonth - 1, endDay);
        return currentDate >= start && currentDate <= end;
    }

    let currentDate = new Date();

    if (checkDate(1, 4)) {
        easterEgg = "aprilfools";
    } else if (checkDatePeriod(28, 10, 31, 10)) {
        easterEgg = "halloween";
    } else if (checkDatePeriod(7, 12, 24, 12)) {
        easterEgg = "winter";
    } else if (checkDate(25, 12)) {
        easterEgg = "xmas";
    } else if (checkDate(31, 12)) {
        easterEgg = "newyearseve";
    } else if (checkDate(1, 1)) {
        easterEgg = "newyear";
    }

    switch (easterEgg) {
        case "aprilfools":
            console.log("Happy April Fools!");
            break;
        case "halloween":
            console.log("Happy Halloween!");
            halloweenEasterEgg();
            break;
        case "winter":
            winterEasterEgg();
            console.log("Brrrrr-!");
            break;
        case "xmas":
            console.log("Merry Christmas!");
            winterEasterEgg();
            break;
        case "newyearseve":
            console.log("Happy New Year's Eve!");
            break;
        case "newyear":
            console.log("Happy New Year!");
            break;
        default:
            break;
    }
}

// Keyboard shortcuts for toggling theme and opening settings panel
let isKeyPressed = false;
let keySequence = [];
const easterCode = ['m', 'i', 'k', 'u'];
const mkwEasterCode = ['m', 'k', 'w'];

let mkwEasterEggToggled = false;
let themeShortcutDisabled = false;
let setttingsShortcutDisabled = false;

document.addEventListener('keydown', (event) => {
    const tag = event.target.tagName.toLowerCase();
    const isTyping = tag === 'input' || tag === 'textarea' || event.target.isContentEditable;

    if (isTyping) return;

    const key = event.key.toLowerCase();

    keySequence.push(key);
    if (keySequence.length > easterCode.length) {
        keySequence.shift();
    }

    if (keySequence.join('') == easterCode.join('')) {
        mikuEasterEgg();
        keySequence = [];
    } else if (keySequence.join('') == mkwEasterCode.join('')) {
        mkwEasterEgg();
        keySequence = [];
    }

    if ((key === 't' || key === 'o') && !isKeyPressed) {
        isKeyPressed = true;
        if (key === 't' && !themeShortcutDisabled) toggleThemeLightDarkOnly();
        if (key === 'o' && !setttingsShortcutDisabled) toggleSettingsPanel();
    }
});

function disableThemeShortcut() {
    themeShortcutDisabled = true;
}

function disableSettingsShortcut() {
    setttingsShortcutDisabled = true;
}

document.addEventListener('keyup', () => {
    isKeyPressed = false;
});

function mikuEasterEgg() {
    const style = document.createElement('style');

    style.textContent = `
        .day.selected {
            position: relative;
            overflow: hidden;
            z-index: 0;
            color: #fff;
        }

        .day.selected::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url("../assets/media/calendar/mikuheadshake.avif");
            background-size: cover;
            background-position: center;
            opacity: 1;
            transition: opacity 0.3s ease;
            z-index: -1;
            pointer-events: none;
        }

        .day.selected:hover::before {
            opacity: 0.25;
        }
    `;

    document.head.appendChild(style);
}

function mkwEasterEgg() {
    if (mkwEasterEggToggled) document.location.reload();
    mkwEasterEggToggled = true;

    const style = document.createElement('style');

    let fontPath = "assets/font/RacersDelight.woff2"
    if (document.baseURI.includes("pages/rules/match/")) {
        fontPath = "../../../assets/font/RacersDelight.woff2"
    }

    style.textContent = `
        @font-face {
            font-family: "RacersDelight";
            src: url(${fontPath}) format("woff2");
        }

        body,
        button,
        input,
        textarea,
        select {
            font-family: "RacersDelight", "RacersDelightFallback", sans-serif;
        }

        .teamStandingsBox {
            font-family: "RacersDelight", "RacersDelightFallback", sans-serif;
        }
    `

    document.head.appendChild(style);
}

function checkBrowserSupport() {
    const ua = navigator.userAgent;

    let fullSupport = false;
    let message = "";

    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    const edgeMatch = ua.match(/Edg\/(\d+)/);
    if (chromeMatch) {
        const v = Number(chromeMatch[1]);
        fullSupport = v >= 92;
        message = `Chrome ${v}`
    } else if (edgeMatch) {
        const v = Number(edgeMatch[1]);
        fullSupport = v >= 92;
        message = `Edge ${v}`
    }

    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    if (firefoxMatch) {
        const v = Number(firefoxMatch[1]);
        fullSupport = v >= 113;
        message = `Firefox ${v}`
    }

    const iosVersionMatch = ua.match(/Version\/(\d+(\.\d+)?)\s+Mobile/);
    const safariDesktopMatch = ua.match(/Version\/(\d+(\.\d+)?)/);
    if (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) {
        if (iosVersionMatch) {
            const iosV = parseFloat(iosVersionMatch[1]);
            fullSupport = iosV >= 16.4;
            message = `iOS ${iosV}`;
        }
        else if (safariDesktopMatch) {
            const safariV = parseFloat(safariDesktopMatch[1]);
            fullSupport = safariV >= 16.4;
            const macMatch = ua.match(/Mac OS X (\d+[_\.\d]*)/);
            let macOS = macMatch ? macMatch[1].replace(/_/g, ".") : "";
            message = `Safari ${safariV}` + (macOS ? ` on macOS ${macOS}` : "");
        }
    }

    return { upToDate: fullSupport, message: message };
}

function checkBrowserOSVersion() {
    const check = checkBrowserSupport();
    if (!check.upToDate) {
        const outdatedHTML = `<div class="outdated-browser">Your browser is outdated. A browser update may be required to access certain features (using ${check.message}).</div>`
        document.body.insertAdjacentHTML('afterbegin', outdatedHTML);
    };
}

document.addEventListener("DOMContentLoaded", async () => {
    // if (localStorage.getItem("cookiesAccepted") !== "true") generateCookiesPopup();
    checkBrowserOSVersion();
    checkEasterEggs();
});