/*
    This script initializes the OverlayScrollbars library for custom scrollbars on all pages.
    It also listens for a custom event to change the scrollbar theme based on user preference.
*/

const { OverlayScrollbars } = OverlayScrollbarsGlobal;

let scrollBars = [];
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
scrollBars.push(osInstance);

function changeScrollbarTheme(dark) {
    scrollBars.forEach(sb => {
        sb.options({
            scrollbars: {
                theme: dark == 0 ? 'os-theme-dark' : 'os-theme-light'
            }
        });
    });
}

document.addEventListener('themeChange', (event) => {
    console.debug(`%coverlayscrollbar.js %c> %cChanging scrollbar theme`, "color:#4599ff", "color:#fff", "color:#b3d5ff");
    changeScrollbarTheme(event.detail.darkThemeEnabled);
});

document.addEventListener('addScrollbarToCalendarListView', (event) => {
    const calendarListView = document.getElementById('calendarListView');
    console.debug(`%coverlayscrollbar.js %c> %cAdding scrollbar to calendar list view`, "color:#4599ff", "color:#fff", "color:#b3d5ff");

    const calendarListViewInstance = OverlayScrollbars(calendarListView, {
        cancel: {
            nativeScrollbarsOverlaid: true,
            body: null,
        },
        scrollbars: {
            theme: event.detail.darkThemeEnabled == 0 ? 'os-theme-dark' : 'os-theme-light',
            autoHide: 'scroll',
            autoHideDelay: 3000,
        }
    });
    scrollBars.push(calendarListViewInstance);

    const { scrollOffsetElement } = calendarListViewInstance.elements();

    if (event.detail && typeof event.detail.scrollToY === 'number') {
        scrollOffsetElement.scrollTo({ top: event.detail.scrollToY });
    }
});

document.addEventListener('removeScrollbarFromCalendarListView', () => {
    const calendarListView = document.getElementById('calendarListView');
    for (let i = 0; i < scrollBars.length; i++) {
        if (scrollBars[i].elements().target === calendarListView) {
            scrollBars[i].destroy();
            scrollBars.splice(i, 1);
            console.debug(`%coverlayscrollbar.js %c> %cRemoved scrollbar from calendar list view`, "color:#4599ff", "color:#fff", "color:#b3d5ff");
            break;
        }
    }
});