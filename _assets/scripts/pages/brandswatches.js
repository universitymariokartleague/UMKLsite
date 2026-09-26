// Colour codes are derived from the swatch's computed style, so they stay correct
// even if the underlying variable is defined with oklch()/color-mix() rather than a hex.
function rgbToHex(rgb) {
    const channels = rgb.match(/\d+(\.\d+)?/g);
    if (!channels) return rgb;
    return "#" + channels.slice(0, 3)
        .map((n) => Math.round(parseFloat(n)).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}

document.querySelectorAll(".color-swatch").forEach((swatch) => {
    const block = swatch.querySelector(".color-swatch-block");
    const codeButton = swatch.querySelector(".color-swatch-code");
    if (!block || !codeButton) return;

    const hex = rgbToHex(getComputedStyle(block).backgroundColor);
    codeButton.textContent = hex;
    block.title = `Copy ${hex}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(hex);
            codeButton.textContent = "Copied!";
            setTimeout(() => { codeButton.textContent = hex; }, 1200);
        } catch { }
    };

    codeButton.addEventListener("click", copy);
    block.addEventListener("click", copy);
});

document.querySelectorAll("[data-copy-target]").forEach((button) => {
    const source = document.getElementById(button.dataset.copyTarget);
    const label = button.querySelector("span");
    if (!source || !label) return;

    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(source.innerText.trim());
            label.textContent = "Copied!";
            setTimeout(() => { label.textContent = "Copy"; }, 1200);
        } catch { }
    });
});
