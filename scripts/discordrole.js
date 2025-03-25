let colorAttractMode = true;
let attractIndex = 0;
let colorsToCycle = [
    "#FF6262",
    "#FFAE7F",
    "#FFF588",
    "#67FF8A",
    "#65B5FF",
    "#CF82FF",
    "#FF9AD0"
];

const colorPicker = document.getElementById("colorPicker");
const currentColor = document.getElementById("currentColor");
const defaultColor = "#1BAA8B";

const iframe = document.getElementById("discordRoleiFrame");

colorPicker.value = defaultColor;
colorPicker.addEventListener("input", updateCurrentColor, false);
colorPicker.addEventListener("change", updateCurrentColor, false);

iframe.addEventListener('load', function () {
    sendColorToIframe(colorPicker.value);
    cycleThroughAttractColors();
});

let attractInterval;

function cycleThroughAttractColors() {
    attractInterval = setInterval(() => {
        if (colorAttractMode) {
            colorPicker.value = colorsToCycle[attractIndex];
            sendColorToIframe(colorPicker.value);
            currentColor.innerHTML = `<code>${colorPicker.value.toUpperCase()}</code>`;
            attractIndex = (attractIndex + 1) % colorsToCycle.length;
        } else {
            clearInterval(attractInterval);
        }
    }, 1000);
}

function updateCurrentColor() {
    colorAttractMode = false
    if (colorPicker.value == "#ffffff" || colorPicker.value == "#000000") {
        currentColor.innerHTML = `<code>${colorPicker.value.toUpperCase()}</code> ⚠︎ See below note`
    } else {
        currentColor.innerHTML = `<code>${colorPicker.value.toUpperCase()}</code>`
    }
    sendColorToIframe(colorPicker.value);
}

function sendColorToIframe(color) {
    iframe.contentWindow.postMessage({
        type: 'setRoleColor',
        color: color
    }, '*'); // Replace '*' with your iframe's origin for security
}