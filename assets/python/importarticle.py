# Please use .runbeforecommit.py instead
#
# This script imports a news article package (.zip) exported by the
# Article Builder tool (tools/articlebuilder/) and wires it into the site.

import json
import os
import platform
import subprocess
import sys
import zipfile

NEWS_JSON_PATH = "news/news.json"


def main():
    if len(sys.argv) > 1:
        zip_path = sys.argv[1]
    else:
        zip_path = pick_file()
        if not zip_path:
            zip_path = input(
                "Enter the path to the article .zip exported from the Article Builder > "
            ).strip().strip('"')

    import_article_zip(zip_path)


def pick_file() -> str | None:
    """
    Opens a native file-picker dialog to choose the exported .zip, using
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
                    "--title=Select the Article Builder export (.zip)",
                    "--file-filter=Zip files | *.zip",
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
                ["kdialog", "--getopenfilename", ".", "*.zip|Zip files"],
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
            title="Select the Article Builder export (.zip)",
            filetypes=[("Zip files", "*.zip"), ("All files", "*.*")],
        )
        root.destroy()
        return path or None
    except Exception:
        return None


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
        FileNotFoundError: If the zip doesn't exist.
        ValueError: If the zip doesn't look like an Article Builder export.
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
            name for name in names if name.startswith("news/") and not name.endswith("/")
        ]
        if not article_files:
            raise ValueError("No article files found under news/ in this zip.")

        article_dir = os.path.dirname(article_files[0])
        if os.path.isdir(article_dir):
            print(f"Note: {article_dir}/ already exists and will be overwritten.")

        for name in article_files:
            zf.extract(name, ".")

    update_news_json(entry)

    print(f"Extracted {len(article_files)} file(s) to {article_dir}/")
    print("news/news.json updated")


if __name__ == "__main__":
    main()
