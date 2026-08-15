/*
    Applies the stored/system theme synchronously before first paint, so the
    page never flashes the wrong theme. Loaded as a blocking on every page
*/

const meta = document.querySelector('meta[name="color-scheme"]');
const root = document.documentElement;
let darkThemeEnabled = parseInt(localStorage.getItem("darktheme"));

if (isNaN(darkThemeEnabled)) {
    darkThemeEnabled = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? 1 : 0;
} else {
    root.setAttribute("data-theme", darkThemeEnabled ? "dark" : "light");
    meta.setAttribute("content", darkThemeEnabled ? "dark" : "light");
}
