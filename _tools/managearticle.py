# This script provides an interactive CLI for editing news/news.json:
# listing, editing, and removing articles, including moving an article's
# files when its date changes.

import datetime
import json
import os
import shutil

NEWS_JSON_PATH = "news/news.json"


def main():
    news = load_news()

    while True:
        print("\n=== UMKL Article Manager ===")
        print("1. List articles")
        print("2. Edit an article")
        print("3. Remove an article")
        print("4. Exit")
        choice = input("> ").strip().lower()

        if choice == "1":
            list_articles(news)
        elif choice == "2":
            edit_article(news)
        elif choice == "3":
            remove_article(news)
        elif choice in ("4", "q", "quit", "exit"):
            break
        else:
            print("Invalid option.")


def load_news():
    """Loads news/news.json, or an empty list if it doesn't exist yet."""
    if not os.path.exists(NEWS_JSON_PATH):
        return []
    with open(NEWS_JSON_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_news(news):
    """Writes the news list back to news/news.json, sorted newest-first."""
    news.sort(key=lambda item: item["date"], reverse=True)
    with open(NEWS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(news, f, indent=4)
        f.write("\n")


def slug_from_link(link):
    """Extracts the folder slug from a "/news/<date>/<slug>/" link."""
    parts = [p for p in link.split("/") if p]
    return parts[-1] if len(parts) >= 3 else None


def article_dir(entry):
    """The on-disk folder an article's files live in, e.g. news/2026-08-31/some-slug."""
    slug = slug_from_link(entry["link"])
    return f"news/{entry['date']}/{slug}" if slug else None


def list_articles(news):
    """Prints a numbered table of every article, newest first."""
    if not news:
        print("\nNo articles found.")
        return

    print(f"\n{'#':<4} {'Date':<12} Title")
    print("-" * 70)
    for i, item in enumerate(news, start=1):
        print(f"{i:<4} {item['date']:<12} {item['title']}")
    print()


def choose_article(news):
    """
    Prompts for an article number from the list and returns its index,
    or None if the user cancelled or entered something invalid.
    """
    list_articles(news)
    if not news:
        return None

    choice = input("Enter article number (or blank to cancel) > ").strip()
    if not choice:
        return None

    try:
        idx = int(choice) - 1
    except ValueError:
        print("Invalid selection.")
        return None

    if 0 <= idx < len(news):
        return idx

    print("Invalid selection.")
    return None


def prompt_date(current_date):
    """Prompts for a new YYYY-MM-DD date, re-asking until valid or blank."""
    while True:
        value = input(f"Date (YYYY-MM-DD) [{current_date}] > ").strip()
        if not value:
            return None
        try:
            datetime.datetime.strptime(value, "%Y-%m-%d")
            return value
        except ValueError:
            print("Please enter the date as YYYY-MM-DD, e.g. 2026-08-31.")


def edit_article(news):
    """
    Walks through every field of a chosen article, letting the user type
    a new value or press Enter to keep the current one. Editing the date
    also moves the article's on-disk folder to match.
    """
    idx = choose_article(news)
    if idx is None:
        return
    entry = news[idx]

    print(f"\nEditing: {entry['title']}")
    print("Leave blank to keep the current value.\n")

    new_title = input(f"Title [{entry['title']}] > ").strip()
    if new_title:
        entry["title"] = new_title

    new_desc = input(f"Description [{entry['description']}] > ").strip()
    if new_desc:
        entry["description"] = new_desc

    new_image = input(f"Image [{entry['image']}] > ").strip()
    if new_image:
        entry["image"] = new_image

    new_alt = input(f"Alt text [{entry['alt']}] > ").strip()
    if new_alt:
        entry["alt"] = new_alt

    new_tags = input(f"Tags (comma separated) [{', '.join(entry['tags'])}] > ").strip()
    if new_tags:
        entry["tags"] = [t.strip() for t in new_tags.split(",") if t.strip()]

    new_date = prompt_date(entry["date"])
    if new_date and new_date != entry["date"]:
        move_article_date(entry, new_date)

    save_news(news)
    print("\nArticle updated.\n")


def move_article_date(entry, new_date):
    """
    Moves an article's on-disk folder to match a new date and updates its
    date/link fields to match. If the folder isn't found (or a folder
    already exists at the destination), only the JSON fields are updated.
    """
    old_dir = article_dir(entry)
    slug = slug_from_link(entry["link"])
    new_dir = f"news/{new_date}/{slug}"

    if old_dir and os.path.isdir(old_dir):
        if os.path.exists(new_dir):
            print(
                f"Warning: {new_dir}/ already exists; not moving files, only updating the JSON entry."
            )
        else:
            os.makedirs(os.path.dirname(new_dir), exist_ok=True)
            shutil.move(old_dir, new_dir)
            print(f"Moved {old_dir}/ -> {new_dir}/")
    else:
        print(f"Warning: {old_dir}/ not found on disk; only updating the JSON entry.")

    entry["date"] = new_date
    entry["link"] = f"/news/{new_date}/{slug}/"


def remove_article(news):
    """
    Removes an article's entry from news.json, and optionally deletes its
    on-disk folder too (asked separately, since that part is irreversible).
    """
    idx = choose_article(news)
    if idx is None:
        return
    entry = news[idx]

    confirm = (
        input(f"Remove '{entry['title']}' from news.json? (y/N) > ").strip().lower()
    )
    if confirm != "y":
        print("Cancelled.")
        return

    path = article_dir(entry)
    delete_files = False
    if path and os.path.isdir(path):
        delete_files = (
            input(f"Also delete {path}/ from disk? (y/N) > ").strip().lower() == "y"
        )

    del news[idx]
    save_news(news)
    print("Removed from news.json.")

    if delete_files:
        shutil.rmtree(path)
        print(f"Deleted {path}/")


if __name__ == "__main__":
    main()
