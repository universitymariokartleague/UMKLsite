# This script is intended to be run before committing changes to ensure that the latest JSON files are generated.

import genrss
import makesitemap

def run_pre_commit_tasks():
    """
    Run pre-commit tasks to ensure the latest JSON files are generated.
    """
    # Generate RSS feed
    print("Generating RSS feed...")
    genrss.generate_rss_feed()

    # Generate sitemap
    print("Generating sitemap...")
    makesitemap.generate_sitemap()

    print("All tasks completed successfully!")


if __name__ == "__main__":
    run_pre_commit_tasks()
