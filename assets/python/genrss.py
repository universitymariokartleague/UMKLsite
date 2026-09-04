# Please use .runbeforecommit.py instead
#
# This script generates the RSS feed based on news.json

import datetime
import json
import mimetypes
import os
import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from lxml import etree as ET

NEWS_INDEX = "news/news.json"

SITE_URL = "https://umkl.co.uk/"
FEED_TITLE = "UMKL News"
FEED_LINK = "https://umkl.co.uk/news/"
FEED_DESCRIPTION = "The latest news from the UMKL"


def extract_article_html(article_body: BeautifulSoup, base_url: str) -> str:
    """Extract the article body and convert relative URLs to absolute URLs."""

    # Convert relative links to absolute URLs.
    for a in article_body.find_all("a", href=True):
        a["href"] = urljoin(base_url, a["href"])

    # Convert relative images to absolute URLs.
    for img in article_body.find_all("img", src=True):
        img["src"] = urljoin(base_url, img["src"])

    # Convert relative iframe sources to absolute URLs.
    for iframe in article_body.find_all("iframe", src=True):
        iframe["src"] = urljoin(base_url, iframe["src"])

    allowed_attributes = {
        "href",
        "src",
        "width",
        "height",
        "alt",
        "title",
    }

    for tag in article_body.find_all(True):
        tag.attrs = {
            key: value for key, value in tag.attrs.items() if key in allowed_attributes
        }

    return article_body.encode_contents(formatter="html").decode("utf-8")


def get_article_description(article_link: str) -> str:
    """Load an article's index.html and extract .article-body."""

    relative_path = article_link.lstrip("/")
    local_path = os.path.join(relative_path, "index.html")
    article_url = urljoin(SITE_URL, relative_path)

    try:
        with open(local_path, encoding="utf-8") as f:
            news_html = f.read()

        news_soup = BeautifulSoup(news_html, "html.parser")

        # Find the new article body.
        article_body = news_soup.select_one(".article-body")

        if not article_body:
            print(f"No .article-body found in {local_path}")
            return ""

        article_body_string = " ".join(
            re.split("\\s+", str(article_body).replace("\n", ""), flags=re.UNICODE)
        )

        article_body = BeautifulSoup(
            article_body_string,
            "html.parser",
        ).select_one(".article-body")

        if not article_body:
            return ""

        return extract_article_html(
            article_body,
            article_url,
        )

    except Exception as e:
        print(f"Failed to open or parse {local_path}: {e}")
        return ""


def get_news_items():
    """Load news metadata from news.json and article content from HTML."""

    with open(NEWS_INDEX, encoding="utf-8") as f:
        news = json.load(f)

    items = []

    for article in news:
        title = article.get("title", "No Title")
        article_link = article.get("link", "")
        date = article.get("date", "")
        image = article.get("image", "")

        # Convert relative URLs to absolute URLs.
        link = urljoin(SITE_URL, article_link) if article_link else ""

        image = urljoin(SITE_URL, image) if image else ""

        # The JSON description is only used as a fallback.
        description = article.get("description", "")

        # Extract the actual article body from index.html.
        if article_link:
            html_description = get_article_description(article_link)

            if html_description:
                description = html_description

        # Convert YYYY-MM-DD into RFC 822 format.
        try:
            pubdate = datetime.datetime.strptime(
                date,
                "%Y-%m-%d",
            ).replace(
                tzinfo=datetime.timezone.utc,
            )

            pubdate = pubdate.strftime("%a, %d %b %Y %H:%M:%S +0000")

        except ValueError:
            pubdate = datetime.datetime.now(
                datetime.timezone.utc,
            ).strftime("%a, %d %b %Y %H:%M:%S +0000")

        items.append(
            {
                "title": title,
                "link": link,
                "description": description,
                "image": image,
                "pubDate": pubdate,
            }
        )

    return items


def build_rss(items):
    """Build the RSS XML document."""

    NSMAP = {
        "media": "http://search.yahoo.com/mrss/",
    }

    rss = ET.Element(
        "rss",
        version="2.0",
        nsmap=NSMAP,
    )

    channel = ET.SubElement(
        rss,
        "channel",
    )

    ET.SubElement(
        channel,
        "title",
    ).text = FEED_TITLE

    ET.SubElement(
        channel,
        "link",
    ).text = FEED_LINK

    ET.SubElement(
        channel,
        "description",
    ).text = FEED_DESCRIPTION

    ET.SubElement(
        channel,
        "language",
    ).text = "en-gb"

    ET.SubElement(
        channel,
        "lastBuildDate",
    ).text = datetime.datetime.now(
        datetime.timezone.utc,
    ).strftime("%a, %d %b %Y %H:%M:%S +0000")

    # RSS channel image.
    channel_image = ET.SubElement(
        channel,
        "image",
    )

    ET.SubElement(
        channel_image,
        "title",
    ).text = FEED_TITLE

    ET.SubElement(
        channel_image,
        "url",
    ).text = "https://umkl.co.uk/assets/media/brand/favicon.png"

    ET.SubElement(
        channel_image,
        "link",
    ).text = SITE_URL

    # Articles.
    for item in items:
        item_elem = ET.SubElement(
            channel,
            "item",
        )

        ET.SubElement(
            item_elem,
            "title",
        ).text = item["title"]

        ET.SubElement(
            item_elem,
            "link",
        ).text = item["link"]

        # Article image.
        if item.get("image"):
            mime_type, _ = mimetypes.guess_type(
                item["image"],
            )

            ET.SubElement(
                item_elem,
                ET.QName(
                    NSMAP["media"],
                    "content",
                ),
                url=item["image"],
                type=mime_type or "image/avif",
                medium="image",
            )

        # Full article body.
        description = ET.SubElement(
            item_elem,
            "description",
        )

        description.text = ET.CDATA(
            item["description"],
        )

        ET.SubElement(
            item_elem,
            "pubDate",
        ).text = item["pubDate"]

    return ET.tostring(
        rss,
        encoding="utf-8",
        xml_declaration=True,
        pretty_print=True,
    )


def generate_rss_feed():
    """Generate news/feed.xml from news/news.json."""

    news_items = get_news_items()

    rss_xml = build_rss(
        news_items,
    )

    with open(
        "news/feed.xml",
        "wb",
    ) as f:
        f.write(rss_xml)

    print(f"Generated RSS feed with {len(news_items)} articles.")


if __name__ == "__main__":
    generate_rss_feed()
