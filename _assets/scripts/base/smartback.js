// In-page anchor links (eg. #rule1.1) shouldn't create history entries,
// otherwise the smart-back button only undoes the last hash change instead of leaving the page.
document.addEventListener("click", (e) => {
    const anchor = e.target.closest("a[href*='#']");
    if (!anchor || anchor.hasAttribute("data-smart-back")) return;

    const url = new URL(anchor.href, location.href);
    if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
        e.preventDefault();
        history.replaceState(null, "", url.hash);
        document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
    }
});

// Remember the previous page
const link = document.querySelector("a[data-smart-back]");

// news article recommendations ignore this
const ARTICLE_ORIGIN_KEY = "articleBackOrigin";
const isNewsArticle = /^\/news\/[^/]+\/[^/]+\/?$/.test(location.pathname);

if (link) {
    const storedOrigin = isNewsArticle ? sessionStorage.getItem(ARTICLE_ORIGIN_KEY) : null;

    if (storedOrigin) {
        link.href = storedOrigin;
        link.addEventListener("click", (e) => {
            e.preventDefault();
            location.href = storedOrigin;
        });
    } else {
        const cameFromSameSite = document.referrer && new URL(document.referrer).origin === location.origin;
        if (cameFromSameSite && history.length > 1) {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                history.back();
            });
        }
        if (isNewsArticle) {
            sessionStorage.setItem(ARTICLE_ORIGIN_KEY, cameFromSameSite ? document.referrer : link.href);
        }
    }
}

if (!isNewsArticle) sessionStorage.removeItem(ARTICLE_ORIGIN_KEY);
