/*
    Used on the team creation guidelines page to show the current team colors.
*/

const iframe = document.getElementById("discordRoleiFrame");
const field = document.getElementById("colorPickerField");
const swatchButton = document.getElementById("colorPickerSwatch");
const input = document.getElementById("color-picker");

const attractColors = [
    "#ff6262",
    "#ffae7f",
    "#fff588",
    "#67ff8a",
    "#65b5ff",
    "#ff9ad0"
];
let attractMode = true;
let attractIndex = 0;
let attractInterval;

let hue = 0, saturation = 0, value = 0;

const panel = document.createElement("div");
panel.className = "color-picker-panel";
panel.hidden = true;
panel.innerHTML = `
    <div class="color-picker-gradient">
        <div class="color-picker-gradient-marker"></div>
    </div>
    <div class="color-picker-hue">
        <div class="color-picker-hue-marker"></div>
    </div>
    <div class="color-picker-swatches"></div>
    <button type="button" class="color-picker-copy"></button>
`;
document.body.appendChild(panel);

const gradient = panel.querySelector(".color-picker-gradient");
const gradientMarker = panel.querySelector(".color-picker-gradient-marker");
const hueSlider = panel.querySelector(".color-picker-hue");
const hueMarker = panel.querySelector(".color-picker-hue-marker");
const swatchesContainer = panel.querySelector(".color-picker-swatches");
const copyButton = panel.querySelector(".color-picker-copy");
let copyResetTimeout;

copyButton.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(input.value);
        copyButton.textContent = "Copied!";
    } catch {
        copyButton.textContent = "Copy failed";
    }
    clearTimeout(copyResetTimeout);
    copyResetTimeout = setTimeout(() => { copyButton.textContent = `Copy ${input.value}`; }, 1500);
});

for (const color of attractColors) {
    const button = document.createElement("button");
    button.type = "button";
    button.style.color = color;
    button.setAttribute("aria-label", `Set colour to ${color}`);
    button.addEventListener("click", () => {
        attractMode = false;
        setColor(color);
    });
    swatchesContainer.appendChild(button);
}

function hexToRgb(hex) {
    const num = parseInt(hex.slice(1), 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
    return "#" + [r, g, b].map(channel => channel.toString(16).padStart(2, "0")).join("");
}

function rgbToHsv({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return { h, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    const [r, g, b] = h < 60 ? [c, x, 0]
        : h < 120 ? [x, c, 0]
            : h < 180 ? [0, c, x]
                : h < 240 ? [0, x, c]
                    : h < 300 ? [x, 0, c]
                        : [c, 0, x];
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function normalizeHex(raw) {
    let hex = raw.trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(hex)) {
        hex = "#" + hex.slice(1).split("").map(c => c + c).join("");
    }
    return hex;
}

function isValidHex(hex) {
    return /^#[0-9a-f]{6}$/.test(hex);
}

function updateVisuals() {
    const hueColor = rgbToHex(hsvToRgb(hue, 1, 1));
    gradient.style.color = hueColor;
    gradientMarker.style.left = `${saturation * 100}%`;
    gradientMarker.style.top = `${(1 - value) * 100}%`;
    gradientMarker.style.color = rgbToHex(hsvToRgb(hue, saturation, value));
    hueMarker.style.left = `${(hue / 360) * 100}%`;
    hueMarker.style.color = hueColor;
}

function applyColor(hex) {
    swatchButton.style.backgroundColor = hex;
    input.value = hex;
    copyButton.textContent = `Copy ${hex}`;
    iframe.contentWindow.postMessage({ type: "setRoleColor", color: hex }, "*");
}

function setColor(hex) {
    hex = normalizeHex(hex);
    const hsv = rgbToHsv(hexToRgb(hex));
    hue = hsv.h; saturation = hsv.s; value = hsv.v;
    updateVisuals();
    applyColor(hex);
}

function openPanel() {
    const rect = field.getBoundingClientRect();
    panel.style.left = `${rect.left + window.scrollX}px`;
    panel.style.top = `${rect.bottom + window.scrollY + 6}px`;
    panel.hidden = false;
    swatchButton.setAttribute("aria-expanded", "true");
}

function closePanel() {
    panel.hidden = true;
    swatchButton.setAttribute("aria-expanded", "false");
}

function pointerToRatio(event, element) {
    const rect = element.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    const x = Math.min(Math.max(point.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(point.clientY - rect.top, 0), rect.height);
    return { x: x / rect.width, y: y / rect.height };
}

function dragGradient(event) {
    const { x, y } = pointerToRatio(event, gradient);
    saturation = x;
    value = 1 - y;
    attractMode = false;
    updateVisuals();
    applyColor(rgbToHex(hsvToRgb(hue, saturation, value)));
}

function dragHue(event) {
    const { x } = pointerToRatio(event, hueSlider);
    hue = x * 360;
    attractMode = false;
    updateVisuals();
    applyColor(rgbToHex(hsvToRgb(hue, saturation, value)));
}

function startDrag(moveHandler) {
    function onMove(event) {
        event.preventDefault();
        moveHandler(event);
    }
    function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchend", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
}

swatchButton.addEventListener("click", () => {
    if (panel.hidden) openPanel(); else closePanel();
});

input.addEventListener("focus", openPanel);

input.addEventListener("input", () => {
    const hex = normalizeHex(input.value);
    if (isValidHex(hex)) {
        attractMode = false;
        setColor(hex);
    }
});

document.addEventListener("click", (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !field.contains(event.target)) {
        closePanel();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
});

document.addEventListener("changeDiscordRoleColor", (event) => {
    attractMode = false;
    setColor(event.detail.color);
});

gradient.addEventListener("mousedown", (event) => { dragGradient(event); startDrag(dragGradient); });
gradient.addEventListener("touchstart", (event) => { dragGradient(event); startDrag(dragGradient); });
hueSlider.addEventListener("mousedown", (event) => { dragHue(event); startDrag(dragHue); });
hueSlider.addEventListener("touchstart", (event) => { dragHue(event); startDrag(dragHue); });

setColor(input.value || "#1baa8b");

iframe.addEventListener("load", () => {
    cycleThroughAttractColors();
});

function cycleThroughAttractColors() {
    attractInterval = setInterval(() => {
        if (!attractMode) {
            clearInterval(attractInterval);
            return;
        }
        setColor(attractColors[attractIndex]);
        attractMode = true;
        attractIndex = (attractIndex + 1) % attractColors.length;
    }, 1000);
}
