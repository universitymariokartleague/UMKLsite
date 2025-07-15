/*
    This script generates credits and social links 
    for use on the credits page.
*/

const contributors = [
    {
        name: "h.omeless",
        img: "https://cdn.discordapp.com/avatars/330762336669532161/05a6769f5dc50de87d584c49bcc9adf6.png?size=1024",
        discord: "https://discordapp.com/users/330762336669532161",
        github: "https://github.com/h-omeless/"
    },
    {
        name: "skjamm",
        img: "https://cdn.discordapp.com/avatars/309400933870206978/fa52349be7108e85402f5477e548bc77.png?size=1024",
        discord: "https://discordapp.com/users/309400933870206978"
    },
    {
        name: "theenderdiamond",
        img: "https://cdn.discordapp.com/avatars/427910181830131712/25384229bd2816748fec7742ec9a7371.png?size=1024",
        discord: "https://discordapp.com/users/427910181830131712"
    },
    {
        name: "tsun1509",
        img: "https://cdn.discordapp.com/avatars/342974732938903563/a1de65f7e5086abaaf452d9ede848d43?size=1024",
        discord: "https://discordapp.com/users/342974732938903563",
        github: "https://github.com/TusharSundarka/"
    },
    {
        name: "zyposts",
        img: "https://cdn.discordapp.com/avatars/1202021758685949994/64d75ad82deb314036e6b5113ae95a58.png?size=1024",
        discord: "https://discordapp.com/users/1202021758685949994",
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
        description: `Development of the Cheep Cheep app, which is used on the UMKL Discord server`,
        contributorIndexes: [0, 3, 4]
    },
    {
        title: "Website",
        description: `All the source code for the website can be found at our <a href="https://github.com/universitymariokartleague/UMKLsite">GitHub repository</a>`,
        contributorIndexes: [0, 3, 4]
    }
];

const socialPlatforms = [
    { key: "discord", icon: "fa-brands fa-discord", title: "Discord"},
    { key: "github", icon: "fa-brands fa-github", title: "GitHub" },
    { key: "twitter", icon: "fa-brands fa-twitter", title: "Twitter" },
    { key: "linkedin", icon: "fa-brands fa-linkedin", title: "LinkedIn" },
    { key: "email", icon: "fa-solid fa-envelope", title: "Email" }
];

function renderCreditsSection(section) {
    let html = `
        <div class="credits-title">
            <h2 ${section.title !== "Founding" ? ' class="after-title"' : ''}>${section.title}</h2>
            <p class="p-below-title">${section.description}</p>
        </div>
        <div class="credits-wrapper">
    `;
    section.contributorIndexes.forEach(i => {
        const person = contributors[i];
        html += `
        <div class="credit-container">
            <img src="${person.img}" width="50px" height="50px">
            <div class="credit-info">
                <b>${person.name}</b>
                <div class="credit-socials">
                    ${socialPlatforms.map(social =>
                        person[social.key]
                            ? `<a class="no-underline-link" href="${person[social.key]}" title="${social.title}"><span class="${social.icon}"></a></span>`
                            : ""
                    ).join("")}
                </div>
            </div>
        </div>
        `;
    });
    html += `</div>`;
    return html;
}

document.addEventListener("DOMContentLoaded", () => {
    const creditGenerate = document.getElementById("creditGenerate");
    let creditsHTML = "";
    sections.forEach(section => {
        creditsHTML += renderCreditsSection(section);
    });
    creditGenerate.classList.add('fade-in');
    creditGenerate.innerHTML = creditsHTML;
});