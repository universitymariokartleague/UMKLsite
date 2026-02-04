# Please use .runbeforecommit.py instead
#
# This script generates backups for various API data

import json, requests

API_URL = "https://api.umkl.co.uk/"
HEADERS = {"Content-Type": "application/json"}

def get_current_season():
    response = requests.post(f"{API_URL}seasoninfo", json={"season": ""}, headers=HEADERS)
    if response.content:
        return response.json()[0]

def get_teamdata(payload):
    response = requests.post(f"{API_URL}teamdata", json=payload, headers=HEADERS)
    if response.content:
        return response.json()

def get_teamcolors():
    response = requests.post(f"{API_URL}teamcolors", json={}, headers=HEADERS)
    if response.content:
        return response.json()

def get_teamlocations():
    response = requests.post(f"{API_URL}teamlocations", json={}, headers=HEADERS)
    if response.content:
        return response.json()

def get_matchdata():
    response = requests.post(f"{API_URL}matchdata", json={}, headers=HEADERS)
    if response.content:
        return response.json()

def generate_match_data_json():
    current_season = get_current_season()
    for i in range(1, current_season + 1):
        with open(f"database/teamdatafallbacks{i}.json", "w") as file:
            json.dump(get_teamdata({"team": "", "season": i}), file, indent=4)

    with open("database/teamcolorsfallback.json", "w") as file:
        json.dump(get_teamcolors(), file, indent=4)

    with open("database/teamlocationsfallback.json", "w") as file:
        json.dump(get_teamlocations(), file, indent=4)

    with open("database/matchdatafallback.json", "w") as file:
        json.dump(get_matchdata(), file, indent=4)

# if __name__ == "__main__":
#     generate_match_data_json()