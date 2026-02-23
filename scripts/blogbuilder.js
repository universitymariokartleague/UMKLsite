import { toggleSettingsPanel } from './settings.js';

const loadingArea = document.getElementById("loading-area");
const loadingBar = document.getElementById("loading-bar");

const editingArea = document.getElementById("editing-area");
const elementsList = document.getElementById("elements-list");
const pageArea = document.getElementById("page-area");
const blogButtons = document.getElementById("blog-buttons");

const importElementsListButton = document.getElementById("import-elements-list")
const exportElementsListButton = document.getElementById("export-elements-list");
const exportHTMLButton = document.getElementById("export-html");
const addImageButton = document.getElementById("add-image");
const clearElementsList = document.getElementById("clear-elements-list");
const resetDefaultElementsListButton = document.getElementById("reset-default-elements-list")

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

let blogElements = [];
const images = {}; 

const defaultBlogElements = [
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
        youtubeID: "eISfD64peMI"
    },
    {
        type: "blockquote",
        alt: "info",
        header: "Note",
        content: "Note here!"
    },
    {
        type: "img",
        src: "https://umkl.co.uk/assets/media/calendar/mikuheadshake.avif",
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
let storageExceeded = false;
let JSZipLoaded = false;

document.getElementById('edit-box-close-button').addEventListener('click', showElementEditUI);
document.getElementById('settings-icon').addEventListener('click', toggleSettingsPanel);

const blogFormatHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <base href="../../../../">

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{{blogTitle}} | UMKL</title>
    <meta name="description" content="{{blogDescription}}">
    <link rel="icon" href="assets/media/brand/favicon.png" type="image/png">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/settings.css">
    <link rel="stylesheet" href="css/ext/fontawesome.min.css">
    <meta name="color-scheme" content="dark light">

    <meta property="og:title" content="{{blogTitle}} | UMKL" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://umkl.co.uk/pages/news/{{blogDate}}/{{blogTitleLink}}" />
    <meta property="og:image" content="https://umkl.co.uk/pages/news/{{blogDate}}/{{blogTitleLink}}/{{blogImage}}" />
    <meta property="og:description" content="{{blogDescription}}" />
    <meta content="#bc0839" name="theme-color" />
    <meta content="https://umkl.co.uk/assets/media/brand/favicon.png" property="og:logo" />

    <!-- Include this to make the og:image larger -->
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Components -->
    <script type="module" src="components/navbar.js" defer></script>
    <script type="module" src="components/footer.js" defer></script>

    <!-- Scripts -->
    <script>const meta=document.querySelector('meta[name="color-scheme"]'),root=document.querySelector(":root");let darkThemeEnabled;function checkTheme(){let e=parseInt(localStorage.getItem("darktheme"));isNaN(e)&&(e=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?1:0),1===e?(meta.setAttribute("content","dark"),root.classList.add("dark-theme"),console.debug("%csettings.js %c> %cSetting dark theme","color:#ff4576","color:#fff","color:#ff9eb8")):(meta.setAttribute("content","light"),root.classList.add("light-theme"),console.debug("%csettings.js %c> %cSetting light theme","color:#ff4576","color:#fff","color:#ff9eb8"))}checkTheme();</script>
    
    <script type="module" src="scripts/settings.js" defer></script>
</head>
<body id="top">
    <umkl-navbar></umkl-navbar>

    <main>
        {{blogInfo}}
        <hr class="hr-below-title">
        {{blogContent}}
    </main>

    <umkl-footer></umkl-footer>
</body>
</html>
`;

function showBlogBuilder() {
    loadingArea.style.opacity = 0;
    editingArea.style.opacity = 1;
    
    buildBlogButtons();
    let savedBlog = JSON.parse(localStorage.getItem("blogBuilderBackup"));
    if (!savedBlog) savedBlog = defaultBlogElements;
    buildBlog(savedBlog);
}

function buildBlogButtons() {
    blogButtons.innerHTML = 'Add element:<br>' + Object.entries(friendlyTitles)
        .filter(([type]) => type !== "blogInfo")    
        .map(([type, label]) => `
            <button class="add-element-btn" data-type="${type}">
                ${label} (${type})
            </button>
        `)
        .join("<br>");

    blogButtons.addEventListener("click", (e) => {
        const type = e.target.dataset.type;
        if (!type) return;

        const newElement = createElementTemplate(type);
        blogElements.push(newElement);

        buildBlog(blogElements);
        showElementEditUI(blogElements.length - 1);
    });
}

function createElementTemplate(type) {
    switch (type) {
        case "blogInfo":
            return {
                type: "blogInfo",
                title: "",
                date: "",
                tags: [],
                writers: [],
                editors: []
            };

        case "h2":
            return {
                type: "h2",
                content: ""
            };

        case "p":
            return {
                type: "p",
                content: ""
            };

        case "pWithDetail":
            return {
                type: "pWithDetail",
                content: "",
                detail: ""
            };

        case "extraDetail":
            return {
                type: "extraDetail",
                content: ""
            };

        case "codeBox":
            return {
                type: "codeBox",
                content: ""
            };

        case "img":
            return {
                type: "img",
                src: "",
                alt: "",
                description: ""
            };

        case "blockquote":
            return {
                type: "blockquote",
                alt: "info",
                header: "",
                content: ""
            };

        case "youtubeEmbed":
            return {
                type: "youtubeEmbed",
                youtubeID: ""
            };

        default:
            return { type };
    }
}

function formatBytes(bytes) {
    let units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(2)}${units[i]}`;
}

