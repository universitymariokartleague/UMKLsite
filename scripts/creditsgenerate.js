/*
    This script generates credits and social links 
    for use on the credits page.
*/

const contributors = [
    {
        name: "h.omeless",
        discord: "https://discord.com/users/330762336669532161",
        github: "https://github.com/h-omeless/"
    },
    {
        name: "skjamm",
        discord: "https://discord.com/users/309400933870206978"
    },
    {
        name: "theenderdiamond",
        discord: "https://discord.com/users/427910181830131712"
    },
    {
        name: "tsun1509",
        discord: "https://discord.com/users/342974732938903563",
        github: "https://github.com/TusharSundarka/"
    },
    {
        name: "zyposts",
        discord: "https://discord.com/users/1202021758685949994",
        github: "https://github.com/zydezu/",
        email: "mailto:webmaster@umkl.co.uk"
    }
];

const sections = [
    {
        title: "Founding",
        description: `People responsible for the creation of the University Mario Kart League`,
        contributorIndexes: [0, 1, 2, 3, 4]
    },
    {
        title: "Cheep Cheep App",
        description: `Development of the Cheep Cheep app, which is used on the UMKL Discord server, view the site's privacy policy <a href="pages/privacy">here</a>`,
        contributorIndexes: [0, 3, 4]
    },
    {
        title: "Website",
        description: `All the source code for the website can be found at our <a href="https://github.com/universitymariokartleague/UMKLsite">GitHub repository</a>, view the site's privacy policy <a href="pages/privacy">here</a>`,
        contributorIndexes: [0, 3, 4]
    }
];

const socialPlatforms = [
    { key: "discord", icon: "fa-brands fa-discord", title: "Discord" },
    { key: "github", icon: "fa-brands fa-github", title: "GitHub" },
    { key: "twitter", icon: "fa-brands fa-twitter", title: "Twitter" },
    { key: "linkedin", icon: "fa-brands fa-linkedin", title: "LinkedIn" },
    { key: "email", icon: "fa-solid fa-envelope", title: "Email" }
];

function renderContributor(person) {
    const socials = socialPlatforms
        .filter(platform => person[platform.key])
        .map(platform =>
            `<a class="no-underline-link" href="${person[platform.key]}" title="${platform.title}">
                <span class="no-color-link-themed ${platform.icon}"></span>
            </a>`
        )
        .join("");

    return `
        <div class="credit-container">
            <img onload="this.style.opacity=1" loading="lazy" class="credit-image" src="assets/media/credits/${person.name}.avif">
            <div class="credit-info">
                <b>${person.name}</b>
                <div class="credit-socials">${socials}</div>
            </div>
        </div>
    `;
}

function renderCreditsSection({ title, description, contributorIndexes }) {
    const contributorsHTML = contributorIndexes
        .map(index => renderContributor(contributors[index]))
        .join("");

    return `
        <div class="credits-title">
            <h2${title !== "Founding" ? ' class="after-title"' : ''}>${title}</h2>
            <p class="p-below-title">${description}</p>
        </div>
        <div class="credits-wrapper">
            ${contributorsHTML}
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    const creditGenerate = document.getElementById("creditGenerate");
    creditGenerate.innerHTML = sections.map(renderCreditsSection).join("");
    creditGenerate.classList.add("fade-in");
});