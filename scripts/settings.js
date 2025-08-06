/*
    This script manages the settings panel for the website. It creates a settings 
    menu that allows users to change the theme, locale, and various other settings.
    It saves the settings in local storage and applies them to the page. 
*/

import { halloweenEasterEgg, xmasEasterEgg } from './eastereggs.js';

const settingsBoxHTML = `
    <div class="hidden BGBlur" id="BGBlur"></div>
    <div class="hidden hide-settings-box" id="settingsBox" data-overlayscrollbars-initialize>
        <div class="settings-box-close-button">
            <button id="settings-box-close-button">Close</button>
        </div>
        <div class="settings-title">Settings</div>
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

let easterEgg = null;

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
document.querySelectorAll('.settingsBoxOpener').forEach(opener => opener.addEventListener('click', toggleSettingsPanel));

const meta = document.querySelector('meta[name="color-scheme"]');
const root = document.querySelector(":root");
let darkThemeEnabled = meta.content == "dark" ? 1 : 0;

// Panel
function generateSettingsPanel() {
    try {
        const tempTheme = localStorage.getItem("darktheme") == 1 ? "Dark" : (localStorage.getItem("darktheme") == 0 ? "Light" : "Automatic");
        const listView = localStorage.getItem("teamsListView") == 1 || false;
        const calendarListView = localStorage.getItem("calendarListView") == 1 || false;
        const legacyListView = localStorage.getItem("legacyListView") == 1 || false;
        
        const tempLocale = localStorage.getItem("locale") || "en-GB";
        const tempLocaleDisplay = tempLocale === "en-GB" ? "English (UK)" : "English (US)";
        const tempStartDay = localStorage.getItem("startDay") || 1;
        const tempMonthType = localStorage.getItem("monthType") || "long";
        const tempMonthTypeDisplay = tempMonthType === "long" ? "Long" : "Short";

        settingsBoxJS.innerHTML = `
            <div class="setting-sub-heading">Appearance</div><hr>
            <span class="settings-hover-info" data-info="Light, dark or automatic">Page theme</span><button id="toggleTheme" class="settings-option">${tempTheme}</button><br>
            <span class="settings-hover-info" data-info="Grid or list view">Teams page layout</span><button id="toggleListView" class="settings-option">${listView ? "List view" : "Grid view"}</button><br>
            <span class="settings-hover-info" data-info="Calendar or list view">Matches page layout</span><button id="toggleCalendarListView" class="settings-option">${calendarListView ? "List view" : "Calendar view"}</button><br>
            <span class="settings-hover-info" data-info="Will be removed!">legacyListView</span><button id="togglelegacyListView" class="settings-option">${legacyListView ? "On" : "Off"}</button><br>

            <div class="setting-sub-heading">${tempLocale == "en-GB" ? "Localisation" : "Localization"}</div><hr class="settings-hr">
            <span class="settings-hover-info" data-info="UK or US date/time format">Locale</span><button id="toggleLocaleTypeButton" class="settings-option">${tempLocaleDisplay}</button><br/>
            <span class="settings-hover-info" data-info="Monday or Sunday">First day of week</span><button id="toggleStartDayButton" class="settings-option">${weekdayNamesFull[tempStartDay]}</button><br/>
            <span class="settings-hover-info" data-info="April or Apr">Month type</span><button id="toggleMonthTypeButton" class="settings-option">${tempMonthTypeDisplay}</button><br/>
            
            <div class="setting-sub-heading">Website Data</div><hr>
            <span class="settings-hover-info" data-info="reloads the page">Reset settings to default</span><button id="clearLocalStorage" class="settings-option">Clear</button>

            <div class="settings-instructions">Hover/tap the options to see more information</div>
        `;
    } catch (error) {
        settingsBoxJS.innerHTML = `<br>Failed to load settings<br><code>${error.stack}</code>`;
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
    const newListView = localStorage.getItem("teamsListView") == 1 ? 0 : 1;
    localStorage.setItem("teamsListView", newListView);
    console.debug(`%csettings.js %c> %cset teamsListView to ${newListView}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
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

function togglelegacyListView() {
    const newlegacyListView = localStorage.getItem("legacyListView") == 1 ? 0 : 1;
    localStorage.setItem("legacyListView", newlegacyListView);
    console.debug(`%csettings.js %c> %cset legacyListView to ${newlegacyListView}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    document.dispatchEvent(new CustomEvent('listViewChange'));
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

function toggleMonthType() {    
    const newMonthType = localStorage.getItem("monthType") == "short" ? "long" : "short";
    localStorage.setItem("monthType", newMonthType);
    console.debug(`%csettings.js %c> %cset monthType to ${newMonthType}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
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

function clearLocalStorage() {
    localStorage.clear();
    window.location.reload();
}

function generateEventListeners() {
    document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
    document.getElementById('toggleListView').addEventListener('click', toggleListView);
    document.getElementById('toggleCalendarListView').addEventListener('click', toggleCalendarListView);
    document.getElementById('togglelegacyListView').addEventListener('click', togglelegacyListView);
    document.getElementById('toggleStartDayButton').addEventListener('click', toggleStartDay);
    document.getElementById('toggleMonthTypeButton').addEventListener('click', toggleMonthType);
    document.getElementById('toggleLocaleTypeButton').addEventListener('click', toggleLocale);
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
    function checkDate(month, day) {
        return currentDate.getMonth() === month && currentDate.getDate() === day;
    }

    let currentDate = new Date();
    // currentDate = new Date(currentDate.getFullYear(), 9, 31);

    if (checkDate(3, 1)) {
        easterEgg = "aprilfools";
    } else if (checkDate(9, 31)) {
        easterEgg = "halloween";
    } else if (checkDate(11, 24)) {
        easterEgg = "xmaseve";
    } else if (checkDate(11, 25)) {
        easterEgg = "xmas";
    } else if (checkDate(11, 31)) {
        easterEgg = "newyearseve";
    } else if (checkDate(0, 1)) {
        easterEgg = "newyear";
    }

    switch (easterEgg) {
        case "aprilfools":
            console.log("Happy April Fools' Day!");
            break;
        case "halloween":
            halloweenEasterEgg();
            break;
        case "xmaseve":
            console.log("Merry Christmas Eve!");
            break;
        case "xmas":
            xmasEasterEgg();
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
let keySequence = []; // stores recent keys
const easterCode = ['m', 'i', 'k', 'u'];

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
    }

    if ((key === 't' || key === 'o') && !isKeyPressed) {
        isKeyPressed = true;
        if (key === 't') toggleThemeLightDarkOnly();
        if (key === 'o') toggleSettingsPanel();
    }
});

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

document.addEventListener("DOMContentLoaded", async () => {
    // if (localStorage.getItem("cookiesAccepted") !== "true") {
    //     generateCookiesPopup();
    // }
    checkEasterEggs();
});