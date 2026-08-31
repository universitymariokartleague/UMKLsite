# Please use .runbeforecommit.py instead
#
# This script generates new blog pages from a template for the UMKL site

import datetime
import json
import os
import re

BLANK_NEWS_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{TITLE} | UMKL</title>
    <meta name="description" content="{DESC}">
    <link rel="icon" href="/assets/media/brand/favicon.png" type="image/png">
    <link rel="stylesheet" href="/assets/css/base/style.css">
    <link rel="stylesheet" href="/assets/css/base/settings.css">
    <link rel="stylesheet" href="/assets/css/pages/newsarticle.css">
    <link rel="stylesheet" href="/assets/css/ext/fontawesome.min.css">
    <link rel="modulepreload" href="/assets/components/navbar.js">
    <link rel="modulepreload" href="/assets/components/footer.js">
    <meta name="color-scheme" content="dark light">

    <meta property="og:title" content="{TITLE} | UMKL" />
    <meta property="og:site_name" content="umkl.co.uk" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://umkl.co.uk/{LINK}" />
    <meta property="og:image" content="https://umkl.co.uk/{IMAGE}" />
    <meta property="og:description" content="{DESC}" />
    <meta content="#bc0839" name="theme-color" />
    <meta content="https://umkl.co.uk/assets/media/brand/favicon.png" property="og:logo" />

    <!-- Include this to make the og:image larger -->
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Components -->
    <script type="module" src="/assets/components/navbar.js" defer></script>
    <script type="module" src="/assets/components/footer.js" defer></script>

    <!-- Scripts -->
    <script>const meta=document.querySelector('meta[name="color-scheme"]'),root=document.querySelector(":root");let darkThemeEnabled;function checkTheme(){let e=parseInt(localStorage.getItem("darktheme"));isNaN(e)&&(e=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?1:0),1===e?(meta.setAttribute("content","dark"),root.classList.add("dark-theme"),console.debug("%csettings.js %c> %cSetting dark theme","color:#ff4576","color:#fff","color:#ff9eb8")):(meta.setAttribute("content","light"),root.classList.add("light-theme"),console.debug("%csettings.js %c> %cSetting light theme","color:#ff4576","color:#fff","color:#ff9eb8"))}checkTheme();</script>
    <script type="module" src="/assets/scripts/settings.js" defer></script>
</head>
<body id="top">
    <umkl-navbar></umkl-navbar>

    <main class="article-main">
        <div class="bubble-link-wrapper">
            <a href="/news/" class="bubble-link no-color-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" role="presentation">
                    <path fill="currentColor" d="M22 13H4.94l5.18 5.29-1.38 1.42-6.17-6.3a2 2 0 0 1 0-2.82l6.17-6.3 1.38 1.42L4.94 11H22z"></path>
                </svg>
                Back</a>
        </div>
        <h1>{TITLE}</h1>
        <div class="article-meta">
            <span class="article-date">{DATE}</span>
            {TAGS}
        </div>
        <p class="news-credits">Written by {AUTHOR1}, {AUTHOR2}.<br>Edited by {EDITOR}</p>
        <hr class="hr-below-title">

        <p>{DESC}</p>
    </main>

    <umkl-footer></umkl-footer>
</body>
</html>
"""

NEWS_JSON_PATH = "news/news.json"


def main():
    create_new_blog()


def create_slug(title):
    """Generate a URL-friendly slug from the title"""
    slug = title.lower().replace(" ", "-")
    slug = re.sub(r"[^\w-]", "", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def update_news_json(entry):
    """
    Adds a news entry to news/news.json (creating the file if it doesn't
    exist yet) and keeps the list sorted newest-first.
    """
    if os.path.exists(NEWS_JSON_PATH):
        with open(NEWS_JSON_PATH, encoding="utf-8") as f:
            news = json.load(f)
    else:
        news = []

    news = [item for item in news if item["link"] != entry["link"]]
    news.append(entry)
    news.sort(key=lambda item: item["date"], reverse=True)

    with open(NEWS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(news, f, indent=4)
        f.write("\n")


def create_new_blog():
    """
    Creates a new blog entry and updates the website's news data.
    This function prompts the user for blog details such as title, description,
    image link, and date. It adds a new entry to news/news.json (which the
    homepage and news page render their previews from) and creates a
    dedicated page for the new blog entry.

    Raises:
        Exception: If there are issues reading or writing news/news.json.

    Inputs:
        - Blog title (str): The title of the blog.
        - Blog description (str): A short description of the blog.
        - Blog image link (str): A URL to the blog's image.
        - Blog alt text (str): Alt text for the blog's image.
        - Blog date (str): The date of the blog in `dd/mm/yyyy` format.
        - Tags (str): Comma-separated tags for the blog.

    Outputs:
        - Adds an entry to `news/news.json`.
        - Creates a new HTML file for the blog entry in the appropriate directory.
    """
    title = input("Enter blog title > ")
    description = input("Enter blog description > ")
    image = input("Enter blog image link > ")
    alt = input("Enter an alt description for the image > ")
    date = input(
        "Enter blog date (DD/MM/YYYY) (leave blank to use the current date) > "
    ).strip()
    if not date:
        date = datetime.date.today().strftime("%d/%m/%Y")
    tags_input = input("Enter tags (comma separated) > ")
    tags = [tag.strip() for tag in tags_input.split(",") if tag.strip()]

    link = create_slug(title)
    url_date = "-".join(reversed(date.split("/")))

    if not image.startswith(("http://", "https://", "/")):
        image = f"/{image}"

    update_news_json(
        {
            "title": title,
            "link": f"/news/{url_date}/{link}/",
            "date": url_date,
            "image": image,
            "alt": alt,
            "description": description,
            "tags": tags,
        }
    )

    print("news/news.json updated")

    os.makedirs(f"news/{url_date}/{link}", exist_ok=True)
    with open(f"news/{url_date}/{link}/index.html", "a+", encoding="utf-8") as f:
        tags_html = "".join(f'<tag translate="no">{tag}</tag>' for tag in tags)
        content = (
            BLANK_NEWS_PAGE.replace("{TITLE}", title)
            .replace("{DESC}", description)
            .replace("{IMAGE}", image)
            .replace("{DATE}", date)
            .replace("{TAGS}", tags_html)
            .replace("{LINK}", f"news/{url_date}/{link}")
        )
        f.write(content)

    print(f"news/{url_date}/{link}/index.html page has been created")


if __name__ == "__main__":
    main()
