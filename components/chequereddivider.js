// chequered-divider.js
const template = document.createElement("template");

const sheet = new CSSStyleSheet();
sheet.replaceSync(``);

template.innerHTML = `
<div id="divider-container" style="
background-color: var(--brand-light); 
width: 100%;
height: 3vw; 
position: fixed; 
z-index: 8;
display: flex; 
flex-direction: column; 
justify-content: center; 
align-items: center;">
<div id="chequered-pattern" style="
    width: 100%;
    height: 2vw; 
    background-color: var(--accent-color); 
    position: fixed; 
    z-index: 8;
    background-image: 
        repeating-linear-gradient(90deg, var(--brand-light) 0 1vw, transparent 1vw 2vw), 
        repeating-linear-gradient(90deg, transparent 0 1vw, var(--brand-light) 1vw 2vw); 
    background-size: 100% 1vw, 100% 1vw;
    background-position: 0 0, 0 1vw; 
    background-repeat: repeat-x; 
"></div>
</div>
`;

export class ChequeredDivider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    }
}

// Register the custom tag
customElements.define("chequered-divider", ChequeredDivider);