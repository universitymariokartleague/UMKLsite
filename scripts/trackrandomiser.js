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
        "Rainbow Road",
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
        "Bowser Castle",
        "DK's Jungle Parkway",
        "Yoshi Valley",
        "Banshee Boardwalk",
        "Rainbow Road",
    ],
    GBA: [
        
    ]
    Wii: [
        "Luigi Circuit",
        "Moo Moo Meadows",
        "Mushroom Gorge",
        "Toad's Factory",
        "Mario Circuit",
        "Coconut Mall",
        "DK Summit",
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
    Switch: [
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
        "Wii DK Summit",
        "Wii Wario's Gold Mine",
        "Wii Daisy Circuit",
        "Wii Koopa Cape",
        "Wii Maple Treeway",
        "Wii Grumble Volcano",
        "Wii Moonview Highway",
        "Wii Rainbow Road",
        
        "3DS Toad Circuit",
        "3DS Music Park",
        "3DS Rock Rock Mountain",
        "3DS Piranha Plant Slide",
        "3DS Neo Bowser City",
        "3DS DK Jungle",
        "3DS Rosalina's Ice World",
        "3DS Rainbow Road",
        
        "Mario Kart Stadium",
        "Water Park",
        "Sweet Sweet Canyon",
        "Twomp Ruins",
        "Mario Circuit",
        "Toad Harbor",
        "Twisted Mansion",
        "Shy Guy Falls",
        "Sunshine Airport",
        "Dolphin Shoals",
        "Electrodrome",
        "Mount Wario",
        "Cloudtop Cruise",
        "Bone-Dry Dunes",
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
}

const tracksContainer = document.getElementById("results");
const pickedTracksList = document.getElementById("pickedTracks");
const pickRandomTrackButton = document.getElementById("pickRandomTrack");
const clearRepicksButton = document.getElementById("clearRepicks");

let tracksPicked = [];

function pickRandomTrack() {
    const selectedGame = document.getElementById("game-select").value;
    const trackList = tracks[selectedGame];
    let randomTrack = trackList[Math.floor(Math.random() * trackList.length)];

    if (document.getElementById("disableRepicks").checked) {
        let tempTracksList = tracksPicked.slice().reverse();
        if (tracksPicked.length == tracks[selectedGame].length) {
            pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Max tracks! Please clear!<br>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.join(`<br>`)}</div>`;
            return;
        }
        while (tracksPicked.includes(randomTrack)) {
            randomTrack = trackList[Math.floor(Math.random() * trackList.length)];
        }
        tracksPicked.push(randomTrack);
        tempTracksList = tracksPicked.slice().reverse();
        pickedTracksList.innerHTML = `<div class="codeBoxTight"><b>Picked tracks (${tracksPicked.length} / ${tracks[selectedGame].length})</b><br><br>${tempTracksList.join(`<br>`)}</div>`;
    }

    tracksContainer.innerHTML = `${randomTrack}`;
}

function clearRepicks() {
    tracksPicked = [];
    pickedTracksList.innerHTML = "";
}

document.getElementById("game-select").addEventListener("change", function() {
    tracksPicked = [];
    tracksContainer.innerHTML = "Nothing picked";
    pickedTracksList.innerHTML = "";
});

pickRandomTrackButton.addEventListener("click", pickRandomTrack);
clearRepicksButton.addEventListener("click", clearRepicks);