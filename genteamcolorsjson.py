# Please use .runbeforecommit.py

import logic
import json

def generate_team_colors_json():
    teams_dict = {i[1]: i[3] for i in logic.get_teams_list()}
    with open("database/teamcolors.json", "w") as file:
        json.dump(teams_dict, file, indent=4)

# if __name__ == "__main__":
#     generate_team_colors_json()