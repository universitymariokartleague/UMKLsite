import datetime, re, os, mimetypes
import xml.etree.ElementTree as ET
import xml.dom.minidom
from bs4 import BeautifulSoup

NEWS_INDEX = "pages/news/index.html"
SITE_URL = "https://umkl.co.uk/"
FEED_TITLE = "UMKL News"
FEED_LINK = "https://umkl.co.uk/pages/news/"
FEED_DESCRIPTION = "The latest news from the UMKL"

def extract_main_html(main_tag: BeautifulSoup, base_url: str) -> str:
    """Generate an RSS description"""
    hr = main_tag.find("hr", class_="hr-below-title")
    if not hr:
        return ""

    # Grab everything after the <hr>
    content_after_hr = []
    sibling = hr.find_next_sibling()
    while sibling:
        next_sibling = sibling.find_next_sibling()
        content_after_hr.append(sibling.extract())
        sibling = next_sibling

    # Wrap in div
    wrapper = BeautifulSoup("<div></div>", "html.parser").div
    for elem in content_after_hr:
        wrapper.append(elem)

    # Fix relative links
    for a in wrapper.find_all("a", href=True):
        href = a["href"]
        if not href.startswith(("http://", "https://")):
            a["href"] = base_url + href.lstrip("/")

    for img in wrapper.find_all("img", src=True):
        src = img["src"]
        if not src.startswith(("http://", "https://")):
            img["src"] = base_url + src.lstrip("/")

    # Keep only href/src attributes, remove others
    for tag in wrapper.find_all(True):
        tag.attrs = {k: v for k, v in tag.attrs.items() if k in ("href", "src")}

    html_str = wrapper.encode_contents(formatter="html").decode("utf-8")
    html_str = html_str.replace("</img>", "")

    return f"<div>{html_str}</div>"

def get_news_items():
    items = []
    with open(NEWS_INDEX, encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    container = soup.find("div", {"class": "news-container after-title news-container-full-page", "id": "news-container"})
    if not container:
        return items

    for box in container.find_all("div", class_="news-box"):
        # Title and link
        article = box.find("article", class_="news-text")
        a_tag = article.find("a", href=True) if article else None
        title_tag = a_tag.find("span", class_="news-title") if a_tag else None
        desc_tag = article.find("span", class_="news-desc") if article else None

        # Find image in sibling .news-image div (not inside article)
        image = ""
        img_div = box.find("div", class_="news-image")
        if img_div:
            img = img_div.find("img", src=True)
            if img:
                src = img["src"]
                if src.startswith("http://") or src.startswith("https://"):
                    image = src
                else:
                    image = "https://umkl.co.uk/" + src.lstrip("/")

        def clean_text(text):
            # Remove newlines and collapse multiple spaces to one
            return re.sub(r'\s+', ' ', text).strip()

        title = clean_text(title_tag.get_text()) if title_tag else "No Title"
        link = SITE_URL + a_tag["href"].lstrip("/") if a_tag else SITE_URL
        description = ""

        if a_tag and a_tag["href"]:
            try:
                # Resolve local file path
                relative_path = a_tag["href"].lstrip("/")  # e.g. "pages/news/2025-07-17/some-article/"
                local_path = os.path.join(relative_path, "index.html")  # e.g. "pages/news/2025-07-17/some-article/index.html"

                with open(local_path, encoding="utf-8") as f:
                    news_html = f.read()

                news_soup = BeautifulSoup(news_html, "html.parser")

                for span in news_soup.find_all("span", class_="settings-extra-info"):
                    new_i = news_soup.new_tag("i")
                    new_i.string = span.get_text()
                    span.replace_with(new_i)

                main_tag = news_soup.find("main")

                if main_tag:
                    description = extract_main_html(main_tag, SITE_URL)
            except Exception as e:
                print(f"Failed to open or parse {local_path}: {e}")

        # Date
        date_tag = box.find("span", class_="news-date")
        pubdate_str = ""
        if date_tag:
            # Extract the date in format DD/MM/YYYY
            date_text = date_tag.get_text(strip=True)
            # The date is at the start, before any tags
            m = re.match(r"(\d{2}/\d{2}/\d{4})", date_text)
            if m:
                pubdate_str = m.group(1)
        try:
            pubdate = datetime.datetime.strptime(pubdate_str, "%d/%m/%Y").replace(tzinfo=datetime.timezone.utc)
        except Exception:
            pubdate = datetime.datetime.now(datetime.timezone.utc)

        items.append({
            "title": title,
            "link": link,
            "description": description,
            "image": image,
            "pubDate": pubdate.strftime("%a, %d %b %Y %H:%M:%S +0000")
        })

    # items.sort(key=lambda x: x["pubDate"], reverse=True)
    return items

def build_rss(items):
    rss = ET.Element("rss", version="2.0", attrib={"xmlns:media": "http://search.yahoo.com/mrss/"})
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = FEED_TITLE
    ET.SubElement(channel, "link").text = FEED_LINK
    ET.SubElement(channel, "description").text = FEED_DESCRIPTION
    ET.SubElement(channel, "language").text = "en-gb"
    ET.SubElement(channel, "lastBuildDate").text = datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")
    image = ET.SubElement(channel, "image")
    ET.SubElement(image, "title").text = FEED_TITLE
    ET.SubElement(image, "url").text = "assets/media/brand/favicon.png"
    ET.SubElement(image, "link").text = "https://umkl.co.uk/"

    for item in items:
        item_elem = ET.SubElement(channel, "item")
        ET.SubElement(item_elem, "title").text = item["title"]
        ET.SubElement(item_elem, "link").text = item["link"]
        mime_type, _ = mimetypes.guess_type(item["image"])
        if item["image"]:
            media = ET.SubElement(
                item_elem,
                "media:content",
                {
                    "url": item["image"],
                    "type": mime_type or "image/webp",
                    "medium": "image"
                }
            )
            media.text = " "
        ET.SubElement(item_elem, "description").text = f'<![CDATA[ {item["description"]} ]]>'
        ET.SubElement(item_elem, "pubDate").text = item["pubDate"]

    rough_string = ET.tostring(rss, encoding="utf-8", xml_declaration=True)
    reparsed = xml.dom.minidom.parseString(rough_string)
    return reparsed.toprettyxml(encoding="utf-8")

def generate_rss_feed():
    news_items = get_news_items()
    rss_xml = build_rss(news_items)
    with open("news.xml", "wb") as f:
        f.write(rss_xml)
    print("RSS feed generated as news.xml")

generate_rss_feed()