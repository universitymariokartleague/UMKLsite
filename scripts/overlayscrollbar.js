const { OverlayScrollbars, ClickScrollPlugin } = OverlayScrollbarsGlobal;

OverlayScrollbars.plugin(ClickScrollPlugin);

const isMobile = false

const osInstance = !isMobile ? OverlayScrollbars({
    target: document.body,
}, {
    scrollbars: {
        theme: "os-theme-dark",
        clickScroll: true,
        autoHide: 'scroll',
        autoHideDelay: 3000,
    },
    showNativeOverlaidScrollbars: true
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