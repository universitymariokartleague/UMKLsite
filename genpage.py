import os, re
from bs4 import BeautifulSoup

BLANK_NEWS_PAGE = """<!DOCTYPE html>
<html lang="en" data-overlayscrollbars-initialize>
    <head>
        <base href="../../../../">
    
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <title>{TITLE} | University Mario Kart League</title>
        <meta name="description" content="{TITLE} news article on University Mario Kart League (UMKL)">
        <link rel="icon" href="assets/media/brand/favicon.png" type="image/png">
        <link rel="stylesheet" href="css/style.css">
        <link rel="stylesheet" href="css/settings.css">
        <link rel="stylesheet" href="css/ext/overlayscrollbars.min.css">
        <link rel="stylesheet" href="css/ext/fontawesome.min.css">
        <meta name="color-scheme" content="dark light">
    
        <meta property="og:title" content="University Mario Kart League | {TITLE} - News" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://umkl.co.uk/{LINK}" />
        <meta property="og:image" content="https://umkl.co.uk/{IMAGE}" />
        <meta property="og:description" content="{TITLE} news article on University Mario Kart League (UMKL)" />
        <meta name="theme-color" content="#bc0839" />
    
        <!-- Include this to make the og:image larger -->
        <meta name="twitter:card" content="summary_large_image" />
    
        <!-- Scripts -->
        <script>const meta=document.querySelector('meta[name="color-scheme"]'),root=document.querySelector(":root");let darkThemeEnabled;function checkTheme(){let e=parseInt(localStorage.getItem("darktheme"));isNaN(e)&&(e=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?1:0),1===e?(meta.setAttribute("content","dark"),root.classList.add("dark-theme"),console.debug("%csettings.js %c> %cSetting dark theme","color:#ff4576","color:#fff","color:#ff9eb8")):(meta.setAttribute("content","light"),root.classList.add("light-theme"),console.debug("%csettings.js %c> %cSetting light theme","color:#ff4576","color:#fff","color:#ff9eb8"))}checkTheme();</script>
        <script defer src="scripts/overlayscrollbars.browser.es6.min.js"></script>
        <script src="scripts/overlayscrollbar.js" defer></script>    
        
        <script type="module" src="scripts/settings.js" defer></script>
    </head>
    <body id="top" data-overlayscrollbars-initialize>
        <div class="navbar-container" translate="no">
            <div class="nav-bar">
                <a href="index.html" class="nav-bar-title no-color-link no-underline-link-footer">
                    <img src="assets/media/brand/UMKLlogonav.avif" class="nav-bar-logo" alt="UMKL logo">
                    <h2>UMKL</h2>
                </a>
                <nav class="nav-flex">
                    <ul id="nav-bar">
                        <li><a href="index.html">Home</a></li>
                        <li><a class="nav-selected" href="pages/news/">News</a></li>
                        <li><a href="pages/teams/">Teams</a></li>
                        <li><a href="pages/matches/">Matches</a></li>
                        <li><a href="pages/rules/">Rules</a></li>
                        <li><a href="pages/faq/">FAQs</a></li>
                        <li><a target="_blank" class="nav-bar-link" href="https://discord.gg/jz3hKEmDss">Discord</a></li>
                    </ul>
                </nav>
                <!-- Dropdown navigation (shown on mobile) -->
                <div class="nav-dropdown">
                    <div class="nav-dropdown-button">☰</div>
                    <div class="nav-dropdown-content" id="nav-dropdown-bar">
                        <a href="index.html">Home</a>
                        <a href="pages/news/">News</a>
                        <a href="pages/teams/">Teams</a>
                        <a href="pages/matches/">Matches</a>
                        <a href="pages/rules/">Rules</a>
                        <a href="pages/faq/">FAQs</a>
                        <a target="_blank" class="nav-bar-link" href="https://discord.gg/jz3hKEmDss">Discord</a>
                    </div>
                </div>            
            </div>
        </div>

        <main>
            <a href="pages/news/">Back</a>
            <h1>{TITLE}</h1>
            <div class="p-below-title">
                {DATE} | 
                <tag translate="no">Intro</tag>
                <div class="news-credits">Written by {AUTHOR1}, {AUTHOR2}.<br>Edited by {EDITOR}</div>
            </div>
            <hr class="hr-below-title">

            <p>{DESC}</p>
        </main>

        <footer translate="no">
            © UMKL 2025 |
            <a class="no-color-link" href="pages/credits/">Credits</a> |
            <a class="fa fa-gear no-color-link settingsBoxOpener"></a> |
            <a href="https://www.youtube.com/@universitymariokartleague" title="UMKL YouTube Channel" class="no-color-link no-underline-link-footer fa-brands fa-youtube"></a>
            <a href="https://www.instagram.com/universitymariokartleague" title="UMKL Instagram Account" class="no-color-link no-underline-link-footer fa-brands fa-instagram"></a>
            <a href="https://www.facebook.com/profile.php?id=61575273336011" title="UMKL Facebook Page" class="no-color-link no-underline-link-footer fa-brands fa-facebook"></a>            
            <a href="https://discord.gg/jz3hKEmDss" title="UMKL Discord server" class="no-color-link no-underline-link-footer fa-brands fa-discord"></a>            
        </footer>
    </body>
</html>
"""

