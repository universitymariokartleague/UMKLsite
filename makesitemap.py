# Please use .runbeforecommit.py

import os

def generate_sitemap():
    pages_dir = 'pages'
    sitemap_file = 'sitemap.txt'

    with open(sitemap_file, 'w', encoding='utf-8') as f:
        f.write("https://umkl.co.uk/\n")
        f.write("https://umkl.co.uk/404\n")

        for root, dirs, files in os.walk(pages_dir):
            for file in files:
                if file.endswith('.html'):
                    rel_path = os.path.relpath(os.path.join(root, file), pages_dir)
                    f.write("https://umkl.co.uk/" + rel_path.replace(os.sep, '/').replace("index.html", "") + '\n')

# if __name__ == "__main__":
#     generate_sitemap()