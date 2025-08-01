import datetime, re
import xml.etree.ElementTree as ET
import xml.dom.minidom
from bs4 import BeautifulSoup

NEWS_INDEX = "pages/news/index.html"
SITE_URL = "https://umkl.co.uk/"
FEED_TITLE = "UMKL News"
FEED_LINK = "https://umkl.co.uk/pages/news/"
FEED_DESCRIPTION = "The latest news from the UMKL"

def get_news_items():
    items = []
    with open(NEWS_INDEX, encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    container = soup.find("div", {"class": "news-container after-title news-container-override", "id": "news-container"})
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
        description = clean_text(desc_tag.get_text()) if desc_tag else ""

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

    items.sort(key=lambda x: x["pubDate"], reverse=True)
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
    ET.SubElement(image, "url").text = "https://umkl.co.uk/assets/media/brand/favicon.png"
    ET.SubElement(image, "link").text = "https://umkl.co.uk/"

    for item in items:
        item_elem = ET.SubElement(channel, "item")
        ET.SubElement(item_elem, "title").text = item["title"]
        ET.SubElement(item_elem, "link").text = item["link"]
        if item["image"]:
            media = ET.SubElement(
                item_elem,
                "media:content",
                {
                    "url": item["image"],
                    "type": "image/webp",
                    "medium": "image"
                }
            )
            media.text = " "
        ET.SubElement(item_elem, "description").text = item["description"]
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