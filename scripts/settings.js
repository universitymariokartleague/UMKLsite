// Setup
// import { fillNavbar } from './navbar.js';

const settingsBoxHTML = `
<div class="hidden BGBlur" id="BGBlur"></div>
<div class="hidden hide-settings-box" id="settingsBox" data-overlayscrollbars-initialize>
    <div class="settings-box-close-button">
        <button id="settings-box-close-button">Close</button>
    </div>
    <div class="settings-title">Settings</div>
    <div class="setting-options" id="settingsBoxJS">
        <div class="setting-sub-heading">Appearance</div><hr>
        Theme<button class="settings-option">Dark theme</button><br>
        Ambient Mode <button class="settings-option">OFF</button>
        <span class="settings-extra-info">(only available in dark theme)</span><br>
    </div>
</div>`;
document.body.insertAdjacentHTML('beforeend', settingsBoxHTML);

const BGBlur = document.getElementById('BGBlur');
const settingsBox = document.getElementById('settingsBox');
const settingsBoxJS = document.getElementById('settingsBoxJS');
let settingsOpen = false;

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toggleSettingsPanel = () => {
    BGBlur.classList.toggle("hidden");
    settingsBox.classList.toggle('hide-settings-box');
    if (settingsOpen) {

    } else {
        generateSettingsPanel();
        settingsBox.classList.remove('hidden');
        BGBlur.addEventListener("click", toggleSettingsPanel);
    }
    settingsOpen = !settingsOpen;
};

document.getElementById('settings-box-close-button').addEventListener('click', toggleSettingsPanel);
document.querySelectorAll('.settingsBoxOpener').forEach(opener => {
    opener.addEventListener('click', toggleSettingsPanel);
});

const meta = document.querySelector('meta[name="color-scheme"]');
const root = document.querySelector(":root");
let darkThemeEnabled;

// Panel
function generateSettingsPanel() {
    try {
        const localStorageData = Object.entries(localStorage).map(([key, value]) => {
            return `<b>${key}</b>: <span class="setting-selectable">${value.slice(0, 100)}${value.length > 100 ? '...' : ''}</span><br>`;
        }).join('');

        const tempTheme = (localStorage.getItem("darktheme") == 1 || darkThemeEnabled == 1) ? "Dark" : "Light";
        const tempStartDay = localStorage.getItem("startDay") || 1;
        const tempMonthType = localStorage.getItem("monthType") || "long";
        const tempLocale = localStorage.getItem("locale") || "en-GB";
        const tempLocaleDisplay = tempLocale === "en-GB" ? "English (UK)" : "English (US)";

        settingsBoxJS.innerHTML = `
            <div class="setting-sub-heading">Appearance</div><hr>
            Page Theme<button id="toggleTheme" class="settings-option">${tempTheme} theme</button><br>

            <div class="setting-sub-heading">${tempStartDay == 1 ? "Localisation" : "Localization"}</div><hr class="settings-hr">
            First day of week <span class="settings-extra-info">(Monday or Sunday)</span><button id="toggleStartDayButton" class="settings-option">${weekdayNamesFull[tempStartDay]}</button><br/>
            Month type <span class="settings-extra-info">(eg: April or Apr)</span><button id="toggleMonthTypeButton" class="settings-option">${tempMonthType}</button><br/>
            Locale <span class="settings-extra-info">(UK or US date/time format)</span><button id="toggleLocaleTypeButton" class="settings-option">${tempLocaleDisplay}</button>
            
            <div class="setting-sub-heading">Website Data</div><hr>
            Reset settings to default <span class="settings-extra-info"> (this will reload the page)</span></div><button id="clearLocalStorage" class="settings-option">Clear</button>
            <!-- <div class="codeBoxTight">${localStorageData || "No data stored"}</div> -->
        `;
    } catch (error) {
        settingsBoxJS.innerHTML = `<br>Failed to load settings<br><code>${error.stack}</code>`;
    }
    generateEventListeners();
};
generateSettingsPanel();

function toggleTheme() {
    darkThemeEnabled = darkThemeEnabled ? 0 : 1;
    meta.content = darkThemeEnabled ? "dark" : "light";

    if (darkThemeEnabled) {
        console.debug(`%csettings.js %c> %cSetting and saving dark theme`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
        root.classList.add("dark-theme");
        root.classList.remove("light-theme");
    } else {
        console.debug(`%csettings.js %c> %cSetting and saving light theme`, "color:#ff4576", "color:#fff", "color:#ff9eb8");
        root.classList.add("light-theme");
        root.classList.remove("dark-theme");
    }
    localStorage.setItem("darktheme", darkThemeEnabled ? 1 : 0);
    sendThemeChangeEvent();
    generateSettingsPanel();
}

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
    const currentLocale = localStorage.getItem("locale") || "en-GB";
    const locales = ["en-GB", "en-US"];
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
    document.getElementById('toggleStartDayButton').addEventListener('click', toggleStartDay);
    document.getElementById('toggleMonthTypeButton').addEventListener('click', toggleMonthType);
    document.getElementById('toggleLocaleTypeButton').addEventListener('click', toggleLocale);
    document.getElementById('clearLocalStorage').addEventListener('click', clearLocalStorage);
}

function checkThemeAfterLoaded() {
    let themePreference = parseInt(localStorage.getItem("darktheme"));
    if (isNaN(themePreference)) {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        themePreference = prefersDark ? 1 : 0;
    }
    darkThemeEnabled = themePreference;

    // if (darkThemeEnabled) {
    //     console.debug(`%csettings.js %c> %cSetting dark theme`, "color:#ff4576", "color:#fff", "color:#ff9eb8")
    //     root.classList.add("dark-theme");
    //     root.classList.remove("light-theme");
    // } else {
    //     console.debug(`%csettings.js %c> %cSetting light theme`, "color:#ff4576", "color:#fff", "color:#ff9eb8");
    //     root.classList.add("light-theme");
    //     root.classList.remove("dark-theme");
    // }

    sendThemeChangeEvent();
}
checkThemeAfterLoaded();

// window.addEventListener('load', function() {
//     fillNavbar();
// });

// keyboard shortcuts
let keyPressed = false;

document.addEventListener('keydown', (event) => {
    if (event.key === 'i' && !keyPressed) {
        keyPressed = true;
        toggleTheme();
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'i') {
        keyPressed = false;
    }
});