const navbar = document.getElementById("nav-bar")

function fillNavbar() {
    console.log(navbar)

    navbar.innerHTML = ""
    addNavPage(`<li><a href="index.html">Home</a></li>`)
    addNavPage(`<li><a href="pages/news/">News</a></li>`)
    addNavPage(`<li><a href="pages/teams/">Teams</a></li>`)
    addNavPage(`<li><a href="pages/matches/">Matches</a></li>`)
    addNavPage(`<li><a href="pages/faq/">FAQ</a></li>`)
    addNavPage(`<li><a class="nav-bar-link" target="_blank" href="https://discord.gg/6jS7YUqnbh">Discord</a></li>`)
}

function addNavPage(HTML) {
    navbar.innerHTML += HTML
}

fillNavbar();