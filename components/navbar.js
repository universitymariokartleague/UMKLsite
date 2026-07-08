const template = document.createElement("template");

function checkDatePeriod(e, o, a, r) { let t = new Date; const n = new Date(t.getFullYear(), o - 1, e), c = new Date(t.getFullYear(), r - 1, a); return t >= n && t <= c } let style_colors = ""; checkDatePeriod(28, 10, 31, 10) && (style_colors = ".navbar-container{background-color:#ff640a}#nav-dropdown-bar{background-color:#ff640a}"); checkDatePeriod(7, 12, 24, 12) && (style_colors = ".navbar-container{background-color:#d2bce8}#nav-dropdown-bar{background-color:#d2bce8}");

const DISCORDSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18"><path d="M20.317 1.516A19.8 19.8 0 0 0 15.432.001a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 13 13 0 0 0-.617-1.25.08.08 0 0 0-.079-.037 19.7 19.7 0 0 0-4.885 1.515.1.1 0 0 0-.032.027C.533 6.192-.32 10.726.099 15.203a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.028 14 14 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10 10 0 0 0 .372-.292.07.07 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .078.01 10 10 0 0 0 .373.292.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107 16 16 0 0 0 1.225 1.993.08.08 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 12.476c-1.182 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418" fill="#fff"/></svg>`

const sheet = new CSSStyleSheet();
sheet.replaceSync(`.nav-bar,.nav-bar ul{display:flex}.nav-flex a,.no-underline-link-footer{text-decoration:none}.nav-bar *,.nav-bar ::after,.nav-bar ::before,.navbar-container *,.navbar-container ::after,.navbar-container ::before{padding:0;margin:0}.navbar-container{background-color:var(--accent-color);width:100%;z-index:8}.navbar-container .nav-bar{max-width:min(800px,calc(100% - env(safe-area-inset-left) - env(safe-area-inset-right)));justify-content:space-between}.nav-bar{align-items:center;justify-content:center;width:calc(100% - 40px);max-width:800px;margin:auto}.nav-bar-title{color:#fff;display:flex;align-items:center;justify-content:center;padding:2px 10px;border-radius:5px}.nav-bar-title h1,.nav-bar-title h2{margin-left:5px}.nav-bar-title:hover{background-color:#ffffff56;transition:.1s}.nav-bar-logo{height:35px;width:35px}.nav-bar ul li{list-style-type:none}.navbar-container .nav-bar ul li{margin:0 2px;padding:15px 0}.nav-flex a{color:#fff!important;padding:10px;border-radius:5px}.nav-selected{background-color:#ffffff20;outline:#ffffff83 solid 1px}.nav-flex a:hover{background-color:#ffffff56;transition:.1s}.nav-flex a:active{background-color:#ffffff80;transition:.1s}.nav-dropdown{display:none}a[target="_blank"].nav-bar-link::after{content:"";width:1em;height:1em;margin:0 0 .1em .15em;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M9 2v1h3.3L6 9.3l.7.7L13 3.7V7h1V2ZM4 4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V7l-1 1v4c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1h4l1-1Z' style='fill:%23FFFFFF'/%3E%3C/svg%3E");background-size:contain;display:inline-block;vertical-align:sub}@media screen and (max-width:767px){.nav-bar{height:48px}.nav-bar ul{display:none}#nav-dropdown-button{color:#fff;cursor:pointer;font-size:22px;width:100px;height:48px;line-height:52px;text-align:right;display:inline-block}.nav-dropdown{position:relative;display:inline-block}#nav-dropdown-bar{display:none;position:absolute;right:-15px;background-color:var(--accent-color);min-width:200px;z-index:1;border:2px solid rgba(255,255,255,.6);border-radius:10px}#nav-dropdown-bar a{color:#fff!important;text-decoration:none;padding:16px;display:block;border-radius:8px}.nav-dropdown:hover #nav-dropdown-bar{display:block}#nav-dropdown-bar a:hover{background-color:#ffffff50}}@media screen and (min-width:768px){.dropdown-button{display:none!important}}${style_colors}svg{height:15px;margin-bottom:-2px!important;}`)

template.innerHTML = `
    <div class="navbar-container" translate="no">
        <div class="nav-bar">
            <a class="nav-bar-title no-color-link no-underline-link-footer" href="../../../index.html" title="Go home">
                <img class="nav-bar-logo" alt="UMKL logo" src='data:image/avif;base64,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'/>
                <h2>UMKL</h2>
            </a>
            <nav class="nav-flex">
                <ul id="nav-bar">
                    <li><a href="../../../pages/news/">News</a></li>
                    <li><a href="../../../pages/teams/">Teams</a></li>
                    <li><a href="../../../pages/matches/">Matches</a></li>
                    <li><a href="../../../pages/rules/">Rules/Guides</a></li>
                    <li><a href="../../../pages/tools/">Tools</a></li>
                    <li><a href="../../../pages/credits/">Credits</a></li>
                    <li>
                        <a class="nav-bar-link" href="https://discord.gg/jz3hKEmDss" target="_blank">
                            ${DISCORDSVG}
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="nav-dropdown">
                <div id="nav-dropdown-button">☰</div>
                <div id="nav-dropdown-bar">
                    <a href="../../../pages/news/">News</a>
                    <a href="../../../pages/teams/">Teams</a>
                    <a href="../../../pages/matches/">Matches</a>
                    <a href="../../../pages/rules/">Rules & Guides</a>
                    <a href="../../../pages/tools/">Tools</a>
                    <a href="../../../pages/credits/">Credits</a>
                    <a class="nav-bar-link" href="https://discord.gg/jz3hKEmDss" target="_blank">
                        ${DISCORDSVG} Discord
                    </a>
                </div>
            </div>
        </div>
    </div>
`;

class UMKLNavbar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        const shadow = this.shadowRoot, button = shadow.getElementById("nav-dropdown-button"), dropdown = shadow.getElementById("nav-dropdown-bar"); button.addEventListener("click", ((t) => { t.stopPropagation(); const e = "block" === dropdown.style.display; dropdown.style.display = e ? "none" : "block" })); document.addEventListener("click", (() => { dropdown.style.display = "none" })); const currentPath = window.location.pathname.replace(/\/+$/, "").split("/index.html")[0], links = shadow.querySelectorAll("#nav-bar a[href], #nav-dropdown-bar a[href]"); links.forEach((t => { const n = new URL(t.href).pathname.replace(/\/+$/, ""), e = n.endsWith("/index.html") && ("" === currentPath || "/" === currentPath), o = currentPath.startsWith(n) && "/" !== n; (e || o) && t.classList.add("nav-selected") }));
        shadow.adoptedStyleSheets = [sheet];
    }
}

customElements.define("umkl-navbar", UMKLNavbar);
