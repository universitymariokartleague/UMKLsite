# This script is intended to be run before committing changes to ensure that the latest graphics and JSON files are generated.

import genteamcolorsjson, graphics, logic, makesitemap

def run_pre_commit_tasks():
    """
    Run pre-commit tasks to ensure the latest graphics and JSON files are generated.

    This function generates graphics for team standings for all seasons,
    and then generates a JSON file containing team colors.
    """
    # Generate the graphics
    print("Generating graphics...")
    max_season = logic.get_current_season()
    for i in range(1, max_season + 1):
        graphics.create_team_standings_image(season_id=i, add_timestamp=True)

    # Generate the team colors JSON file
    print("Generating team colors JSON file...")
    genteamcolorsjson.generate_team_colors_json()

    # Generate sitemap
    makesitemap.generate_sitemap()

    print("All tasks completed successfully!")

if __name__ == "__main__":
    run_pre_commit_tasks()