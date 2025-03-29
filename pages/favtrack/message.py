import random

def winner_stays_on(items):
    if not items:
        print("No items to compare.")
        return None
    
    current_winner = items[0]
    
    for i in range(1, len(items)):
        print(f"Which do you prefer?\n1: {current_winner}\n2: {items[i]}")
        choice = input("Enter 1 or 2: ").strip()
        
        while choice not in ('1', '2'):
            print("Invalid choice. Please enter 1 or 2.")
            choice = input("Enter 1 or 2: ").strip()
        
        if choice == '2':
            current_winner = items[i]
    
    print(f"Your favorite item is: {current_winner}")
    return current_winner

# Example usage
things = [
    # Super Mario Kart
    "SNES Mario Circuit 1", "SNES Donut Plains 1", "SNES Ghost Valley 1", "SNES Bowser Castle 1", "SNES Mario Circuit 2",
    "SNES Choco Island 1", "SNES Ghost Valley 2", "SNES Donut Plains 2", "SNES Bowser Castle 2", "SNES Mario Circuit 3",
    "SNES Koopa Beach 1", "SNES Choco Island 2", "SNES Vanilla Lake 1", "SNES Bowser Castle 3", "SNES Mario Circuit 4",
    "SNES Donut Plains 3", "SNES Koopa Beach 2", "SNES Ghost Valley 3", "SNES Vanilla Lake 2", "SNES Rainbow Road",

    # Mario Kart 64
    "N64 Luigi Raceway", "N64 Moo Moo Farm", "N64 Koopa Troopa Beach", "N64 Kalimari Desert",
    "N64 Toad's Turnpike", "N64 Frappe Snowland", "N64 Choco Mountain", "N64 Mario Raceway",
    "N64 Wario Stadium", "N64 Sherbet Land", "N64 Royal Raceway", "N64 Bowser's Castle",
    "N64 DK's Jungle Parkway", "N64 Yoshi Valley", "N64 Banshee Boardwalk", "N64 Rainbow Road",
    
    # Mario Kart: Super Circuit
    "GBA Peach Circuit", "GBA Shy Guy Beach", "GBA Riverside Park", "GBA Bowser Castle 1",
    "GBA Mario Circuit", "GBA Boo Lake", "GBA Cheese Land", "GBA Bowser Castle 2",
    "GBA Luigi Circuit", "GBA Sky Garden", "GBA Cheep Cheep Island", "GBA Sunset Wilds",
    "GBA Snow Land", "GBA Ribbon Road", "GBA Yoshi Desert", "GBA Bowser Castle 3",
    "GBA Lakeside Park", "GBA Broken Pier", "GBA Bowser Castle 4", "GBA Rainbow Road",
    
    # Mario Kart: Double Dash!!
    "GCN Luigi Circuit", "GCN Peach Beach", "GCN Baby Park", "GCN Dry Dry Desert",
    "GCN Mushroom Bridge", "GCN Mario Circuit", "GCN Daisy Cruiser", "GCN Waluigi Stadium",
    "GCN Sherbet Land", "GCN Mushroom City", "GCN Yoshi Circuit", "GCN DK Mountain",
    "GCN Wario Colosseum", "GCN Dino Dino Jungle", "GCN Bowser's Castle", "GCN Rainbow Road",
    
    # Mario Kart DS
    "DS Figure-8 Circuit", "DS Yoshi Falls", "DS Cheep Cheep Beach", "DS Luigi's Mansion",
    "DS Desert Hills", "DS Delfino Square", "DS Waluigi Pinball", "DS Shroom Ridge",
    "DS DK Pass", "DS Tick-Tock Clock", "DS Mario Circuit", "DS Airship Fortress",
    "DS Wario Stadium", "DS Peach Gardens", "DS Bowser's Castle", "DS Rainbow Road",
    
    # Mario Kart Wii
    "Wii Luigi Circuit", "Wii Moo Moo Meadows", "Wii Mushroom Gorge", "Wii Toad's Factory",
    "Wii Mario Circuit", "Wii Coconut Mall", "Wii DK Summit", "Wii Wario's Gold Mine",
    "Wii Daisy Circuit", "Wii Koopa Cape", "Wii Maple Treeway", "Wii Grumble Volcano",
    "Wii Dry Dry Ruins", "Wii Moonview Highway", "Wii Bowser's Castle", "Wii Rainbow Road",
    # Mario Kart 7
    "3DS Toad Circuit", "3DS Daisy Hills", "3DS Cheep Cheep Lagoon", "3DS Shy Guy Bazaar",
    "3DS Wuhu Loop", "3DS Mario Circuit", "3DS Music Park", "3DS Rock Rock Mountain",
    "3DS Piranha Plant Slide", "3DS Wario Shipyard", "3DS Neo Bowser City", "3DS Maka Wuhu",
    "3DS DK Jungle", "3DS Rosalina's Ice World", "3DS Bowser's Castle", "3DS Rainbow Road",
    # Mario Kart 8 Deluxe
    "Wii U Mario Kart Stadium", "Wii U Water Park", "Wii U Sweet Sweet Canyon", "Wii U Thwomp Ruins",
    "Wii U Mario Circuit", "Wii U Toad Harbor", "Wii U Twisted Mansion", "Wii U Shy Guy Falls",
    "Wii U Sunshine Airport", "Wii U Dolphin Shoals", "Wii U Electrodrome", "Wii U Mount Wario",
    "Wii U Cloudtop Cruise", "Wii U Bone-Dry Dunes", "Wii U Bowser's Castle", "Wii U Rainbow Road",
    "Wii U Excitebike Arena", "Wii U Dragon Driftway", "Wii U Mute City", "Wii U Ice Ice Outpost",
    "Wii U Hyrule Circuit", "Wii U Wild Woods",
    
    # Mario Kart Tour
    "Tour New York Minute", "Tour Tokyo Blur", "Tour Paris Promenade", "Tour London Loop",
    "Tour Vancouver Velocity", "Tour Los Angeles Laps", "Tour Berlin Byways", "Tour Sydney Sprint",
    "Tour Singapore Speedway", "Tour Amsterdam Drift", "Tour Bangkok Rush", "Tour Athens Dash",
    "Tour Rome Avanti", "Tour Madrid Drive", "Switch Merry Mountain", "Switch Ninja Hideaway",
    "Switch Sky-High Sundae", "Switch Piranha Plant Cove", "Switch Yoshi's Island", "Tour Piranha Plant Pipeline",
    "Switch Squeaky Clean Sprint"
]

random.shuffle(things)  # Shuffle the items for randomness

winner_stays_on(things)