function getLocalStorageBytes() {
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);

        total += new Blob([key]).size;
        total += new Blob([value]).size;
    }

    return total;
}

function backupBlog(data) {
    try {
        localStorage.setItem("blogBuilderBackup", JSON.stringify(data))
    } catch (error) {
        storageExceeded = true;
    }
}

function buildBlog(data) {
    backupBlog(data);
    blogElements = structuredClone(data);

    pageArea.innerHTML = "";
    let pageAreaHTML = "";
    let elementCounter = 0;

    let exportingAsHTML = true;

    blogElements.forEach(element => {
        const style = document.createElement('style');
        style.textContent = `
            html:has(.element${elementCounter}outline:hover) .element${elementCounter}outline {
                outline: 2px solid var(--text-color)!important;
                cursor: pointer;
            }
        `
        document.head.appendChild(style);

        switch (element.type) {
            case "blogInfo":
                let writersString = element.writers?.length
                    ? `Written by ${element.writers.join(", ")}`
                    : "";

                let editorsString = element.editors?.length
                    ? `Edited by ${element.editors.join(", ")}`
                    : "";

                let tagsHTML = "";
                element.tags.forEach(tag => {
                    tagsHTML += `<tag translate="no">${tag}</tag> `;
                });

                pageAreaHTML += `
                    <div id="element${elementCounter}" class="element${elementCounter}outline">
                        <a href="pages/news/">Back</a>
                        <h1>${element.title}</h1>
                        <div class="p-below-title">
                            ${element.date} | 
                            ${tagsHTML}
                            <div class="news-credits">${writersString}<br>${editorsString}</div>
                        </div>
                        <hr class="hr-below-title">
                    </div>
                `;
                break;

            case "h2":
                pageAreaHTML += `<h2 id="element${elementCounter}" class="element${elementCounter}outline">${element.content}</h2>`;
                break;

            case "p":
                pageAreaHTML += `<p id="element${elementCounter}" class="element${elementCounter}outline">${element.content}</p>`;
                break;

            case "pWithDetail":
                pageAreaHTML += `
                    <p id="element${elementCounter}" class="element${elementCounter}outline">
                        ${element.content}<br>
                        <span class="settings-extra-info">
                            ${element.detail}
                        </span>
                    </p>
                `;
                break;

            case "extraDetail":
                pageAreaHTML += `
                    <p id="element${elementCounter}" class="element${elementCounter}outline">
                        <span class="settings-extra-info">
                            ${element.content}
                        </span>
                    </p>
                `;
                break;

            case "codeBox":
                pageAreaHTML += `
                    <div class="codeBox element${elementCounter}outline" id="element${elementCounter}">
                        ${element.content}
                    </div>
                `;
                break;

            case "img":
                pageAreaHTML += `
                    <p id="element${elementCounter}" class="element${elementCounter}outline">
                        <img class="image" src="${element.src}" alt="${element.alt}">
                        <span class="settings-extra-info">${element.description}</span>
                    </p>
                `;

                if (element.src.includes("data:image/")) {
                    exportingAsHTML = false;
                }
                break;

            case "blockquote":
                pageAreaHTML += `
                    <blockquote class="${element.alt} element${elementCounter}outline" id="element${elementCounter}">
                        <b translate="no">${element.header}</b><br>
                        ${element.content}
                    </blockquote>
                `;
                break;

            case "youtubeEmbed":
                pageAreaHTML += `
                    <div class="iframe-wrapper element${elementCounter}outline">
                        <iframe class="youtube-embed" id="element${elementCounter}" src="https://www.youtube-nocookie.com/embed/${element.youtubeID}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe>
                        Click the red border above edit the YouTube link
                    </div>
                `;
                break;
        };
        elementCounter++;
    });

    exportHTMLButton.innerText = exportingAsHTML ? "Export HTML" : "Export Zip";

    pageArea.innerHTML = pageAreaHTML;
    elementsList.innerHTML = `
        <b>Blog Elements</b><br>
        ${blogElements.map((el, index) => `
            <div class="element${index}outline">
                <span id="element-list${index}">
                    ${index + 1}. ${el.type}
                </span>
                ${el.type !== "blogInfo" ? `
                    <span class="elements-edit">
                        ${index > 1 ? `<span id="moveelementup${index}" class="elements-move">▲</span>` : ''}
                        ${index < blogElements.length - 1 ? `<span id="moveelementdown${index}" class="elements-move">▼</span>` : ' '}
                        <span id="deleteelement${index}" class="elements-move">×</span>
                    </span>
                ` : ''}
            </div>
        `).join("")}
    `;

    const bytes = getLocalStorageBytes(localStorage);
    if (bytes) document.getElementById("storage-used").innerHTML = `${formatBytes(bytes)}/5MB${storageExceeded ? '<br>Storage limit has been exceeded! Changes will not be saved!' : ''}`;

    for (let i = 0; i < blogElements.length; i++) {
        document.getElementById(`element${i}`).addEventListener("click", () => {
            showElementEditUI(i);
        });

        document.getElementById(`element-list${i}`).addEventListener("click", () => {
            showElementEditUI(i);
        });

        if (blogElements[i].type === "blogInfo") continue;

        document.getElementById(`deleteelement${i}`).addEventListener("click", () => {
            deleteElement(i);
        });

        if (i > 1) {
            document.getElementById(`moveelementup${i}`).addEventListener("click", () => {
                moveElementUp(i);
            });
        }

        if (i < blogElements.length - 1) {
            document.getElementById(`moveelementdown${i}`).addEventListener("click", () => {
                moveElementDown(i);
            });
        }
    }
};

