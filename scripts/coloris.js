import './coloris.min.js';

const iframe = document.getElementById("discordRoleiFrame");
const colorPicker = document.getElementById("color-picker");
const colorMessage = document.getElementById("colorMessage");
const attractColors = [
    "#FF6262", 
    "#FFAE7F", 
    "#FFF588",
    "#67FF8A", 
    "#65B5FF", 
    "#FF9AD0"
];
let attractMode = true;
let attractIndex = 0;
let attractInterval;

function setupColoris(themeMode = 'dark') {
    Coloris({
        theme: 'default',
        themeMode,
        alpha: false,
        swatches: attractColors,
        defaultColor: '#1BAA8B',
        onChange: changeColor
    });
}

setupColoris();

function changeColor(color) {
    colorMessage.textContent = (color === "#ffffff" || color === "#000000") ? '⚠︎ See below notes' : '';
    iframe.contentWindow.postMessage({ type: 'setRoleColor', color }, '*');
}

function updateColor(color) {
    attractMode = false;
    colorPicker.value = color;
    colorPicker.dispatchEvent(new Event('input', { bubbles: true }));
    changeColor(color);
}

document.addEventListener('themeChange', (event) => {
    setupColoris(event.detail.darkThemeEnabled ? 'dark' : 'light');
});

document.addEventListener('changeDiscordRoleColor', (event) => {
    updateColor(event.detail.color);
});

document.addEventListener('coloris:pick', (event) => {
    attractMode = false;
});

iframe.addEventListener('load', () => {
    cycleThroughAttractColors();
});

function cycleThroughAttractColors() {
    attractInterval = setInterval(() => {
        if (!attractMode) {
            clearInterval(attractInterval);
            return;
        }
        updateColor(attractColors[attractIndex]);
        attractMode = true;
        attractIndex = (attractIndex + 1) % attractColors.length;
    }, 1000);
}