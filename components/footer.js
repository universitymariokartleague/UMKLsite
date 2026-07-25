import { toggleSettingsPanel } from '../scripts/settings.js';
import "./chequereddivider.js";

const template = document.createElement("template");

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
    .no-underline-link-footer { text-decoration: none; }
    .no-color-link { color: #fff !important; }
    svg { width: 18px; height: 18px; fill: #fff; margin-left: 2px; margin-bottom: -1px; vertical-align: middle; cursor: pointer; }
    a svg:hover { opacity: .75; transition: .1s ease-in-out; }
`);

template.innerHTML = `
<chequered-divider></chequered-divider>
<div translate="no">
Hello
</div>
`;

class UMKLFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        const shadow = this.shadowRoot;
        shadow.adoptedStyleSheets = [sheet];

        const settingsButton = shadow.getElementById("settings-icon");
        if (settingsButton) {
            settingsButton.addEventListener("click", () => toggleSettingsPanel());
        }
    }
}

customElements.define("umkl-footer", UMKLFooter);