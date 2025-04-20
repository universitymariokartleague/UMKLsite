import os, re
from bs4 import BeautifulSoup

TEAM_PAGE = """
<!DOCTYPE html>
<html lang="en" data-overlayscrollbars-initialize>
    <head>
        <base href="../../../">
    
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Team {TEAMNAME} | University Mario Kart League</title>
        <meta name="description" content="Information about Team {TEAMNAME}, which are participating in the University Mario Kart League (UMKL)">
        <link rel="shortcut icon" href="assets/brand/favicon.png" type="image/png">
        <link rel="stylesheet" href="css/style.css">
        <link rel="stylesheet" href="css/settings.css">
        <link rel="stylesheet" href="css/overlayscrollbars.min.css">
        <meta name="color-scheme" content="dark light">
    
        <meta property="og:title" content="University Mario Kart League | Teams" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://umkl.co.uk/pages/teams/" />
        <meta property="og:image" content="https://umkl.co.uk/assets/brand/Cheep_Cheep_banner.png" />
        <meta property="og:description" content="Information about Team {TEAMNAME}, which are participating in the University Mario Kart League (UMKL)" />
        <meta name="theme-color" content="#bc0839">
    
        <!-- Include this to make the og:image larger -->
        <meta name="twitter:card" content="summary_large_image">
    
        <!-- Scripts -->
        <script>const meta=document.querySelector('meta[name="color-scheme"]'),root=document.querySelector(":root");let darkThemeEnabled;function checkTheme(){let e=parseInt(localStorage.getItem("darktheme"));isNaN(e)&&(e=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?1:0),1===e?(meta.setAttribute("content","dark"),root.classList.add("dark-theme"),localStorage.setItem("darktheme",1),console.debug("%csettings.js %c> %cChanging to dark theme","color:#ff4576","color:#fff","color:#ff9eb8")):(meta.setAttribute("content","light"),root.classList.add("light-theme"),localStorage.setItem("darktheme",0),console.debug("%csettings.js %c> %cChanging to light theme","color:#ff4576","color:#fff","color:#ff9eb8"))}checkTheme();</script>
        <script src="scripts/overlayscrollbars.browser.es6.min.js" defer></script>
        <script src="scripts/overlayscrollbar.js" defer></script>    
        
        <script type="module" src="scripts/settings.js" defer></script>
        <script src='https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.js' defer></script>
        <script type="module" src="scripts/teaminfogenerate.js" defer></script>
    </head>
    <body id="top" data-overlayscrollbars-initialize>
        <div class="navbar-container">
            <div class="nav-bar">
                <a href="../../index.html" class="nav-bar-title no-color-link no-underline-link">
                    <img src="assets/brand/UMKLlogonav.webp" class="nav-bar-logo" alt="UMKL logo">
                    <h2>UMKL</h2>
                </a>
                <nav class="nav-flex">
                    <ul>
                        <li><a href="../../index.html">Home</a></li>
                        <li><a href="pages/teams/">Teams</a></li>
                        <li><a href="pages/matches/">Matches</a></li>
                        <li><a href="pages/faq/">FAQs</a></li>
                        <li><a class="nav-bar-link" target="_blank" href="https://discord.gg/6jS7YUqnbh">Discord</a></li>
                    </ul>
                </nav>
            </div>
        </div>

        <main>
            <h2>{TEAMNAME}</h2>
            <p class="p-below-title">
                Team information about {TEAMNAME}.   
            </p>
            <hr class="hr-below-title">

            <div id="JSTeamBox" class="teamBoxContainer" data-team="{TEAMNAME}">
                Loading team data...
            </div>

            <h3 class="p-no-spacing">Socials</h3>
            <p class="p-no-spacing">
                <a href="{NEEDSCHANGING}">{NEEDSCHANGING}</a><br>
                <a href="{NEEDSCHANGING}">{NEEDSCHANGING}</a><br>
                <a href="{NEEDSCHANGING}">{NEEDSCHANGING}</a><br>
                <a href="{NEEDSCHANGING}">{NEEDSCHANGING}</a><br>
            </p>

            <h3 class="p-no-spacing">Clips and media</h3>
            <p class="p-no-spacing">

            </p>
        </main>

        <footer>
            UMKL 2025 | 
            <a class="no-color-link" href="pages/credits/">Credits</a> |
            <a class="fa fa-gear no-color-link settingsBoxOpener"></a>
        </footer>
    </body>
</html>
"""

