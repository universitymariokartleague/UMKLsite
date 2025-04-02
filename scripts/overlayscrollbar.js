const { OverlayScrollbars, ClickScrollPlugin } = OverlayScrollbarsGlobal;

OverlayScrollbars.plugin(ClickScrollPlugin);

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

let temp = `${navigator.userAgent} | ${isMobile}`;
document.getElementById("top").innerHTML += temp

const osInstance = !isMobile ? OverlayScrollbars({
    target: document.body,
    cancel: {
        nativeScrollbarsOverlaid: true,
        body: null,
    }
}, {
    scrollbars: {
        theme: "os-theme-dark",
        clickScroll: true,
        autoHide: 'scroll',
        autoHideDelay: 3000,
    }
}) : null;

function changeScrollbarTheme(dark) {
    osInstance.options({
        scrollbars: {
            theme: dark == 0 ? 'os-theme-dark' : 'os-theme-light'
        }
    });
}

// Listen for theme change event
document.addEventListener('themeChange', (event) => {
    if (!isMobile) {
        console.log(`%coverlayscrollbar.js %c> %cChanging scrollbar theme`, "color:#4599ff", "color:#fff", "color:#b3d5ff");
        changeScrollbarTheme(event.detail.darkThemeEnabled);
    }
});