function buildHTML(data) {
    blogElements = structuredClone(data);

    let blogInfo = "";
    let blogTitle, blogDescription, blogDate;
    let blogHTML = "";

    const dataImages = [];

    blogElements.forEach(element => {
        switch (element.type) {
            case "blogInfo":
                let writersString = element.writers?.length
                    ? `Written by ${element.writers.join(", ")}`
                    : "";

                let editorsString = element.editors?.length
                    ? `Edited by ${element.editors.join(", ")}`
                    : "";

                let tagsHTML = "";
                element.tags.forEach(tag => {
                    tagsHTML += `<tag translate="no">${tag}</tag> `;
                });

                blogTitle = element.title;
                blogDescription = "??????????"
                blogDate = element.date;
                
                if (element.date && /^\d{2}\/\d{2}\/\d{4}$/.test(element.date)) {
                    const [day, month, year] = element.date.split('/');
                    blogDate = `${year}-${month}-${day}`;
                } else {
                    blogDate = "????-??-??"
                }

                blogInfo = `
                    <a href="pages/news/">Back</a>
                    <h1>${element.title}</h1>
                    <div class="p-below-title">
                        ${element.date} | 
                        ${tagsHTML}
                        <div class="news-credits">${writersString}<br>${editorsString}</div>
                    </div>
                `;
                break;
            
            case "h2":
                blogHTML += `<h2>${element.content}</h2>`;
                break;

            case "p":
                blogHTML += `<p>${element.content}</p>`;
                break;

            case "pWithDetail":
                blogHTML += `
                    <p>
                        ${element.content}<br>
                        <span class="settings-extra-info">
                            ${element.detail}
                        </span>
                    </p>
                `;
                break;

            case "extraDetail":
                blogHTML += `
                    <p>
                        <span class="settings-extra-info">
                            ${element.content}
                        </span>
                    </p>
                `;
                break;

            case "codeBox":
                blogHTML += `
                    <div class="codeBox">
                        ${element.content}
                    </div>
                `;
                break;

            case "img":
                blogHTML += `
                    <p>
                        <img class="image" src="${element.src}" alt="${element.alt}">
                        <span class="settings-extra-info">${element.description}</span>
                    </p>
                `;

                if (element.src.includes("data:image/")) {
                    let fileExtension = element.src.split(";")[0].split("/")[1];
                    let imageFileName = element.alt.replace(`.${fileExtension}`, "") || `image${dataImages.length + 1}`;

                    const base64Data = element.src.split(",")[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let j = 0; j < binaryString.length; j++) {
                        bytes[j] = binaryString.charCodeAt(j);
                    }
                    const blob = new Blob([bytes], { type: `image/${fileExtension}` });
                    dataImages.push({ name: `${imageFileName}.${fileExtension}`, blob });
                }

                break;

            case "blockquote":
                blogHTML += `
                    <blockquote class="${element.alt}">
                        <b translate="no">${element.header}</b><br>
                        ${element.content}
                    </blockquote>
                `;
                break;

            case "youtubeEmbed":
                blogHTML += `
                    <iframe class="youtube-embed" src="https://www.youtube-nocookie.com/embed/${element.youtubeID}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe>
                `;
                break;
        }
    });

    let resultHTML = blogFormatHTML
        .replaceAll("{{blogTitle}}", blogTitle)
        .replaceAll("{{blogTitleLink}}", blogTitle.toLowerCase().replace(" ", "-"))
        .replaceAll("{{blogDescription}}", blogDescription)
        .replaceAll("{{blogDate}}", blogDate)
        .replace("{{blogInfo}}", blogInfo)
        .replace("{{blogContent}}", blogHTML)

    return { html: resultHTML, images: dataImages };
}

