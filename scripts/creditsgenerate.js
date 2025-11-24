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
        name: "skipper93653",
        discord: "https://discord.com/users/344532854102949909"
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
    },
    {
        name: "zydezu",
        discord: "https://discord.com/users/1202021758685949994",
        github: "https://github.com/zydezu/",
        email: "mailto:webmaster@umkl.co.uk",
    }
];

const sections = [
    {
        title: "Founding",
        description: `People responsible for the creation of the University Mario Kart League`,
        contributorIndexes: [0, 1, 2, 3, 4, 5]
    },
    {
        title: "Cheep Cheep App",
        description: `Development of the Cheep Cheep app, which is used on the UMKL Discord server, view the site's privacy policy <a href="pages/privacy">here</a>`,
        contributorIndexes: [0, 4, 5]
    },
    {
        title: "Website",
        description: `All the source code for the website can be found at our <a href="https://github.com/universitymariokartleague/UMKLsite">GitHub repository</a>, view the site's privacy policy <a href="pages/privacy">here</a>`,
        contributorIndexes: [0, 4, 5]
    }
];

let w = "width=18px height=18px"
const socialPlatforms = [
    { key: "discord", title: "Discord", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18"><path d="M20.317 1.516A19.8 19.8 0 0 0 15.432.001a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 13 13 0 0 0-.617-1.25.08.08 0 0 0-.079-.037 19.7 19.7 0 0 0-4.885 1.515.1.1 0 0 0-.032.027C.533 6.192-.32 10.726.099 15.203a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10 10 0 0 0 .372-.292.07.07 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .078.01 10.02 10.02 0 0 0 .373.292.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107 15.98 15.98 0 0 0 1.225 1.993.08.08 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 12.476c-1.182 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418" fill="currentColor"/></svg>` },
    { key: "github", title: "GitHub", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.475 2 2 6.478 2 12a10 10 0 0 0 6.838 9.488c.5.094.683-.215.683-.481 0-.238-.008-.867-.013-1.7-2.781.603-3.368-1.342-3.368-1.342-.455-1.154-1.112-1.462-1.112-1.462-.906-.62.07-.608.07-.608 1.004.07 1.531 1.03 1.531 1.03.892 1.53 2.341 1.088 2.913.832.09-.647.347-1.088.633-1.338-2.22-.25-4.555-1.11-4.555-4.941 0-1.092.388-1.984 1.03-2.684-.113-.252-.45-1.269.087-2.646 0 0 .837-.269 2.75 1.025.8-.223 1.65-.333 2.5-.338.85.005 1.7.115 2.5.338 1.9-1.294 2.737-1.025 2.737-1.025.538 1.377.2 2.394.1 2.646.638.7 1.025 1.592 1.025 2.684 0 3.841-2.337 4.687-4.562 4.933.35.3.675.913.675 1.85 0 1.338-.013 2.413-.013 2.738 0 .263.175.575.688.475A9.965 9.965 0 0 0 22 12c0-5.522-4.477-10-10-10" style="fill:currentColor;stroke-width:.833333"/></svg>` },
    { key: "youtube", title: "YouTube", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z" fill="currentColor"/></svg>` },
    { key: "twitter", title: "Twitter", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15 3.784a5.6 5.6 0 0 1-.65.803 6 6 0 0 1-.786.68 5 5 0 0 1 .014.377q0 .86-.184 1.702a8.5 8.5 0 0 1-.534 1.627 8.4 8.4 0 0 1-1.264 2.04 7.8 7.8 0 0 1-1.72 1.521 7.8 7.8 0 0 1-2.095.95 8.5 8.5 0 0 1-2.379.329 8.2 8.2 0 0 1-2.293-.325A8 8 0 0 1 1 12.52a5.76 5.76 0 0 0 4.252-1.19 2.84 2.84 0 0 1-2.273-1.19 2.9 2.9 0 0 1-.407-.8q.137.021.27.035a2.8 2.8 0 0 0 1.022-.089 2.8 2.8 0 0 1-.926-.362 3 3 0 0 1-.728-.633 2.84 2.84 0 0 1-.65-1.822v-.033q.603.34 1.306.362a2.94 2.94 0 0 1-.936-1.04 3 3 0 0 1-.253-.649 2.95 2.95 0 0 1 .007-1.453q.095-.364.294-.693.546.677 1.216 1.213a8.2 8.2 0 0 0 3.008 1.525 8 8 0 0 0 1.695.263 2 2 0 0 1-.058-.325 3 3 0 0 1-.017-.331q0-.596.226-1.118a2.9 2.9 0 0 1 1.528-1.528 2.8 2.8 0 0 1 1.117-.225 2.85 2.85 0 0 1 2.099.909 5.7 5.7 0 0 0 1.818-.698 2.82 2.82 0 0 1-1.258 1.586A5.7 5.7 0 0 0 15 3.785z" fill="currentColor"/></svg>` },
    { key: "bluesky", title: "Bluesky", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026" fill="currentColor"/></svg>` },
    { key: "instagram", title: "Instagram", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.859 2.071c-1.064.05-1.791.22-2.425.469a4.917 4.917 0 0 0-1.77 1.157 4.917 4.917 0 0 0-1.15 1.772c-.246.637-.413 1.365-.46 2.428l-.053 4.122.069 4.122c.051 1.064.22 1.791.469 2.426a4.9 4.9 0 0 0 1.157 1.769 4.917 4.917 0 0 0 1.774 1.15c.636.246 1.363.413 2.427.46L12.02 22l4.122-.068c1.067-.05 1.789-.221 2.425-.469a4.917 4.917 0 0 0 1.769-1.157 4.917 4.917 0 0 0 1.15-1.774c.246-.636.413-1.363.459-2.427l.052-4.123-.067-4.122c-.05-1.067-.22-1.79-.47-2.426a4.917 4.917 0 0 0-1.156-1.769 4.883 4.883 0 0 0-1.773-1.15c-.637-.245-1.363-.413-2.428-.458l-4.122-.055-4.122.07m.117 18.077c-.975-.042-1.504-.204-1.857-.34a3.083 3.083 0 0 1-1.152-.746 3.083 3.083 0 0 1-.75-1.148c-.137-.352-.302-.882-.347-1.857l-.067-4.04.051-4.04c.042-.974.205-1.504.34-1.857a3.11 3.11 0 0 1 .746-1.152 3.083 3.083 0 0 1 1.149-.75c.353-.138.881-.301 1.856-.348l4.04-.067 4.042.052c.973.042 1.503.203 1.856.34.467.18.8.396 1.152.746s.567.681.75 1.148c.137.352.302.88.348 1.856l.067 4.04-.051 4.04c-.043.975-.204 1.504-.34 1.858a3.09 3.09 0 0 1-.747 1.15 3.083 3.083 0 0 1-1.148.75c-.352.137-.882.302-1.855.348l-4.042.066c-2.671.006-2.985-.005-4.04-.05m8.152-13.493a1.2 1.2 0 1 0 1.198-1.202 1.2 1.2 0 0 0-1.198 1.202m-9.262 5.355a5.135 5.135 0 1 0 10.269-.02 5.135 5.135 0 0 0-10.269.02m1.801-.003a3.333 3.333 0 1 1 3.34 3.327 3.333 3.333 0 0 1-3.34-3.327" fill="currentColor"/></svg>` },
    { key: "facebook", title: "Facebook", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.584 21.706v-6.65H7.522V12h2.062v-1.317c0-3.404 1.54-4.982 4.882-4.982.334 0 .796.035 1.223.086a7.5 7.5 0 0 1 .951.162v2.771a7.5 7.5 0 0 0-.544-.03 22.5 22.5 0 0 0-.611-.008c-.589 0-1.049.08-1.396.258a1.417 1.417 0 0 0-.566.518c-.215.35-.312.829-.312 1.46V12h3.266l-.322 1.752-.239 1.303h-2.705v6.871C18.163 21.328 22 17.113 22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 4.69 3.228 8.625 7.584 9.706" fill="currentColor"/></svg>` },
    { key: "email", title: "Email", svg: `<svg ${w} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="m16 16.8 13.8-9.2C29.2 5.5 27.3 4 25 4H7C4.7 4 2.8 5.5 2.2 7.6z" style="fill:currentColor"/><path d="M16.6 18.8c-.2.1-.4.2-.6.2s-.4-.1-.6-.2L2 9.9V23c0 2.8 2.2 5 5 5h18c2.8 0 5-2.2 5-5V9.9z" style="fill:currentColor"/></svg>` }
];

function renderContributor(person) {
    const socials = socialPlatforms
        .filter(platform => person[platform.key])
        .map(platform =>
            `<a class="no-underline-link" href="${person[platform.key]}" title="${platform.title}">
                <div class="credits-icon">${platform.svg}</div>
            </a>`
        )
        .join("");

    return `
        <div translate="no" class="credit-container">
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