NEWS_PAGE = """
<!DOCTYPE html>
<html lang="en" data-overlayscrollbars-initialize>
    <head>
        <base href="../../">
    
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>News | University Mario Kart League</title>
        <meta name="description" content="See all the news concerning the University Mario Kart League (UMKL)">
        <link rel="shortcut icon" href="assets/brand/favicon.png" type="image/png">
        <link rel="stylesheet" href="css/style.css">
        <link rel="stylesheet" href="css/settings.css">
        <link rel="stylesheet" href="css/overlayscrollbars.min.css">
        <meta name="color-scheme" content="dark light">
    
        <meta property="og:title" content="University Mario Kart League | Matches" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://umkl.co.uk/pages/news/" />
        <meta property="og:image" content="https://umkl.co.uk/assets/brand/Cheep_Cheep_banner.png" />
        <meta property="og:description" content="See all the news concerning the University Mario Kart League (UMKL)" />
        <meta name="theme-color" content="#bc0839">
    
        <!-- Include this to make the og:image larger -->
        <meta name="twitter:card" content="summary_large_image">
    
        <!-- Scripts -->
        <script>const meta=document.querySelector('meta[name="color-scheme"]'),root=document.querySelector(":root");let darkThemeEnabled;function checkTheme(){let e=parseInt(localStorage.getItem("darktheme"));isNaN(e)&&(e=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?1:0),1===e?(meta.setAttribute("content","dark"),root.classList.add("dark-theme"),localStorage.setItem("darktheme",1),console.debug("%csettings.js %c> %cChanging to dark theme","color:#ff4576","color:#fff","color:#ff9eb8")):(meta.setAttribute("content","light"),root.classList.add("light-theme"),localStorage.setItem("darktheme",0),console.debug("%csettings.js %c> %cChanging to light theme","color:#ff4576","color:#fff","color:#ff9eb8"))}checkTheme();</script>
        <script src="scripts/overlayscrollbars.browser.es6.min.js" defer></script>
        <script src="scripts/overlayscrollbar.js" defer></script>    
        
        <script type="module" src="scripts/settings.js" defer></script>
    </head>
    <body id="top" data-overlayscrollbars-initialize>
        <div class="navbar-container">
            <div class="nav-bar">
                <a href="../../index.html" class="nav-bar-title no-color-link no-underline-link">
                    <img src="assets/brand/UMKLlogonav.webp" class="nav-bar-logo" alt="UMKL logo">
                    <h2>UMKL</h2>
                </a>
                <nav class="nav-flex">
                    <ul>
                        <li><a href="../../index.html">Home</a></li>
                        <li><a href="../../pages/teams/">Teams</a></li>
                        <li><a href="../../pages/matches/">Matches</a></li>
                        <li><a href="../../pages/faq/">FAQs</a></li>
                        <li><a class="nav-bar-link" target="_blank" href="https://discord.gg/6jS7YUqnbh">Discord</a></li>
                    </ul>
                </nav>
            </div>
        </div>

        <main>
            <h2>News</h2>
            <p class="p-below-title">View past UMKL news</p>
            <hr class="hr-below-title">

            <div id="news-container" class="news-container after-title news-container-override">                
                {NEWSCONTAINER}
            </div>
        </main>

        <footer>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            © UMKL 2025 |
            <a class="no-color-link" href="pages/credits/">Credits</a> |
            <a class="fa fa-gear no-color-link settingsBoxOpener"></a> |
            <a href="https://www.youtube.com/@universitymariokartleague" title="UMKL YouTube Channel" class="no-color-link no-underline-link fa fa-youtube-play"></a>
            <a href="https://www.instagram.com/universitymariokartleague" title="UMKL Instagram Account" class="no-color-link no-underline-link fa fa-instagram"></a>
            <a href="https://www.facebook.com/profile.php?id=61575273336011" title="UMKL Facebook Page" class="no-color-link no-underline-link fa fa-facebook"></a>
            
        </footer>
    </body>
</html>
"""

