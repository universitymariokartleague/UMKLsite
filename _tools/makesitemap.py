# Please use .runbeforecommit.py instead

import os

# Private areas. The admin panel is Discord-gated and there's no reason to
# advertise it to search engines; robots.txt disallows it too.
EXCLUDED_PREFIXES = ("admin/",)


def generate_sitemap():
    root_dir = "."  # Scan all folders from the current directory
    sitemap_file = "sitemap.txt"

    with open(sitemap_file, "w", encoding="utf-8") as f:
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.endswith(".html"):
                    rel_path = os.path.relpath(os.path.join(root, file), root_dir)
                    url_path = rel_path.replace(os.sep, "/").replace("index.html", "")
                    if url_path.startswith(EXCLUDED_PREFIXES):
                        continue
                    f.write("https://umkl.co.uk/" + url_path + "\n")


# if __name__ == "__main__":
#     generate_sitemap()
