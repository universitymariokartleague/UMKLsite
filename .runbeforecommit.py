# This script is intended to be run before committing changes to ensure that the latest graphics and JSON files are generated.

import genteamdata, graphics, logic, makesitemap

def run_pre_commit_tasks():
    """
    Run pre-commit tasks to ensure the latest graphics and JSON files are generated.

    This function generates graphics for team standings for all seasons,
    and then generates a JSON file containing team colors.
    """
    print("Generating teamdata/matchdata fallback JSON files...")
    genteamdata.generate_match_data_json()

    # Generate sitemap
    print("Generating sitemap...")
    makesitemap.generate_sitemap()

    print("All tasks completed successfully!")

if __name__ == "__main__":
    run_pre_commit_tasks()