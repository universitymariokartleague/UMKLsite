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
        const tempTheme = (localStorage.getItem("darktheme") == 1 || darkThemeEnabled == 1) ? "Dark" : "Light";
        const listView = localStorage.getItem("teamsListView") == 1 || false;
        const experimentalListView = localStorage.getItem("experimentalListView") == 1 || false;
        const newDBFetch = localStorage.getItem("newDBFetch") == 1 || false;
        
        const tempLocale = localStorage.getItem("locale") || "en-GB";
        const tempLocaleDisplay = tempLocale === "en-GB" ? "English (UK)" : "English (US)";
        const tempStartDay = localStorage.getItem("startDay") || 1;
        const tempMonthType = localStorage.getItem("monthType") || "long";
        const tempMonthTypeDisplay = tempMonthType === "long" ? "Long" : "Short";

        settingsBoxJS.innerHTML = `
            <div class="setting-sub-heading">Appearance</div><hr>
            <span class="settings-hover-info" data-info="Light or dark theme">Page theme</span><button id="toggleTheme" class="settings-option">${tempTheme} theme</button><br>
            <span class="settings-hover-info" data-info="Grid or list view">Teams page layout</span><button id="toggleListView" class="settings-option">${listView ? "List view" : "Grid view"}</button><br>
            <span class="settings-hover-info" data-info="Experiment!">experimentalListView</span><button id="toggleExperimentalListView" class="settings-option">${experimentalListView ? "On" : "Off"}</button><br>
            <span class="settings-hover-info" data-info="Use the API for database fetching">newDBFetch</span><button id="togglenewDBFetch" class="settings-option">${newDBFetch ? "On" : "Off"}</button><br>

            <div class="setting-sub-heading">${tempLocale == "en-GB" ? "Localisation" : "Localization"}</div><hr class="settings-hr">
            <span class="settings-hover-info" data-info="UK or US date/time format">Locale</span><button id="toggleLocaleTypeButton" class="settings-option">${tempLocaleDisplay}</button><br/>
            <span class="settings-hover-info" data-info="eg: Monday or Sunday">First day of week</span><button id="toggleStartDayButton" class="settings-option">${weekdayNamesFull[tempStartDay]}</button><br/>
            <span class="settings-hover-info" data-info="eg: April or Apr">Month type</span><button id="toggleMonthTypeButton" class="settings-option">${tempMonthTypeDisplay}</button><br/>
            
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
    darkThemeEnabled = !darkThemeEnabled;
    meta.content = darkThemeEnabled ? "dark" : "light";
    root.classList.toggle("dark-theme", darkThemeEnabled);
    root.classList.toggle("light-theme", !darkThemeEnabled);
    console.debug(`%csettings.js %c> %cSetting and saving ${meta.content} theme`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    localStorage.setItem("darktheme", darkThemeEnabled ? 1 : 0);
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

function toggleExperimentalListView() {
    const newExperimentalListView = localStorage.getItem("experimentalListView") == 1 ? 0 : 1;
    localStorage.setItem("experimentalListView", newExperimentalListView);
    console.debug(`%csettings.js %c> %cset experimentalListView to ${newExperimentalListView}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    document.dispatchEvent(new CustomEvent('listViewChange'));
    generateSettingsPanel();
}

function togglenewDBFetch() {
    const newnewDBFetch = localStorage.getItem("newDBFetch") == 1 ? 0 : 1;
    localStorage.setItem("newDBFetch", newnewDBFetch);
    console.debug(`%csettings.js %c> %cset newDBFetch to ${newnewDBFetch}`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
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
    document.getElementById('toggleExperimentalListView').addEventListener('click', toggleExperimentalListView);
    document.getElementById('togglenewDBFetch').addEventListener('click', togglenewDBFetch);
    document.getElementById('toggleStartDayButton').addEventListener('click', toggleStartDay);
    document.getElementById('toggleMonthTypeButton').addEventListener('click', toggleMonthType);
    document.getElementById('toggleLocaleTypeButton').addEventListener('click', toggleLocale);
    document.getElementById('clearLocalStorage').addEventListener('click', clearLocalStorage);
}

sendThemeChangeEvent();

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
checkEasterEggs();

// Keyboard shortcuts for toggling theme
let isKeyPressed = false;
if (!easterEgg) {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'i' && !isKeyPressed) {
            isKeyPressed = true;
            toggleTheme();
        }
    });
    
    document.addEventListener('keyup', (event) => {
        if (event.key === 'i') {
            isKeyPressed = false;
        }
    });
}