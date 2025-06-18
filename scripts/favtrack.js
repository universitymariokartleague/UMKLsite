/*
    This script is for a tools page where you pick your favorite Mario Kart track using pairwise 
    comparison.
*/

const tracks = [
    // Super Mario Kart (SNES)
    "SNES Mario Circuit 1", "SNES Donut Plains 1", "SNES Ghost Valley 1", "SNES Bowser Castle 1", "SNES Mario Circuit 2",
    "SNES Choco Island 1", "SNES Ghost Valley 2", "SNES Donut Plains 2", "SNES Bowser Castle 2", "SNES Mario Circuit 3",
    "SNES Koopa Beach 1", "SNES Choco Island 2", "SNES Vanilla Lake 1", "SNES Bowser Castle 3", "SNES Mario Circuit 4",
    "SNES Donut Plains 3", "SNES Koopa Beach 2", "SNES Ghost Valley 3", "SNES Vanilla Lake 2", "SNES Rainbow Road",

    // Mario Kart 64 (N64)
    "N64 Luigi Raceway", "N64 Moo Moo Farm", "N64 Koopa Troopa Beach", "N64 Kalimari Desert",
    "N64 Toad's Turnpike", "N64 Frappe Snowland", "N64 Choco Mountain", "N64 Mario Raceway",
    "N64 Wario Stadium", "N64 Sherbet Land", "N64 Royal Raceway", "N64 Bowser's Castle",
    "N64 DK's Jungle Parkway", "N64 Yoshi Valley", "N64 Banshee Boardwalk", "N64 Rainbow Road",
    
    // Mario Kart: Super Circuit (GBA)
    "GBA Peach Circuit", "GBA Shy Guy Beach", "GBA Riverside Park", "GBA Bowser Castle 1",
    "GBA Mario Circuit", "GBA Boo Lake", "GBA Cheese Land", "GBA Bowser Castle 2",
    "GBA Luigi Circuit", "GBA Sky Garden", "GBA Cheep Cheep Island", "GBA Sunset Wilds",
    "GBA Snow Land", "GBA Ribbon Road", "GBA Yoshi Desert", "GBA Bowser Castle 3",
    "GBA Lakeside Park", "GBA Broken Pier", "GBA Bowser Castle 4", "GBA Rainbow Road",
    
    // Mario Kart: Double Dash!! (GCN)
    "GCN Luigi Circuit", "GCN Peach Beach", "GCN Baby Park", "GCN Dry Dry Desert",
    "GCN Mushroom Bridge", "GCN Mario Circuit", "GCN Daisy Cruiser", "GCN Waluigi Stadium",
    "GCN Sherbet Land", "GCN Mushroom City", "GCN Yoshi Circuit", "GCN DK Mountain",
    "GCN Wario Colosseum", "GCN Dino Dino Jungle", "GCN Bowser's Castle", "GCN Rainbow Road",
    
    // Mario Kart DS (DS)
    "DS Figure-8 Circuit", "DS Yoshi Falls", "DS Cheep Cheep Beach", "DS Luigi's Mansion",
    "DS Desert Hills", "DS Delfino Square", "DS Waluigi Pinball", "DS Shroom Ridge",
    "DS DK Pass", "DS Tick-Tock Clock", "DS Mario Circuit", "DS Airship Fortress",
    "DS Wario Stadium", "DS Peach Gardens", "DS Bowser's Castle", "DS Rainbow Road",
    
    // Mario Kart Wii (Wii)
    "Wii Luigi Circuit", "Wii Moo Moo Meadows", "Wii Mushroom Gorge", "Wii Toad's Factory",
    "Wii Mario Circuit", "Wii Coconut Mall", "Wii DK Summit", "Wii Wario's Gold Mine",
    "Wii Daisy Circuit", "Wii Koopa Cape", "Wii Maple Treeway", "Wii Grumble Volcano",
    "Wii Dry Dry Ruins", "Wii Moonview Highway", "Wii Bowser's Castle", "Wii Rainbow Road",
    
    // Mario Kart 7 (3DS)
    "3DS Toad Circuit", "3DS Daisy Hills", "3DS Cheep Cheep Lagoon", "3DS Shy Guy Bazaar",
    "3DS Wuhu Loop", "3DS Mario Circuit", "3DS Music Park", "3DS Rock Rock Mountain",
    "3DS Piranha Plant Slide", "3DS Wario Shipyard", "3DS Neo Bowser City", "3DS Maka Wuhu",
    "3DS DK Jungle", "3DS Rosalina's Ice World", "3DS Bowser's Castle", "3DS Rainbow Road",
    
    // Mario Kart 8 (Wii U)
    "Wii U Mario Kart Stadium", "Wii U Water Park", "Wii U Sweet Sweet Canyon", "Wii U Thwomp Ruins",
    "Wii U Mario Circuit", "Wii U Toad Harbor", "Wii U Twisted Mansion", "Wii U Shy Guy Falls",
    "Wii U Sunshine Airport", "Wii U Dolphin Shoals", "Wii U Electrodrome", "Wii U Mount Wario",
    "Wii U Cloudtop Cruise", "Wii U Bone-Dry Dunes", "Wii U Bowser's Castle", "Wii U Rainbow Road",
    "Wii U Excitebike Arena", "Wii U Dragon Driftway", "Wii U Mute City", "Wii U Ice Ice Outpost",
    "Wii U Hyrule Circuit", "Wii U Wild Woods",

    // Mario Kart 8 Deluxe (NS)
    "NS Merry Mountain", "NS Ninja Hideaway", "NS Sky-High Sundae",
    "NS Piranha Plant Cove", "NS Yoshi's Island", "NS Squeaky Clean Sprint",
    
    // Mario Kart Tour (Tour)
    "Tour New York Minute", "Tour Tokyo Blur", "Tour Paris Promenade", "Tour London Loop",
    "Tour Vancouver Velocity", "Tour Los Angeles Laps", "Tour Berlin Byways", "Tour Sydney Sprint",
    "Tour Singapore Speedway", "Tour Amsterdam Drift", "Tour Bangkok Rush", "Tour Athens Dash",
    "Tour Rome Avanti", "Tour Madrid Drive", "Tour Piranha Plant Pipeline",

    // Mario Kart World (NS2)
    "NS2 Mario Bros. Circuit", "NS2 Crown City", "NS2 Whistletop Summit", "NS2 DK Spaceport",
    "NS2 Starview Peak", "NS2 Faraway Oasis", "NS2 Peach Stadium", "NS2 Salty Salty Speedway",
    "NS2 Great ? Block Ruins", "NS2 Cheep Cheep Falls", "NS2 Dandelion Depths", "NS2 Boo Cinema",
    "NS2 Dry Bones Burnout", "NS2 Bowser's Castle", "NS2 Acorn Heights", "NS2 Rainbow Road",
]

let trackHTML = document.getElementById("tracks");
let track1, track2;
let tracksLeft = [];

function startTrackPicking() {
    tracksLeft = tracks.sort(() => Math.random() - 0.5);
    pickNewTrack(true);
}

function pickNewTrack(initial, popOffFirst) {
    if (initial) {
        [track1, track2] = [tracksLeft.pop(), tracksLeft.pop()];
    } else {
        if (!popOffFirst) track1 = track2;
        track2 = tracksLeft.pop();
    }

    if (!tracksLeft.length) {
        trackHTML.innerHTML = `Your favourite course is ${track1}!`;
        return;
    }

    trackHTML.innerHTML = `
        Pick the course you prefer!<br>
        <button id="pickNew1" class="track-button">${track1}</button><br>
        <button id="pickNew2" class="track-button">${track2}</button><br>
        <b>${tracksLeft.length} courses left</b>
    `;

    document.getElementById("pickNew1").addEventListener("click", function() {
        pickNewTrack(false, true)
    });
    document.getElementById("pickNew2").addEventListener("click", function() {
        pickNewTrack(false, false)
    });
}

document.addEventListener("DOMContentLoaded", () => {
    startTrackPicking();
});