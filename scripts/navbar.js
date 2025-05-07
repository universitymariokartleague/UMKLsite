/*
    This script is currently unused.
    It is intended to fill the navbar with links to the pages on the website, with the
    potential for user customization in the future.
*/

export { fillNavbar }

function fillNavbar() {
    console.debug(`%cnavbar.js %c> %cLoading nav bar...`, "color:#ff6145", "color:#fff", "color:#ffa494");

    const base = document.querySelector('base')?.getAttribute('href') || '/';
    if (base == "/") return;

    const navbar = document.getElementById("nav-bar");
    const navdropdownbar = document.getElementById("nav-dropdown-bar");
    const currentPage = window.location.pathname.replace(/\/$/, "").split("/").pop().replace(".html", "");

    const navItems = [
        { href: "index.html", label: "Home", page: "" },
        { href: "pages/news/", label: "News", page: "news" },
        { href: "pages/teams/", label: "Teams", page: "teams" },
        { href: "pages/matches/", label: "Matches", page: "matches" },
        { href: "pages/rules/", label: "Rules", page: "rules" },
        { href: "pages/faq/", label: "FAQs", page: "faq" },
        { href: "https://discord.gg/DTjbBzgkhr", label: "Discord", external: true }
    ];

    if (navbar) {
        navbar.innerHTML = navItems.map(item => {
            const isSelected = currentPage === item.page ? 'nav-selected' : '';
            const targetAttr = item.external ? ' target="_blank"' : '';
            return `<li><a href="${item.href}" class="${item.external ? `nav-bar-link` : ``}${isSelected}"${targetAttr}>${item.label}</a></li>`;
        }).join('');
    } else {
        console.debug(`%cnavbar.js %c> %cNavbar element with ID 'nav-bar' not found`, "color:#ff6145", "color:#fff", "color:#ffa494");
    }

    if (navdropdownbar) {
        navdropdownbar.innerHTML = navItems.map(item => {
            const isSelected = currentPage === item.page ? 'nav-dropdown-selected' : '';
            const targetAttr = item.external ? ' target="_blank"' : '';
            return `<a href="${item.href}" class="${item.external ? `nav-bar-link` : ``}${isSelected}"${targetAttr}>${item.label}</a>`;
        }).join('');
    } else {
        console.debug(`%cnavbar.js %c> %cNavbar element with ID 'nav-dropdown-bar' not found`, "color:#ff6145", "color:#fff", "color:#ffa494");
    }

    console.debug(`%cnavbar.js %c> %cLoaded nav bar`, "color:#ff6145", "color:#fff", "color:#ffa494");
}