function moveElementUp(i) {
    if (i <= 0) return;

    const temp = blogElements[i];
    blogElements[i] = blogElements[i - 1];
    blogElements[i - 1] = temp;

    buildBlog(blogElements);
}

function moveElementDown(i) {
    if (i >= blogElements.length - 1) return;

    const temp = blogElements[i];
    blogElements[i] = blogElements[i + 1];
    blogElements[i + 1] = temp;

    buildBlog(blogElements);
}

function deleteElement(i) {
    blogElements.splice(i, 1);
    buildBlog(blogElements);
}

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

function extractYouTubeID(url) {
    try {
        const parsed = new URL(url);

        if (parsed.searchParams.get("v")) {
            return parsed.searchParams.get("v").replace(/[^0-9A-Za-z_-]/g, "");
        }

        if (parsed.hostname.includes("youtu.be")) {
            return parsed.pathname.slice(1).replace(/[^0-9A-Za-z_-]/g, "");
        }

    } catch (e) {
        return url;
    }

    const match = url.match(/[0-9A-Za-z_-]{11}/);
    return match ? match[0] : null;
}

function generateEditUIHTML(i) {
    const element = blogElements[i];
    editBoxLabel.innerText = `Edit ${friendlyTitles[element.type]} UI`

    const keys = Object.keys(element);
    const areImagesImported = Object.keys(images).length > 0;

    const fieldsHTML = `
        ${keys
            .map((key, i) => {
                if (key === "type") {
                    return `
                        <code>${key}: ${element[key]}</code><br>
                        ${element[key] == "img" && areImagesImported ? 
                            `Choose an imported image:
                            <select id="import-image-dropdown" class="edit-ui-field" style="height: unset">
                                <option value="">Choose an image!</option>
                                ${Object.keys(images).map(name => `<option value="${name}">${name}</option>`).join("")}
                            </select>` : 
                            'Use the <code>Import Image</code> button to add images from your device'
                        }
                        <br>
                    `;
                }

                return `
                    <code>${key}</code><br>
                    <textarea class="edit-ui-field" translate="no" id="editAttribute${i}">${element[key]}</textarea>
                `;
            })
            .join("<br>")
        }
    `;

    editBoxJS.innerHTML = `
        <p>
            <div class="codeBoxTight" style="max-height: 100px; overflow-y: auto;">${JSON.stringify(element)}</div>
            Edit attributes: ${fieldsHTML}
        </p>
        <button id="apply-edit-button">Apply Properties</button> <button id="delete-element-button">Delete element</button>
    `;

    if (element.type == "img" && areImagesImported) {
        const dropdown = document.getElementById("import-image-dropdown");
        dropdown.addEventListener("change", () => {
            if (dropdown.value != "") {
                editBoxLabel.innerText = "Loading image...";
                const file = images[dropdown.value];
                const reader = new FileReader();
                reader.onload = () => {
                    element.src = reader.result;
                    element.alt = dropdown.value;
                    blogElements[i] = element;
                    buildBlog(blogElements);
                    showElementEditUI();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    document.getElementById("apply-edit-button").addEventListener("click", () => {
        const tagStrip = str => str.replace(/<[^>]*>/g, "");
        
        keys.forEach((key, idx) => {
            if (key !== "type") {
                const field = document.getElementById(`editAttribute${idx}`);
                let newVal = tagStrip(field.value);

                if (key === "tags" || key === "writers" || key === "editors") {
                    newVal = newVal
                        .split(",")
                        .map(s => s.trim())
                        .filter(s => s);
                }

                if (key === "youtubeID") {
                    newVal = extractYouTubeID(newVal);
                }

                element[key] = newVal;
            }
        });

        blogElements[i] = element;
        buildBlog(blogElements);
        showElementEditUI();
    });

    document.getElementById("delete-element-button").addEventListener("click", () => {
        deleteElement(i);
        showElementEditUI();
    });
}

importElementsListButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);

                if (!Array.isArray(parsed)) {
                    alert("Invalid JSON: Expected an array.");
                    return;
                }

                blogElements = parsed;
                buildBlog(blogElements);
            } catch (err) {
                alert("Invalid JSON:\n" + err.message);
            }
        };

        reader.readAsText(file);
    });

    input.click();
});

