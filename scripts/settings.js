// Setup
const settingsBoxHTML = `
<div class="hidden BGBlur" id="BGBlur"></div>
<div class="hidden hide-settings-box" id="settingsBox">
    <div class="settings-box-close-button">
        <button id="settings-box-close-button">Close</button>
    </div>
    <div class="settings-title">Settings</div>
    <div class="setting-options" id="settingsBoxJS">
        <div class="setting-sub-heading">Apperance</div><hr />
        Theme<button class="settings-option">Dark theme</button><br />
        Ambient Mode <button class="settings-option">OFF</button>
        <span class="settings-extra-info">(only available in dark theme)</span><br />
    </div>
</div>`;
document.body.insertAdjacentHTML('beforeend', settingsBoxHTML);

const BGBlur = document.getElementById('BGBlur');
const settingsBox = document.getElementById('settingsBox');
const settingsBoxJS = document.getElementById('settingsBoxJS');
let settingsOpen = false;

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
    let localStorageString = JSON.stringify(localStorage)
    try {
        settingsBoxJS.innerHTML = `
        <div class="setting-sub-heading">Apperance</div><hr />
        Page Theme<button id="toggleTheme" class="settings-option">${localStorage.getItem("darktheme") == 1 ? "Dark" : "Light"} theme</button><br />

        <div class="setting-sub-heading">Localstorage<span class="settings-extra-info"> (data stored on your device)</span></div><hr />
       
        <code>${localStorageString = {} ? "No data stored" : localStorageString}</code><br/>
        
        Clear settings<button id="clearLocalStorage" class="settings-option">Clear</button>
        <span class="settings-extra-info">(this will reload the page)</span></div><br />
        `
    } catch (error) {
        settingsBoxJS.innerHTML = `<br/>Failed to load settings<br/><code>${error}</code>`
    }
    generateEventListeners();
};
generateSettingsPanel();


function toggleTheme() {
    darkThemeEnabled = darkThemeEnabled ? 0 : 1;
    meta.content = darkThemeEnabled ? "dark" : "light";

    if (darkThemeEnabled) {
        console.log("Changing to dark theme...")
        root.classList.add("dark-theme");
        root.classList.remove("light-theme");
    } else {
        console.log("Changing to light theme...")
        root.classList.add("light-theme");
        root.classList.remove("dark-theme");  
    }
    localStorage.setItem("darktheme", darkThemeEnabled ? 1 : 0);

    generateSettingsPanel();
}

function clearLocalStorage() {
    localStorage.clear();
    window.location.reload();
}

function generateEventListeners() {
    document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
    document.getElementById('clearLocalStorage').addEventListener('click', clearLocalStorage);
}

function checkTheme() {
    darkThemeEnabled = parseInt(localStorage.getItem("darktheme"));
    if (isNaN(darkThemeEnabled)) {
        darkThemeEnabled = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0;
    }
    if (darkThemeEnabled == true) {
        meta.setAttribute('content', 'dark');
        root.classList.add('dark-theme');
        localStorage.setItem("darktheme", darkThemeEnabled ? 1 : 0);
        console.log("Set dark theme");
    } else {
        meta.setAttribute('content', 'light');
    }
    setTimeout(() => {
        document.body.style.transition = "background-color 0.2s ease-out";
    }, 0);
}
checkTheme();

// keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 't') {
        toggleTheme();
    }
});