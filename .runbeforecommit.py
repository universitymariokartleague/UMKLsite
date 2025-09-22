# This script is intended to be run before committing changes to ensure that the latest JSON files are generated.

import genteamdata, makesitemap, genrss

def run_pre_commit_tasks():
    """
    Run pre-commit tasks to ensure the latest JSON files are generated.
    """
    print("Generating teamdata/matchdata fallback JSON files...")
    genteamdata.generate_match_data_json()

    # Generate RSS feed
    print("Generating RSS feed...")
    genrss.generate_rss_feed()

    # Generate sitemap
    print("Generating sitemap...")
    makesitemap.generate_sitemap()

    print("All tasks completed successfully!")

if __name__ == "__main__":
    run_pre_commit_tasks()