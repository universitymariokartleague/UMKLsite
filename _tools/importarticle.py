# Please use .runbeforecommit.py instead
#
# This script imports a news article package (.zip) exported by the
# Article Builder tool (tools/articlebuilder/) and wires it into the site.

import base64
import binascii
import json
import os
import platform
import re
import subprocess
import sys
import zipfile

NEWS_JSON_PATH = "news/news.json"
DATA_URL_PATTERN = re.compile(r"data:([\w/+.-]*);base64,([A-Za-z0-9+/=]+)")
IMAGE_EXTENSIONS = {
    "image/avif": "avif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
}


def main():
    if len(sys.argv) > 1:
        zip_path = sys.argv[1]
    else:
        zip_path = pick_file()
        if not zip_path:
            zip_path = (
                input(
                    "Enter the path to the article .umklpost exported from the Article Builder > "
                )
                .strip()
                .strip('"')
            )

    import_article_zip(zip_path)


def pick_file() -> str | None:
    """
    Opens a native file-picker dialog to choose the exported .umklpost, using
    whatever is available on the system: zenity or kdialog on Linux, or
    tkinter as a cross-platform fallback. Returns None if the user
    cancelled or no file-picker could be opened.
    """
    if platform.system() == "Linux":
        try:
            result = subprocess.run(
                [
                    "zenity",
                    "--file-selection",
                    "--title=Select the Article Builder export (.umklpost)",
                    "--file-filter=umklpost files | *.umklpost",
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
            )
            return result.stdout.strip() or None
        except FileNotFoundError:
            pass
        try:
            result = subprocess.run(
                ["kdialog", "--getopenfilename", ".", "*.umklpost|umklpost files"],
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
            )
            return result.stdout.strip() or None
        except FileNotFoundError:
            pass

    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        path = filedialog.askopenfilename(
            title="Select the Article Builder export (.umklpost)",
            filetypes=[("umklpost files", "*.umklpost"), ("All files", "*.*")],
        )
        root.destroy()
        return path or None
    except Exception:
        return None


def sniff_image_extension(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG"):
        return "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"GIF8"):
        return "gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[4:8] == b"ftyp" and data[8:12] in (b"avif", b"avis"):
        return "avif"
    return None


def externalize_data_images(article_dir, entry, taken_names):
    """
    Writes any base64 images still inlined in the article's index.html out
    to image files next to it and points the HTML (and news entry) at them.
    Returns how many images were converted.

    The Article Builder can leave images inline as data:application/octet-stream
    URLs, so the real type is worked out from the file's magic bytes.
    """
    index_path = os.path.join(article_dir, "index.html")
    if not os.path.isfile(index_path):
        return 0

    with open(index_path, encoding="utf-8") as f:
        html = f.read()

    url_prefix = f"/{article_dir}/"
    saved = {}
    next_image_number = 1

    def save(match):
        nonlocal next_image_number
        data_url = match.group(0)
        if data_url in saved:
            return saved[data_url]

        try:
            data = base64.b64decode(match.group(2), validate=True)
        except binascii.Error:
            return data_url

        extension = IMAGE_EXTENSIONS.get(match.group(1)) or sniff_image_extension(data)
        if not extension:
            print(
                f"Warning: left an inline image in {index_path} as-is (unrecognised format)"
            )
            return data_url

        if data_url == entry.get("image"):
            name = f"main-image.{extension}"
        else:
            while any(n.startswith(f"image-{next_image_number}.") for n in taken_names):
                next_image_number += 1
            name = f"image-{next_image_number}.{extension}"

        taken_names.add(name)
        with open(os.path.join(article_dir, name), "wb") as f:
            f.write(data)

        saved[data_url] = url_prefix + name
        return saved[data_url]

    main_match = DATA_URL_PATTERN.fullmatch(entry.get("image", ""))
    if main_match:
        entry["image"] = save(main_match)

    new_html = DATA_URL_PATTERN.sub(save, html)

    if saved:
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_html)

    return len(saved)


def update_rss_feed():
    try:
        import genrss
    except ImportError as e:
        print(
            f"Couldn't update the RSS feed ({e}); run _tools/genrss.py once its dependencies are installed."
        )
        return
    genrss.generate_rss_feed()


def update_news_json(entry):
    """
    Adds a news entry to news/news.json (creating the file if it doesn't
    exist yet) and keeps the list sorted newest-first. An article with the
    same date as existing ones is placed above them, as the most recent import.
    """
    if os.path.exists(NEWS_JSON_PATH):
        with open(NEWS_JSON_PATH, encoding="utf-8") as f:
            news = json.load(f)
    else:
        news = []

    news = [item for item in news if item["link"] != entry["link"]]
    # the new entry is inserted first
    news.insert(0, entry)
    news.sort(key=lambda item: item["date"], reverse=True)

    with open(NEWS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(news, f, indent=4)
        f.write("\n")


def import_article_zip(zip_path):
    """
    Extracts an article package exported by the Article Builder and adds
    it to the site: the article's own files are extracted into
    news/<date>/<folder>/, and its news_entry.json is merged into
    news/news.json (which the homepage and news page render their
    previews from).

    The zip is expected to contain exactly what the Article Builder's
    "Save" button produces:
        news/<date>/<folder>/index.html
        news/<date>/<folder>/main-image.<ext>   (optional)
        news/<date>/<folder>/image-N.<ext>      (optional, one per body image)
        news_entry.json

    Raises:
        FileNotFoundError: If the umklpost doesn't exist.
        ValueError: If the umklpost doesn't look like an Article Builder export.
    """
    if not os.path.isfile(zip_path):
        raise FileNotFoundError(f"No such file: {zip_path}")

    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        if "news_entry.json" not in names:
            raise ValueError(
                "This doesn't look like an Article Builder export "
                "(missing news_entry.json)."
            )

        entry = json.loads(zf.read("news_entry.json"))

        article_files = [
            name
            for name in names
            if name.startswith("news/") and not name.endswith("/")
        ]
        if not article_files:
            raise ValueError("No article files found under news/ in this umklpost.")

        article_dir = os.path.dirname(article_files[0])
        if os.path.isdir(article_dir):
            print(f"Note: {article_dir}/ already exists and will be overwritten.")

        for name in article_files:
            zf.extract(name, ".")

    taken_names = {os.path.basename(name) for name in article_files}
    converted = externalize_data_images(article_dir, entry, taken_names)

    update_news_json(entry)

    print(f"Extracted {len(article_files)} file(s) to {article_dir}/")
    if converted:
        print(f"Converted {converted} inline image(s) into image files")
    print("news/news.json updated")

    update_rss_feed()


if __name__ == "__main__":
    main()