exportElementsListButton.addEventListener("click", () => {
    const json = JSON.stringify(blogElements, null, 4);
    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const title = blogElements.find(e => e.type === "blogInfo")?.title || "Blog";

    a.download = `${title.replace(/ /g, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

clearElementsList.addEventListener("click", () => {
    blogElements.splice(1);
    buildBlog(blogElements);
});

resetDefaultElementsListButton.addEventListener("click", () => {
    buildBlog(defaultBlogElements);
});

addImageButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.addEventListener("change", () => {
        Array.from(input.files).forEach(file => {
            images[file.name] = file;
        });
        console.log("Stored images:", images);
    });

    input.click();
});

function loadJSZipScript() {
    return new Promise((resolve, reject) => {
        if (JSZipLoaded) {
            resolve();
            return;
        }
        var script = document.createElement('script');
        script.onload = function () {
            JSZipLoaded = true;
            resolve();
        };
        script.onerror = function () {
            reject(new Error('Failed to load JSZip script'));
        };
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(script);
    });
}

exportHTMLButton.addEventListener("click", () => {
    let resultObject = buildHTML(blogElements);
    const blob = new Blob([resultObject.html], { type: "text/html" });

    console.log(resultObject.html);
    console.log(resultObject.images);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const title = blogElements.find(e => e.type === "blogInfo")?.title || "Blog";

    if (resultObject.images.length > 0) {
        loadJSZipScript().then(() => {
            const zip = new JSZip();
            zip.file(`${title.replace(/ /g, "")}.html`, resultObject.html);
            const imagesFolder = zip.folder("images");
            resultObject.images.forEach(image => {
                imagesFolder.file(image.name, image.blob);
            });
            zip.generateAsync({ type: "blob" }).then((content) => {
                const zipUrl = URL.createObjectURL(content);
                const link = document.createElement('a');
                link.href = zipUrl;
                link.download = `${title.replace(/ /g, "")}.zip`;
                link.click();
                URL.revokeObjectURL(zipUrl);
            });
        }).catch(error => {
            console.error("Error loading JSZip:", error);
        });
    } else {
        a.download = `${title.replace(/ /g, "")}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    let textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    let loadProgress = 0;
    loadingBar.style.opacity = 1;
    const loadInterval = setInterval(() => {
        loadProgress += 5;
        loadingBar.style.borderLeft = `${loadProgress * 2.5}px solid ${textColor}`;
        loadingBar.style.width = `${250 - (loadProgress * 2.5)}px`;
        if (loadProgress >= 100) {
            clearInterval(loadInterval);
            showBlogBuilder();
        }
    }, 10);
});