def main():
    """
    Main function to prompt the user for page creation options and execute the corresponding action.

    Prompts:
        - Asks the user to select the type of page to create.
        - Options:
            1. Create a blog page.
    """
    print("What page would you like to create?")
    print("1 | Blog page")
    selection = int(input("Selection > "))
    match selection:
        case 1:
            create_new_blog()
        case _:
            print("Invalid selection")

def create_slug(title):
    """Generate a URL-friendly slug from the title"""
    slug = title.lower().replace(" ", "-")
    slug = re.sub(r'[^\w-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

def create_new_blog():
    """
    Creates a new blog entry and updates the website's news and home pages.
    This function prompts the user for blog details such as title, description, 
    image link, and date. It generates a new blog entry, updates the news 
    container on both the news page and the home page, and creates a dedicated 
    page for the new blog entry.

    Raises:
        FileNotFoundError: If the required HTML files (`index.html` or `pages/news/index.html`) 
                           are not found.
        Exception: If there are issues with parsing or modifying the HTML files.
    
    Inputs:
        - Blog title (str): The title of the blog.
        - Blog description (str): A short description of the blog.
        - Blog image link (str): A URL to the blog's image.
        - Blog date (str): The date of the blog in `dd/mm/yyyy` format.
    
    Outputs:
        - Updates the `pages/news/index.html` file with the new blog entry.
        - Updates the `index.html` file (home page) with the new blog entry.
        - Creates a new HTML file for the blog entry in the appropriate directory.
    """
    title = input("Enter blog title > ")
    description = input("Enter blog description > ")
    image = input("Enter blog image link > ")
    alt = input("Enter an alt description for the image > ")
    date = input("Enter blog date (DD/MM/YYYY) > ")

    link = create_slug(title)
    url_date = "-".join(reversed(date.split("/")))

    new_blog = f"""
                <div class="news-box">
                    <article class="news-text">
                        <a href="pages/news/{url_date}/{link}/"><span class="news-title">{title}</span></a><br>
                        <span class="news-desc">{description}</span>
                    </article>
                    <div class="news-image"><img onload="this.style.opacity=1" loading="lazy" src="{image}" alt="{alt}"></div>
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

    print("News articles added to front page and sites/news/")

    os.makedirs(f"pages/news/{url_date}/{link}", exist_ok=True)
    with open(f"pages/news/{url_date}/{link}/index.html", "a+", encoding='utf-8') as f:
        content = BLANK_NEWS_PAGE.replace("{TITLE}", title).replace("{DESC}", description).replace("{IMAGE}", image).replace("{DATE}", date).replace("{LINK}", f"pages/news/{url_date}/{link}")
        f.write(content)

    print(f"pages/news/{url_date}/{link}/index.html page has been created")

if __name__ == "__main__":
    main()