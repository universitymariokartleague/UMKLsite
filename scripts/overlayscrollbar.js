/*
    This script initializes the OverlayScrollbars library for custom scrollbars on all pages.
    It also listens for a custom event to change the scrollbar theme based on user preference.
*/

const { OverlayScrollbars } = OverlayScrollbarsGlobal;

const osInstance = OverlayScrollbars({
    target: document.body,
    cancel: {
        nativeScrollbarsOverlaid: true,
        body: null,
    }
}, {
    scrollbars: {
        theme: "os-theme-dark",
        autoHide: 'scroll',
        autoHideDelay: 3000,
    }
});

function changeScrollbarTheme(dark) {
    osInstance.options({
        scrollbars: {
            theme: dark == 0 ? 'os-theme-dark' : 'os-theme-light'
        }
    });
}

document.addEventListener('themeChange', (event) => {
    console.debug(`%coverlayscrollbar.js %c> %cChanging scrollbar theme`, "color:#4599ff", "color:#fff", "color:#b3d5ff");
    changeScrollbarTheme(event.detail.darkThemeEnabled);
});