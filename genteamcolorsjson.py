import logic as logic
import json

def generate_team_colors_json():
    teams_list = [
        {"team_color": i[3], "team_name": i[1]}
        for i in logic.get_teams_list()
    ]
    with open("database/teamcolorsfallback.json", "w") as file:
        json.dump(teams_list, file, indent=4)

# if __name__ == "__main__":
#     generate_team_colors_json()