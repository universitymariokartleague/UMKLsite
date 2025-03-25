const { OverlayScrollbars, ClickScrollPlugin } = OverlayScrollbarsGlobal;

// optional: use the ClickScrollPlugin to make the option "scrollbars.clickScroll: true" available
OverlayScrollbars.plugin(ClickScrollPlugin);

OverlayScrollbars(document.body, {
    scrollbars: {
        clickScroll: true,
    },
});

const scrollElement = document.querySelector('#top');

const osInstance = OverlayScrollbars(scrollElement, {
    className: "os-theme-light"
});

function changeTheme(dark) {
    osInstance.options({ className: dark ? 'os-theme-dark' : 'os-theme-light'})
}