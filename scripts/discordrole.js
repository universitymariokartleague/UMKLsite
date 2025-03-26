const colorsToCycle = [
    "#FF6262", "#FFAE7F", "#FFF588", "#67FF8A", "#65B5FF", "#CF82FF", "#FF9AD0"
];
const defaultColor = "#1BAA8B";
const colorPicker = document.getElementById("colorPicker");
const currentColor = document.getElementById("currentColor");
const iframe = document.getElementById("discordRoleiFrame");

let colorAttractMode = true;
let attractIndex = 0;
let attractInterval;

colorPicker.value = defaultColor;
colorPicker.addEventListener("input", updateCurrentColor);
colorPicker.addEventListener("change", updateCurrentColor);

iframe.addEventListener('load', () => {
    sendColorToIframe(colorPicker.value);
    cycleThroughAttractColors();
});

function cycleThroughAttractColors() {
    attractInterval = setInterval(() => {
        if (!colorAttractMode) {
            clearInterval(attractInterval);
            return;
        }
        colorPicker.value = colorsToCycle[attractIndex];
        updateCurrentColor();
        attractIndex = (attractIndex + 1) % colorsToCycle.length;
    }, 1000);
}

function updateCurrentColor() {
    colorAttractMode = false;
    const colorValue = colorPicker.value.toUpperCase();
    currentColor.innerHTML = `<code>${colorValue}</code>${(colorValue === "#FFFFFF" || colorValue === "#000000") ? ' ⚠︎ See below note' : ''}`;
    sendColorToIframe(colorPicker.value);
}

function sendColorToIframe(color) {
    iframe.contentWindow.postMessage({ type: 'setRoleColor', color }, '*'); // Replace '*' with your iframe's origin for security
}