def main():
    print("What page would you like to create?")
    print("1 | Uni team page")
    print("2 | Blog page")
    selection = int(input("Selection > "))
    match selection:
        case 1:
            create_team_page()
        case 2:
            create_blog()
        case _:
            print("Invalid selection")
            
def create_team_page():
    print("ーーーーーーーーーー")
    print("Generating uni team page")
    team_name = input("Enter team name > ")
    team_name_file_path = team_name.lower().replace(" ", "-")
    os.makedirs(f"pages/teams/{team_name_file_path}", exist_ok=True)
    with open(f"pages/teams/{team_name_file_path}/index.html", "a+") as f:
        f.write(TEAM_PAGE.replace("{TEAMNAME}", team_name))

def create_blog():
    read_current_blogs()

def create_slug(title):
    """Generate a URL-friendly slug from the title"""
    slug = title.lower().replace(" ", "-")
    slug = re.sub(r'[^\w-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

def read_current_blogs():
    title = input("Enter blog title > ")
    desc = input("Enter blog description > ")
    image = input("Enter blog image link > ")
    date = input("Enter blog date (dd/mm/yyyy) > ")

    link = create_slug(title)
    url_date = "-".join(reversed(date.split("/")))

    new_blog = f"""
                <div class="news-box">
                    <article class="news-text">
                        <a href="pages/news/{url_date}/{link}/" class="ref" target="_blank"><span class="news-title">{title}</span></a><br>
                        <span class="news-desc">{desc}</span>
                    </article>
                    <div class="news-image"><img loading="lazy" src="{image}"></div>
                    <span class="news-date">{date}</span>
                </div>
    """

    # news page
    soup = BeautifulSoup(
        open(f"pages/news/index.html", "r", encoding='utf-8'), 
        'html.parser', 
        preserve_whitespace_tags={'html'}
    )
    
    news_container = soup.find('div', id='news-container')
    news_container.insert(0, BeautifulSoup(new_blog, 'html.parser'))
    
    new_container_soup = BeautifulSoup(str(news_container), 'html.parser')

    # Find and replace the container
    old_container = soup.find('div', id='news-container')
    new_container = new_container_soup.find('div', id='news-container')

    if old_container and new_container:
        old_container.replace_with(new_container)

    os.makedirs(f"pages/news/{url_date}/{link}", exist_ok=True)
    # with open(f"pages/teams/{url_date}/{link}/index.html", "a+") as f:
    #     f.write(NEWS_PAGE.replace("{NEWSCONTAINER}", news_container))

    with open("pages/news/index.html", "w", encoding='utf-8') as f:
        f.write(soup.prettify())

    # home page
    soup = BeautifulSoup(
        open(f"index.html", "r", encoding='utf-8'), 
        'html.parser', 
        preserve_whitespace_tags={'html'}
    )
    
    news_container = soup.find('div', id='news-container')
    news_container.insert(0, BeautifulSoup(new_blog, 'html.parser'))
    
    new_container_soup = BeautifulSoup(str(news_container), 'html.parser')

    # Find and replace the container
    old_container = soup.find('div', id='news-container')
    new_container = new_container_soup.find('div', id='news-container')

    if old_container and new_container:
        old_container.replace_with(new_container)

    with open("index.html", "w", encoding='utf-8') as f:
        f.write(soup.prettify())

if __name__ == "__main__":
    main()