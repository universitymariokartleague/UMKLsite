/*
    Fades in <img> elements as they finish loading, site-wide. Images that
    already opt into their own load-based fade (an inline onload attribute,
    used throughout the JS-rendered components) are left untouched - this
    only catches "plain" images that would otherwise just pop in once decoded.
*/

function fadeInOnLoad(img) {
    if (window.location.href.includes("/profile")) return;
    if (img.hasAttribute("onload") || img.dataset.noFade !== undefined) return;
    if (img.complete && img.naturalWidth !== 0) return;

    img.style.opacity = "0";
    img.style.transition = "opacity 0.25s ease-in";

    // Clear the inline styles once the fade finishes
    const reveal = () => {
        img.style.opacity = "1";
        img.addEventListener("transitionend", () => {
            img.style.opacity = "";
            img.style.transition = "";
        }, { once: true });
    };
    img.addEventListener("load", reveal, { once: true });
    img.addEventListener("error", reveal, { once: true });
}

function fadeInImagesWithin(root) {
    root.querySelectorAll?.("img").forEach(fadeInOnLoad);
}

function fadeInShadowImages(selector) {
    document.querySelectorAll(selector).forEach((el) => {
        if (el.shadowRoot) fadeInImagesWithin(el.shadowRoot);
    });
}

fadeInImagesWithin(document);
fadeInShadowImages("umkl-navbar, umkl-footer");

new MutationObserver((mutations) => {
    for (const { addedNodes } of mutations) {
        addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.tagName === "IMG") fadeInOnLoad(node);
            else fadeInImagesWithin(node);
            if (node.shadowRoot) fadeInImagesWithin(node.shadowRoot);
        });
    }
}).observe(document.body, { childList: true, subtree: true });
