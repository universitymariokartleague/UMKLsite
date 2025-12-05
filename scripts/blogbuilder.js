import { toggleSettingsPanel } from './settings.js';

const loadingArea = document.getElementById("loading-area");
const loadingBar = document.getElementById("loading-bar");

const editingArea = document.getElementById("editing-area");
const elementsList = document.getElementById("elements-list");
const pageArea = document.getElementById("page-area");

let blogElements = [];
let friendlyTitles = {
    blogInfo: "Blog Information",
    h2: "Sub-Header",
    p: "Text",
    pWithDetail: "Text With Detail",
    extraDetail: "Extra Detail",
    codeBox: "Code Box",
    img: "Image",
    blockquote: "Blockquote",
    youtubeEmbed: "YouTube Embed",

}
let defaultBlogElements = [
    {
        type: "blogInfo",
        title: "Blog Title",
        date: "12/12/2025",
        tags: ["tag", "tag2"],
        writers: ["?"],
        editors: ["?"]
    },
    {
        type: "p",
        content: "text body"
    },
    {
        type: "youtubeEmbed",
        link: "https://www.youtube-nocookie.com/embed/jNQXAC9IVRw"
    },
    {
        type: "blockquote",
        alt: "info",
        header: "Note",
        content: "Note here!"
    },
    {
        type: "blockquote",
        alt: "warning",
        header: "Warning",
        content: "Warning here!"
    },
    {
        type: "blockquote",
        alt: "success",
        header: "Success",
        content: "Success here!"
    },
    {
        type: "blockquote",
        alt: "fail",
        header: "Fail",
        content: "Fail here!"
    },
    {
        type: "img",
        src: "assets/media/calendar/mikuheadshake.avif",
        alt: "Miku shaking her head",
        description: "Write a description of the image here"
    },
    {
        type: "h2",
        content: "subheading"
    },
    {
        type: "pWithDetail",
        content: "more text",
        detail: "Extra detail attached"
    },
    {
        type: "codeBox",
        content: "code box<br>- changelogs"
    },
    {
        type: "extraDetail",
        content: "Extra detail"
    }
]

const editBoxHTML = `
    <div class="hidden BGBlur" id="editBGBlur"></div>
    <div translate="no" class="hidden hide-settings-box" id="editBox">
        <div class="edit-box-close-button">
            <button id="edit-box-close-button">Close</button>
        </div>
        <div translate="yes" class="settings-title" id="edit-box-label">Edit UI</div>
        <div class="setting-options" id="editBoxJS"></div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', editBoxHTML);
const BGBlur = document.getElementById('editBGBlur');
const editBox = document.getElementById('editBox');
const editBoxJS = document.getElementById('editBoxJS');
const editBoxLabel = document.getElementById('edit-box-label');
let editBoxOpen = false;

document.getElementById('edit-box-close-button').addEventListener('click', showElementEditUI);
document.getElementById('settings-icon').addEventListener('click', toggleSettingsPanel)

function showBlogBuilder() {
    loadingArea.style.opacity = 0;
    editingArea.style.opacity = 1;
    buildBlog(defaultBlogElements);
}

function buildBlog(data) {
    blogElements = data;

    pageArea.innerHTML = "";
    let pageAreaHTML = "";
    let elementCounter = 0;

    blogElements.forEach(element => {
        switch (element.type) {
            case "blogInfo":
                let writersString = element.writers.join(", ");
                let editorsString = element.editors.join(", ");
                let tagsHTML = "";
                element.tags.forEach(tag => {
                    tagsHTML += `<tag translate="no">${tag}</tag> `;
                });

                pageAreaHTML += `
                    <div id="element${elementCounter}">
                        <a href="pages/news/">Back</a>
                        <h1>${element.title}</h1>
                        <div class="p-below-title">
                            ${element.date} | 
                            ${tagsHTML}
                            <div class="news-credits">Written by ${writersString}<br>Edited by ${editorsString}</div>
                        </div>
                        <hr class="hr-below-title">
                    </div>
                `;
                break;

            case "h2":
                pageAreaHTML += `<h2 id="element${elementCounter}">${element.content}</h2>`;
                break;

            case "p":
                pageAreaHTML += `<p id="element${elementCounter}">${element.content}</p>`;
                break;

            case "pWithDetail":
                pageAreaHTML += `
                    <p id="element${elementCounter}">
                        ${element.content}<br>
                        <span class="settings-extra-info">
                            ${element.detail}
                        </span>
                    </p>
                `;
                break;

            case "extraDetail":
                pageAreaHTML += `
                    <p id="element${elementCounter}">
                        <span class="settings-extra-info">
                            ${element.content}
                        </span>
                    </p>
                `;
                break;

            case "codeBox":
                pageAreaHTML += `
                    <div class="codeBox" id="element${elementCounter}">
                        ${element.content}
                    </div>
                `;
                break;

            case "img":
                pageAreaHTML += `
                    <p id="element${elementCounter}">
                        <img class="image" src="${element.src}" alt="${element.alt}">
                        <span class="settings-extra-info">${element.description}</span>
                    </p>
                `;
                break;

            case "blockquote":
                pageAreaHTML += `
                    <blockquote class="${element.alt}" id="element${elementCounter}">
                        <b translate="no">${element.header}</b><br>
                        ${element.content}
                    </blockquote>
                `;
                break;

            case "youtubeEmbed":
                pageAreaHTML += `
                    <iframe class="youtube-embed" id="element${elementCounter}" src="${element.link}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe>
                `;
                break;
        };
        elementCounter++;
    });

    pageArea.innerHTML = pageAreaHTML;
    elementsList.innerHTML = `
        <b>Elements List</b><br>
        ${blogElements.map((el, index) => `${index + 1}. ${el.type}`).join("<br/>")}
        <br/><br/><button id="exportElementsList">Export as JSON</button>
    `;

    for (let i = 0; i < blogElements.length; i++) {
        document.getElementById(`element${i}`).addEventListener("click", () => {
            showElementEditUI(i);
        });
    }

    document.getElementById("exportElementsList").addEventListener("click", () => {
        const json = JSON.stringify(blogElements, null, 4);
        const blob = new Blob([json], { type: "application/json" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const title = blogElements.find(e => e.type === "blogInfo")?.title || "Blog";

        a.download = `${title.replace(/ /g, "")}Elements.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
};

function showElementEditUI(i) {
    BGBlur.classList.toggle("hidden");
    editBox.classList.toggle('hide-settings-box');
    if (!editBoxOpen) {
        generateEditUIHTML(i);
        editBox.classList.remove('hidden');
        BGBlur.addEventListener("click", showElementEditUI);
    }
    editBoxOpen = !editBoxOpen;
}

function generateEditUIHTML(i) {
    const element = blogElements[i];
    editBoxLabel.innerText = `Edit ${friendlyTitles[element.type]} UI`
    editBoxJS.innerHTML = `
        <p>
            <div class="codeBoxTight">${JSON.stringify(element)}</div>
            Edit fields:
        </p>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    let textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    let loadProgress = 0;
    loadingBar.style.opacity = 1;
    const loadInterval = setInterval(() => {
        loadProgress += 1;
        loadingBar.style.borderLeft = `${loadProgress * 2.5}px solid ${textColor}`;
        loadingBar.style.width = `${250 - (loadProgress * 2.5)}px`;
        if (loadProgress >= 100) {
            clearInterval(loadInterval);
            showBlogBuilder();
        }
    }, 1);
});