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
                        <img class="nav-bar-logo" src="../../../assets/media/brand/UMKLlogonav.avif" />
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
            const isOpen = dropdown.style.display === "flex";
            dropdown.style.display = isOpen ? "none" : "flex";
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