/*
    This script is for a tools page where you tracks can be randomised, 
    with the option to disable repicks. It also has the option to show PAL names
    for tracks that have different names in PAL regions.
*/

const tracks = {
    SNES: [
        "Mario Circuit 1",
        "Donut Plains 1",
        "Ghost Valley 1",
        "Bowser Castle 1",
        "Mario Circuit 2",
        "Choco Island 1",
        "Ghost Valley 2",
        "Donut Plains 2",
        "Bowser Castle 2",
        "Mario Circuit 3",
        "Koopa Beach 1",
        "Choco Island 2",
        "Vanilla Lake 1",
        "Bowser Castle 3",
        "Mario Circuit 4",
        "Donut Plains 3",
        "Koopa Beach 2",
        "Ghost Valley 3",
        "Vanilla Lake 2",
        "Rainbow Road"
    ],
    N64: [
        "Luigi Raceway",
        "Moo Moo Farm",
        "Koopa Troopa Beach",
        "Kalamari Desert",
        "Toad's Turnpike",
        "Frappe Snowland",
        "Choco Mountain",
        "Mario Raceway",
        "Wario Stadium",
        "Sherbet Land",
        "Royal Raceway",
        "Bowser's Castle",
        "DK's Jungle Parkway",
        "Yoshi Valley",
        "Banshee Boardwalk",
        "Rainbow Road",
    ],
    GBA: [
        "Peach Circuit",
        "Shy Guy Beach",
        "Riverside Park",
        "Bowser Castle 1",
        "Mario Circuit",
        "Boo Lake",
        "Cheese Land",
        "Bowser Castle 2",
        "Luigi Circuit",
        "Sky Garden",
        "Cheep-Cheep Island",
        "Sunset Wilds",
        "Snow Land",
        "Ribbon Road",
        "Yoshi Desert",
        "Bowser Castle 3",
        "Lakeside Park",
        "Broken Pier",
        "Bowser Castle 4",
        "Rainbow Road",
    ],
    GCN: [
        "Luigi Circuit",
        "Peach Beach",
        "Baby Park",
        "Dry Dry Desert",
        "Mushroom Bridge",
        "Mario Circuit",
        "Daisy Cruiser",
        "Waluigi Stadium",
        "Sherbet Land",
        "Mushroom City",
        "Yoshi Circuit",
        "DK Mountain",
        "Wario Colosseum",
        "Dino Dino Jungle",
        "Bowser's Castle",
        "Rainbow Road"
    ],
    DS: [
        "Figure-8 Circuit",
        "Yoshi Falls",
        "Cheep Cheep Beach",
        "Luigi's Mansion",
        "Desert Hills",
        "Delfino Square",
        "Waluigi Pinball",
        "Shroom Ridge",
        "DK Pass",
        "Tick-Tock Clock",
        "Mario Circuit",
        "Airship Fortress",
        "Wario Stadium",
        "Peach Gardens",
        "Bowser Castle",
        "Rainbow Road",

        "SNES Mario Circuit 1",
        "N64 Moo Moo Farm",
        "GBA Peach Circuit",
        "GCN Luigi Circuit",
        "SNES Donut Plains 1",
        "N64 Frappe Snowland",
        "GBA Bowser Castle 2",
        "GCN Baby Park",
        "SNES Koopa Beach 2",
        "N64 Choco Mountain",
        "GBA Luigi Circuit",
        "GCN Mushroom Bridge",
        "SNES Choco Island 2",
        "N64 Banshee Boardwalk",
        "GBA Sky Garden",
        "GCN Yoshi Circuit"
    ],
    Wii: [
        "Luigi Circuit",
        "Moo Moo Meadows",
        "Mushroom Gorge",
        "Toad's Factory",
        "Mario Circuit",
        "Coconut Mall",
        { us: "DK Summit", pal: "DK's Snowboard Cross" },
        "Wario's Gold Mine",
        "Daisy Circuit",
        "Koopa Cape",
        "Maple Treeway",
        "Grumble Volcano",
        "Dry Dry Ruins",
        "Moonview Highway",
        "Bowser's Castle",
        "Rainbow Road",

        "GCN Peach Beach",
        "DS Yoshi Falls",
        "SNES Ghost Valley 2",
        "N64 Mario Raceway",
        "N64 Sherbet Land",
        "GBA Shy Guy Beach",
        "DS Delfino Square",
        "GCN Waluigi Stadium",
        "DS Desert Hills",
        "GBA Bowser Castle 3",
        "N64 DK's Jungle Parkway",
        "GCN Mario Circuit",
        "SNES Mario Circuit 3",
        "DS Peach Gardens",
        "GCN DK Mountain",
        "N64 Bowser's Castle"
    ],
    MK7: [
        "Toad Circuit",
        "Daisy Hills",
        { us: "Cheep Cheep Lagoon", pal: "Cheep-Cheep Cape" },
        "Shy Guy Bazaar",
        { us: "Wuhu Loop", pal: "Wuhu Island Loop" },
        "Mario Circuit",
        { us: "Music Park", pal: "Melody Motorway" },
        { us: "Rock Rock Mountain", pal: "Alpine Pass" },
        { us: "Piranha Plant Slide", pal: "Piranha Plant Pipeway" },
        { us: "Wario Shipyard", pal: "Wario's Galleon" },
        { us: "Neo Bowser City", pal: "Koopa City" },
        { us: "Maka Wuhu", pal: "Wuhu Mountain Loop" },
        "DK Jungle",
        "Rosalina's Ice World",
        "Bowser's Castle",
        "Rainbow Road",

        "N64 Luigi Raceway",
        "GBA Bowser Castle 1",
        "Wii Mushroom Gorge",
        "DS Luigi's Mansion",
        "N64 Koopa Troopa Beach",
        "SNES Mario Circuit 2",
        "Wii Coconut Mall",
        "DS Waluigi Pinball",
        "N64 Kalamari Desert",
        "DS DK Pass",
        "GCN Daisy Cruiser",
        "Wii Maple Treeway",
        "Wii Koopa Cape",
        "GCN Dino Dino Jungle",
        "DS Airship Fortress",
        "SNES Rainbow Road"
    ],
    MK8: [
        "Mario Kart Stadium",
        "Water Park",
        "Sweet Sweet Canyon",
        "Thwomp Ruins",
        "Mario Circuit",
        { us: "Toad Harbor", pal: "Toad Harbour" },
        "Twisted Mansion",
        "Shy Guy Falls",
        "Sunshine Airport",
        "Dolphin Shoals",
        "Electrodrome",
        "Mount Wario",
        "Cloudtop Cruise",
        { us: "Bone-Dry Dunes", pal: "Bone Dry Dunes" },
        "Bowser's Castle",
        "Rainbow Road",

        "Wii Moo Moo Meadows",
        "GBA Mario Circuit",
        "DS Cheep Cheep Beach",
        "N64 Toad's Turnpike",
        "GCN Dry Dry Desert",
        "SNES Donut Plains 3",
        "N64 Royal Raceway",
        "3DS DK Jungle",
        "DS Wario Stadium",
        "GCN Sherbet Land",
        { us: "3DS Music Park", pal: "3DS Melody Motorway" },
        "N64 Yoshi Valley",
        "DS Tick-Tock Clock",
        { us: "3DS Piranha Plant Slide", pal: "3DS Piranha Plant Pipeway" },
        "Wii Grumble Volcano",
        "N64 Rainbow Road",

        "GCN Yoshi Circuit",
        "Excitebike Arena",
        "Dragon Driftway",
        "Mute City",
        "Wii Wario's Gold Mine",
        "SNES Rainbow Road",
        "Ice Ice Outpost",
        "Hyrule Circuit",
        "GCN Baby Park",
        "GBA Cheese Land",
        "Wild Woods",
        "Animal Crossing",
        { us: "3DS Neo Bowser City", pal: "3DS Koopa City" },
        "GBA Ribbon Road",
        "Super Bell Subway",
        "Big Blue"
    ],
    DX: [
        "SNES Mario Circuit 3",
        "SNES Bowser Castle 3",
        "SNES Donut Plains 3",
        "SNES Rainbow Road",

        "N64 Kalimari Desert",
        "N64 Toad's Turnpike",
        "N64 Choco Mountain",
        "N64 Royal Raceway",
        "N64 Yoshi Valley",
        "N64 Rainbow Road",

        "GBA Riverside Park",
        "GBA Mario Circuit",
        "GBA Boo Lake",
        "GBA Cheese Land",
        "GBA Sky Garden",
        "GBA Sunset Wilds",
        "GBA Snow Land",
        "GBA Ribbon Road",

        "GCN Baby Park",
        "GCN Dry Dry Desert",
        "GCN Daisy Cruiser",
        "GCN Waluigi Stadium",
        "GCN Sherbet Land",
        "GCN Yoshi Circuit",
        "GCN DK Mountain",

        "DS Cheep Cheep Beach",
        "DS Waluigi Pinball",
        "DS Shroom Ridge",
        "DS Tick-Tock Clock",
        "DS Mario Circuit",
        "DS Wario Stadium",
        "DS Peach Gardens",

        "Wii Moo Moo Meadows",
        "Wii Mushroom Gorge",
        "Wii Coconut Mall",
        { us: "Wii DK Summit", pal: "Wii DK's Snowboard Cross" },
        "Wii Wario's Gold Mine",
        "Wii Daisy Circuit",
        "Wii Koopa Cape",
        "Wii Maple Treeway",
        "Wii Grumble Volcano",
        "Wii Moonview Highway",
        "Wii Rainbow Road",

        "3DS Toad Circuit",
        { us: "3DS Music Park", pal: "3DS Melody Motorway" },
        { us: "3DS Rock Rock Mountain", pal: "3DS Alpine Pass" },
        { us: "3DS Piranha Plant Slide", pal: "3DS Piranha Plant Pipeway" },
        { us: "3DS Neo Bowser City", pal: "3DS Koopa City" },
        "3DS DK Jungle",
        "3DS Rosalina's Ice World",
        "3DS Rainbow Road",

        "Mario Kart Stadium",
        "Water Park",
        "Sweet Sweet Canyon",
        "Thwomp Ruins",
        "Mario Circuit",
        { us: "Toad Harbor", pal: "Toad Harbour" },
        "Twisted Mansion",
        "Shy Guy Falls",
        "Sunshine Airport",
        "Dolphin Shoals",
        "Electrodrome",
        "Mount Wario",
        "Cloudtop Cruise",
        { us: "Bone-Dry Dunes", pal: "Bone Dry Dunes" },
        "Bowser's Castle",
        "Rainbow Road",

        "Excitebike Arena",
        "Dragon Driftway",
        "Mute City",
        "Ice Ice Outpost",
        "Hyrule Circuit",
        "Wild Woods",
        "Animal Crossing",
        "Super Bell Subway",
        "Big Blue",

        "Tour New York Minute",
        "Tour Tokyo Blur",
        "Tour Paris Promenade",
        "Tour London Loop",
        "Tour Vancouver Velocity",
        "Tour Los Angeles Laps",
        "Merry Mountain",
        "Tour Berlin Byways",
        "Ninja Hideaway",
        "Tour Sydney Sprint",
        "Tour Singapore Speedway",
        "Tour Amsterdam Drift",
        "Tour Bangkok Rush",
        "Sky-High Sundae",
        "Piranha Plant Cove",
        "Yoshi's Island",
        "Tour Athens Dash",
        "Tour Rome Avanti",
        "Squeaky Clean Sprint",
        "Tour Madrid Drive"
    ],
    WORLD: [
        "Mario Bros. Circuit",
        "Crown City",
        "Whistletop Summit",
        "DK Spaceport",
        "Desert Hills",
        "Shy Guy Bazaar",
        "Wario Stadium",
        "Airship Fortress",
        "DK Pass",
        "Starview Peak",
        "Sky-High Sundae",
        {us: "Wario Shipyard", pal: "Wario's Galleon"},
        "Koopa Troopa Beach",
        "Faraway Oasis",
        "Peach Stadium",
        "Peach Beach",
        "Salty Salty Speedway",
        "Dino Dino Jungle",
        "Great ? Block Ruins",
        "Cheep Cheep Falls",
        "Dandelion Depths",
        "Boo Cinema",
        "Dry Bones Burnout",
        "Moo Moo Meadows",
        "Choco Mountain",
        "Toad's Factory",
        "Bowser's Castle",
        "Acorn Heights",
        "Mario Circuit",
        "Rainbow Road"
    ],
}

