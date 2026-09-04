// Remember the previous page
const link = document.querySelector("a[data-smart-back]");
if (link) {
    const cameFromSameSite = document.referrer && new URL(document.referrer).origin === location.origin;
    if (cameFromSameSite && history.length > 1) {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            history.back();
        });
    }
}
