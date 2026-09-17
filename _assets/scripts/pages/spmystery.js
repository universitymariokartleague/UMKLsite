/*
    Nobody actually knows what SP stands for. This continuously scrambles
    the mystery text on the FAQ page's SP question instead of settling on an answer.
*/

const mysteryEl = document.getElementById("sp-mystery");

if (mysteryEl && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const chars = "?!@#$%&*^~/\\<>[]{}";
    const length = mysteryEl.textContent.length;

    setInterval(() => {
        mysteryEl.textContent = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }, 120);
}