const tracksContainer = document.getElementById("results");
const pickedTracksList = document.getElementById("pickedTracks");
const pickRandomTrackButton = document.getElementById("pickRandomTrack");
const clearRepicksButton = document.getElementById("clearRepicks");
const PALNamesCheckbox = document.getElementById("palNames");

let tracksPicked = [];
let tracksPickedVisual = [];
let lastTrack = null;

function pickRandomTrack() {
    const selectedGame = document.getElementById("game-select").value;
    const trackList = tracks[selectedGame];
    let tempRandomTrack = trackList[Math.floor(Math.random() * trackList.length)];
    if (tracksPicked.length < tracks[selectedGame].length) {
        lastTrack = tempRandomTrack;
    }

    if (document.getElementById("disableRepicks").checked) {
        let tempTracksList = tracksPicked.slice().reverse();
        if (tracksPicked.length == tracks[selectedGame].length) {
            pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Max courses! Please clear!<br>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;
            return;
        }
        while (tracksPicked.includes(tempRandomTrack)) {
            tempRandomTrack = trackList[Math.floor(Math.random() * trackList.length)];
        }
        lastTrack = tempRandomTrack;
        tracksPicked.push(tempRandomTrack);
        tempTracksList = tracksPicked.slice().reverse();
        pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Picked courses (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;
    }

    if (tempRandomTrack.us) {
        if (PALNamesCheckbox.checked) {
            tempRandomTrack = tempRandomTrack.pal;
        } else {
            tempRandomTrack = tempRandomTrack.us;
        }
    }
    tracksContainer.innerHTML = `${tempRandomTrack}`;
}

function rerender(selectedGame) {
    if (document.getElementById("disableRepicks").checked) {
        if (tracksPicked.length == tracks[selectedGame].length) {
            let tempTracksList = tracksPicked.slice().reverse();
            pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Max tracks! Please clear!<br>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;
        } else {
            let tempTracksList = tracksPicked.slice().reverse();
            pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.map(track => track.us ? (PALNamesCheckbox.checked ? track.pal : track.us) : track).join(`<br>`)}</div>`;    
        }
    }
    tracksContainer.innerHTML = `${lastTrack.us ? (PALNamesCheckbox.checked ? lastTrack.pal : lastTrack.us) : lastTrack}`;
}

function clearRepicks() {
    tracksPicked = [];
    pickedTracksList.innerHTML = "";
}

document.getElementById("game-select").addEventListener("change", function () {
    tracksPicked = [];
    tracksContainer.innerHTML = "Nothing picked";
    pickedTracksList.innerHTML = "";
});

document.addEventListener("DOMContentLoaded", () => {
    const tempLocale = localStorage.getItem("locale") || "en-GB";
    PALNamesCheckbox.checked = tempLocale == "en-GB";
});

pickRandomTrackButton.addEventListener("click", pickRandomTrack);
clearRepicksButton.addEventListener("click", clearRepicks);
PALNamesCheckbox.addEventListener("click", function () {
    const selectedGame = document.getElementById("game-select").value;
    rerender(selectedGame);
});