class UMKLNavbar extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement("template");
        template.innerHTML = `
            <style>
                .nav-bar,.nav-bar ul{display:flex}.nav-flex a,.no-underline-link-footer{text-decoration:none}.nav-bar *,.nav-bar ::after,.nav-bar ::before,.navbar-container *,.navbar-container ::after,.navbar-container ::before{padding:0;margin:0}.navbar-container{background-color:var(--accent-color);position:fixed;width:100%;top:0;z-index:8}.navbar-container .nav-bar{max-width:min(800px,calc(100% - env(safe-area-inset-left) - env(safe-area-inset-right)));justify-content:space-between}.nav-bar{align-items:center;justify-content:center;width:calc(100% - 40px);max-width:800px;margin:auto}.nav-bar-title{color:#fff;display:flex;align-items:center;justify-content:center}.nav-bar-title h1,.nav-bar-title h2{margin-left:5px}.nav-bar-logo{height:35px;width:35px}.nav-bar ul li{list-style-type:none}.navbar-container .nav-bar ul li{margin:0 2px;padding:15px 0}.nav-flex a{color:#fff!important;padding:10px;border-radius:5px}.nav-selected{background-color:#ffffff20;outline:#ffffff83 solid 1px}.nav-flex a:hover{background-color:#ffffff56;transition:.1s}.nav-flex a:active{background-color:#ffffff80;transition:.1s}.nav-dropdown{display:none}a[target="_blank"].nav-bar-link::after{content:"";width:1em;height:1em;margin:0 0 .1em .15em;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M9 2v1h3.3L6 9.3l.7.7L13 3.7V7h1V2ZM4 4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V7l-1 1v4c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1h4l1-1Z' style='fill:%23FFFFFF'/%3E%3C/svg%3E");background-size:contain;display:inline-block;vertical-align:sub}@media screen and (max-width:767px){.nav-bar{height:48px}.nav-bar ul{display:none}.nav-dropdown-button{color:#fff;cursor:pointer;font-size:22px;width:100px;height:48px;line-height:52px;text-align:right;display:inline-block}.nav-dropdown{position:relative;display:inline-block}.nav-dropdown-content{display:none;position:absolute;right:-15px;background-color:var(--accent-color);min-width:160px;z-index:1;border:2px solid rgba(255,255,255,.6);border-radius:10px}.nav-dropdown-content a{color:#fff!important;text-decoration:none;padding:12px 16px;display:block;border-radius:8px}.nav-dropdown:hover .nav-dropdown-content{display:block}.nav-dropdown-content a:hover{background-color:#f54876}}@media screen and (min-width:768px){.dropdown-button{display:none!important}}
            </style>
            <div class="navbar-container" translate="no">
                <div class="nav-bar">
                    <a class="nav-bar-title no-color-link no-underline-link-footer" href="index.html">
                        <img class="nav-bar-logo" src='data:image/avif;base64,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'/>
                        <h2>UMKL</h2>
                    </a>
                    <nav class="nav-flex">
                        <ul id="nav-bar">
                            <li><a href="../../../index.html">Home</a></li>
                            <li><a href="../../../pages/news/">News</a></li>
                            <li><a href="../../../pages/teams/">Teams</a></li>
                            <li><a href="../../../pages/matches/">Matches</a></li>
                            <li><a href="../../../pages/rules/">Rules</a></li>
                            <li><a href="../../../pages/faq/">FAQs</a></li>
                            <li><a class="nav-bar-link" href="https://discord.gg/jz3hKEmDss" target="_blank">Discord</a></li>
                        </ul>
                    </nav>
                    <div class="nav-dropdown">
                        <div class="nav-dropdown-button">☰</div>
                        <div class="nav-dropdown-content" id="nav-dropdown-bar">
                            <a href="../../../index.html">Home</a>
                            <a href="../../../pages/news/">News</a>
                            <a href="../../../pages/teams/">Teams</a>
                            <a href="../../../pages/matches/">Matches</a>
                            <a href="../../../pages/rules/">Rules</a>
                            <a href="../../../pages/faq/">FAQs</a>
                            <a class="nav-bar-link" href="https://discord.gg/jz3hKEmDss" target="_blank">Discord</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        const shadow = this.shadowRoot;
        const button = shadow.querySelector(".nav-dropdown-button");
        const dropdown = shadow.querySelector(".nav-dropdown-content");

        button.addEventListener("click", () => {
            const isOpen = dropdown.style.display === "block";
            dropdown.style.display = isOpen ? "none" : "block";
        });

        const currentPath = window.location.pathname.replace(/\/+$/, "").split("/index.html")[0];
        const links = shadow.querySelectorAll("#nav-bar a[href], #nav-dropdown-bar a[href]");
        links.forEach(link => {
            const linkPath = new URL(link.href).pathname.replace(/\/+$/, "");

            const isRootIndex = (linkPath.endsWith("/index.html") && (currentPath === "" || currentPath === "/"));
            const isSubPage = (currentPath.startsWith(linkPath) && linkPath !== "/");

            if (isRootIndex || isSubPage) {
                link.classList.add("nav-selected");
            }
        });
    }
}

customElements.define("umkl-navbar", UMKLNavbar);