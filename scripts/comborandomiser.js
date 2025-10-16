const characters = {
    SNES: [
        "Mario",
        "Luigi",
        "Peach",
        "Yoshi",
        "Toad",
        "Bowser",
        "Koopa Troopa",
        "Donkey Kong Jr",
    ],
    N64: [
        "Mario",
        "Luigi",
        "Toad",
        "Yoshi",
        "Peach",
        "D.K.",
        "Wario",
        "Bowser"
    ],
    GBA: [
        "Mario",
        "Luigi",
        "Peach",
        "Toad",
        "Yoshi",
        "DK",
        "Wario",
        "Bowser"
    ],
    GCN: {
        light: [
            "Baby Mario",
            "Baby Luigi",
            "Toad",
            "Toadette",
            "Koopa Troopa",
            "Paratroopa",
            "Diddy Kong",
            "Bowser Jr."
        ],
        medium: [
            "Mario",
            "Luigi",
            "Peach",
            "Daisy",
            "Yoshi",
            "Birdo",
            "Waluigi"
            
        ],
        heavy: [
            "Donkey Kong",
            "Bowser",
            "Wario",
            "Petey Piranha",
            "King Boo"
        ]
    },
    DS: [
        "Mario",
        "Luigi",
        "Peach",
        "Yoshi",
        "Toad",
        "Donkey Kong",
        "Wario",
        "Bowser",
        "Daisy",
        "Dry Bones",
        "Waluigi",
        "R.O.B"
    ],
    Wii: {
        light: [
            "Baby Mario",
            "Baby Luigi",
            "Baby Daisy",
            "Baby Peach",
            "Toad",
            "Toadette",
            "Koopa Troopa",
            "Dry Bones",
            "Mii (Light)"
        ],
        medium: [
            "Mario",
            "Luigi",
            "Peach",
            "Daisy",
            "Yoshi",
            "Birdo",
            "Diddy Kong",
            "Bowser Jr.",
            "Mii (Medium)"
        ],
        heavy: [
            "Donkey Kong",
            "Funky Kong",
            "Bowser",
            "Dry Bowser",
            "Rosalina",
            "King Boo",
            "Wario",
            "Waluigi",
            "Mii (Heavy)"
        ]

    },
    MK7: [
        "Mario",
        "Luigi",
        "Peach",
        "Yoshi",
        "Bowser",
        "Donkey Kong",
        "Toad",
        "Koopa Troopa",
        "Daisy",
        "Wario",
        "Rosalina",
        "Metal Mario",
        "Shy Guy",
        "Honey Queen",
        "Wiggler",
        "Lakitu",
        "Mii"
    ],
    MK8: [
        "Mario",
        "Luigi",
        "Peach",
        "Daisy",
        "Yoshi",
        "Toad",
        "Koopa Troopa",
        "Shy Guy",
        "Baby Mario",
        "Baby Luigi",
        "Baby Peach",
        "Baby Daisy",
        "Bowser",
        "Donkey Kong",
        "Wario",
        "Waluigi",
        "Rosalina",
        "Metal Mario",
        "Lakitu",
        "Toadette",
        "Baby Rosalina",
        "Pink Gold Peach",
        "Iggy",
        "Roy",
        "Lemmy",
        "Larry",
        "Wendy",
        "Ludwig",
        "Morton",
        "Mii (Light)",
        "Mii (Medium)",
        "Mii (Heavy)",
        "Tanooki Mario",
        "Cat Peach",
        "Link",
        "Villager (Male)",
        "Villager (Female)",
        "Isabelle",
        "Dry Bowser"
    ],
    DX: [
        "Mario",
        "Luigi",
        "Peach",
        "Daisy",
        "Yoshi",
        "Toad",
        "Koopa Troopa",
        "Shy Guy",
        "Baby Mario",
        "Baby Luigi",
        "Baby Peach",
        "Baby Daisy",
        "Bowser",
        "Donkey Kong",
        "Wario",
        "Waluigi",
        "Rosalina",
        "Metal Mario",
        "Lakitu",
        "Toadette",
        "Baby Rosalina",
        "Pink Gold Peach",
        "Iggy",
        "Roy",
        "Lemmy",
        "Larry",
        "Wendy",
        "Ludwig",
        "Morton",
        "Mii (Light)",
        "Mii (Medium)",
        "Mii (Heavy)",
        "Tanooki Mario",
        "Cat Peach",
        "Link",
        "Villager (Male)",
        "Villager (Female)",
        "Isabelle",
        "Dry Bowser",
        "Bowser Jr.",
        "Dry Bones",
        "Gold Mario",
        "Inkling Girl",
        "Inkling Boy",
        "King Boo",
        "Birdo",
        "Kamek",
        "Petey Piranha",
        "Wiggler",
        "Peachette",
        "Diddy Kong",
        "Funky Kong",
        "Pauline"
    ],
    WORLD: [
        "Mario",
        "Luigi",
        "Peach",
        "Yoshi",
        "Toad",
        "Koopa Troopa",
        "Bowser",
        "Wario",
        "Waluigi",
        "Pauline",
        "Baby Mario",
        "Baby Luigi",
        "Baby Peach",
        "Baby Daisy",
        "Toadette",
        "Baby Rosalina",
        "Shy Guy",
        "Nabbit",
        "Piranha Plant",
        "Hammer Bro",
        "Monty Mole",
        "Goomba",
        "Sidestepper",
        "Cheep Cheep",
        "Dry Bones",
        "Wiggler",
        "Pokey",
        "Cow",
        "Stingby",
        "Snowman",
        "Penguin",
        "Para-Biddybud",
        "Daisy",
        "Rosalina",
        "Lakitu",
        "Bowser Jr.",
        "Birdo",
        "King Boo",
        "Donkey Kong",
        "Spike",
        "Cataquack",
        "Pianta",
        "Rocky Wrench",
        "Conkdor",
        "Peepa",
        "Swoop",
        "Fish Bone",
        "Coin Coffer",
        "Dolphin",
        "Chargin' Chuck"
    ]
}

const full_vehicles = {
    GCN:{
        light: ["Goo-Goo Buggy", "Koopa Dasher", "Rattle Buggy", "Toad Kart", "Toadette Kart", "Para-Wing", "Barrel Train", "Bullet Blaster", "Parade Kart"],
        medium: ["Red Fire", "Heart Coach", "Turbo Yoshi", "Green Fire", "Bloom Coach", "Turbo Birdo", "Waluigi Racer", "Parade Kart"],
        heavy: ["DK Jumbo", "Koopa King", "Wario Car", "Piranha Pipes", "Boo Pipes", "Parade Kart"]
    },
    DS: [
        "B Dasher",
        "Standard MR",
        "Shooting Star",
        "Poltergust 4000",
        "Standard LG",
        "Streamliner",
        "Royale",
        "Standard PC",
        "Light Tripper",
        "Egg 1",
        "Standard YS",
        "Cucumber",
        "Mushmellow",
        "Standard TD",
        "4-Wheel Cradle",
        "Rambi Rider",
        "Standard DK",
        "Wildlife",
        "Brute",
        "Standard WR",
        "Dragonfly",
        "Tyrant",
        "Standard BW",
        "Hurricane",
        "Power Flower",
        "Standard DS",
        "Light Dancer",
        "Banisher",
        "Standard DB",
        "Dry Bomber",
        "Gold Mantis",
        "Standard WL",
        "Zipper",
        "ROB-BLS",
        "Standard RB",
        "ROB-LGS"
    ],
    Wii: {
        light: [
            "Standard Kart S",
            "Standard Bike S",
            {us: "Booster Seat", pal: "Baby Booster"},
            "Bullet Bike",
            {us: "Mini Beast", pal: "Concerto"},
            {us: "Bit Bike", pal: "Nanobike"},
            "Cheep Charger",
            "Quacker",
            {us: "Tiny TItan", pal: "Rally Romper"},
            "Magikruiser",
            "Blue Falcon",
            {us: "Jet Bubble", pal: "Bubble Bike"}
        ],
        medium: [
            "Standard Kart M",
            "Standard Bike M",
            {us: "Classic Dragster", pal: "Nostalgia 1"},
            "Mach Bike",
            "Wild Wing",
            {us: "Sugarscoot", pal: "Bon Bon"},
            {us: "Super Blooper", pal: "Turbo Blooper"},
            {us: "Zip Zip", pal: "Rapide"},
            {us: "Daytripper", pal: "Royal Racer"},
            {us: "Sneakster", pal: "Nitrocycle"},
            {us: "Sprinter", pal: "B Dasher Mk. 2"},
            "Dolphin Dasher"
        ],
        heavy: [
            "Standard Kart L",
            "Standard Bike L",
            "Offroader",
            {us: "Flame Runner", pal: "Bowser Bike"},
            "Flame Flyer",
            "Wario Bike",
            "Piranha Prowler",
            {us: "Shooting Star", pal: "Twinkle Star"},
            {us: "Jetsetter", pal: "Aero Glider"},
            {us: "Spear", pal: "Torpedo"},
            {us: "Honeycoupe", pal: "Dragonetti"},
            "Phantom"
        ]
    },
    WORLD: [
        "Standard Kart",
        "Rally Kart",
        "Plushbuggy",
        "Baby Blooper",
        "Zoom Buggy",
        "Chargin' Truck",
        "Hot Rod",
        "Ribbit Revster",
        "Roadster Royale",
        "B Dasher",
        {us:"Biddybuggy", pal: "Buggybud"},
        {us: "Tiny Titan", pal: "Rally Romper"},
        "Stellar Sled",
        "Reel Racer",
        "Bumble V",
        "Carpet Flyer",
        "Cloud 9",
        "Blastronaut III",
        "Big Horn",
        "Lil' Dumpy",
        "Mecha Trike",
        "Pipe Frame",
        "Billdozer",
        "Standard Bike",
        "Rally Bike",
        "Cute Scoot",
        "Mach Rocket",
        "Hyper Pipe",
        "Tune Thumper",
        "W-Twin Chopper",
        "Fin Twin",
        "R.O.B. H.O.G.",
        "Dolphin Dasher",
        "Loco Moto",
        "Funky Dorrie",
        "Junkyard Hog",
        "Lobster Roller",
        "Dread Sled",
        "Rallygator",
        "Bowser Bruiser"
    ]
}

const bodies = {
    MK7 : [
        "Standard",
        {us: "Birthday Girl", pal: "Royal Ribbon"},
        "Bolt Buggy",
        "Bumble V",
        {us: "Bruiser", pal: "Growlster"},
        "Soda Jet",
        "B Dasher",
        "Egg 1",
        "Barrel Train",
        "Tiny Tug",
        "Cact-X",
        "Koopa Clown",
        "Cloud 9",
        {us: "Zucchini", pal: "Gherkin"},
        "Blue Seven",
        "Pipe Frame",
        "Gold Standard"
    ],
    MK8 : [
        "Standard Kart",
        "Pipe Frame",
        "Mach 8",
        "Steel Driver",
        "Cat Cruiser",
        "Circuit Special",
        "Tri-Speeder",
        "Badwagon",
        "Prancer",
        {us: "Biddybiggy", pal: "Buggybud"},
        "Landship",
        {us: "Sneeker", pal: "Bounder"},
        {us: "Sports Coupe", pal: "Sports Coupé"},
        {us: "Gold Standard", pal: "Gold Kart"},
        "GLA",
        "W 25 Silver Arrow",
        "300 SL Roadster",
        "Blue Falcon",
        "Tanooki Kart",
        "B Dasher",
        "Streetle",
        "P-Wing",
        "Standard Bike",
        "The Duke",
        "Flame Rider",
        "Varmint",
        {us: "Mr. Scooty", pal: "Mr Scooty"},
        "City Tripper",
        "Comet",
        "Sport Bike",
        "Jet Bike",
        "Yoshi Bike",
        "Master Cycle",
        {us: "Standard ATV", pal: "Standard Quad"},
        "Wild Wiggler",
        "Teddy Buggy",
        "Bone Rattler"
    ],
    DX: [
        "Standard Kart",
        "Pipe Frame",
        "Mach 8",
        "Steel Driver",
        "Cat Cruiser",
        "Circuit Special",
        "Tri-Speeder",
        "Badwagon",
        "Prancer",
        {us: "Biddybiggy", pal: "Buggybud"},
        "Landship",
        {us: "Sneeker", pal: "Bounder"},
        {us: "Sports Coupe", pal: "Sports Coupé"},
        {us: "Gold Standard", pal: "Gold Kart"},
        "GLA",
        "W 25 Silver Arrow",
        "300 SL Roadster",
        "Blue Falcon",
        "Tanooki Kart",
        "B Dasher",
        "Streetle",
        "P-Wing",
        "Standard Bike",
        "The Duke",
        "Flame Rider",
        "Varmint",
        {us: "Mr. Scooty", pal: "Mr Scooty"},
        "City Tripper",
        "Comet",
        "Sport Bike",
        "Jet Bike",
        "Yoshi Bike",
        "Master Cycle",
        {us: "Standard ATV", pal: "Standard Quad"},
        "Wild Wiggler",
        "Teddy Buggy",
        "Bone Rattler",
        "Koopa Clown",
        "Master Cycle Zero",
        "Splat Buggy",
        "Inkstriker"
    ]
}

const wheels = {
    MK7: [
        {us: "Standard", pal: "Normal"},
        "Roller",
        "Monster",
        "Slim",
        "Slick",
        "Sponge",
        "Mushroom",
        {us: "Wood", pal: "Wooden"},
        "Red Monster",
        {us: "Gold Tires", pal: "Gold Wheels"}
    ],
    MK8: [
        {us: "Standard", pal: "Normal"},
        "Monster",
        "Roller",
        "Slim",
        "Slick",
        "Metal",
        "Button",
        "Off-Road",
        "Sponge",
        {us: "Wood", pal: "Wooden"},
        "Cushion",
        {us: "Blue Standard", pal: "Normal Blue"},
        {us: "Hot Monster", pal: "Funky Monster"},
        "Azure Roller",
        "Crimson Slim",
        "Cyber Slick",
        "Retro Off-Road",
        {us: "Gold Tires", pal: "Gold Wheels"},
        {us: "GLA Tires", pal: "GLA Wheels"},
        {us: "Triforce Tires", pal: "Triforce Tyres"},
        {us: "Leaf Tires", pal: "Leaf Tyres"}
    ],
    DX: [
        {us: "Standard", pal: "Normal"},
        "Monster",
        "Roller",
        "Slim",
        "Slick",
        "Metal",
        "Button",
        "Off-Road",
        "Sponge",
        {us: "Wood", pal: "Wooden"},
        "Cushion",
        {us: "Blue Standard", pal: "Normal Blue"},
        {us: "Hot Monster", pal: "Funky Monster"},
        "Azure Roller",
        "Crimson Slim",
        "Cyber Slick",
        "Retro Off-Road",
        {us: "Gold Tires", pal: "Gold Wheels"},
        {us: "GLA Tires", pal: "GLA Wheels"},
        {us: "Triforce Tires", pal: "Triforce Tyres"},
        {us: "Leaf Tires", pal: "Leaf Tyres"},
        {us: "Ancient Tires", pal: "Ancient Tyres"}
    ]
}

const gliders = {
    MK7: [
        "Super Gilder",
        "Peach Parasol",
        "Flower Glider",
        {us: "Swooper", pal: "Swoop"},
        {us: "Paraglider", pal: "Parafoil"},
        "Gold Glider",
        {us: "Beast Glider", pal: "Ghastly Glider"}
    ],
    MK8: [
        "Super Glider",
        "Cloud Glider",
        "Wario Wing",
        "Waddle Wing",
        "Peach Parasol",
        "Parachute",
        "Parafoil",
        "Flower Glider",
        "Bowser Kite",
        "Plane Glider",
        "MKTV Parafoil",
        "Gold Glider",
        "Hylian Kite",
        "Paper Glider"
    ],
    DX: [
        "Super Glider",
        "Cloud Glider",
        "Wario Wing",
        "Waddle Wing",
        "Peach Parasol",
        "Parachute",
        "Parafoil",
        "Flower Glider",
        "Bowser Kite",
        "Plane Glider",
        "MKTV Parafoil",
        "Gold Glider",
        "Hylian Kite",
        "Paper Glider",
        "Paraglider"
    ],
}

const combosContainer = document.getElementById("results");
const pickedCombosList = document.getElementById("pickedCombos");
const pickRandomComboButton = document.getElementById("pickRandomCombo");
const clearRepicksButton = document.getElementById("clearRepicks");
const PALNamesCheckbox = document.getElementById("palNames");

let combosPicked = [];
let lastCombo = null;

function checkLocale(item) {
    if (!item) return "";
    if (item.us) return PALNamesCheckbox.checked ? item.pal : item.us;
    return item;
}

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function renderComboText(combo) {
    if (!combo) return "Nothing picked";

    switch (combo.type) {
        case "single":
            return checkLocale(combo.character);
        case "combo":
        case "weight_class":
            return `${checkLocale(combo.character)} / ${checkLocale(combo.vehicle)}`;
        case "double":
            return `${checkLocale(combo.character1)} + ${checkLocale(combo.character2)} / ${checkLocale(combo.vehicle)}`;
        case "modular":
            return `${checkLocale(combo.character)} / ${checkLocale(combo.body)} / ${checkLocale(combo.wheels)} / ${checkLocale(combo.glider)}`;
        default:
            return "Unknown combo type";
    }
}

function pickRandomCombo() {
    const selectedGame = document.getElementById("game-select").value;
    let tempCombo = comboGenerator(selectedGame);

    const disableRepicks = document.getElementById("disableRepicks").checked;
    if (disableRepicks) {
        const totalPossible = getTotalCombos(selectedGame);

        if (combosPicked.length >= totalPossible) {
            renderPickedCombos(selectedGame, true);
            return;
        }

        let attempt = 0;
        while (attempt < 1000) {
            let isDuplicate = combosPicked.some(c => {
                if (c.type !== tempCombo.type) return false;

                if (tempCombo.type === "double") {
                    return c.vehicle === tempCombo.vehicle &&
                        ((c.character1 === tempCombo.character1 && c.character2 === tempCombo.character2) ||
                        (c.character1 === tempCombo.character2 && c.character2 === tempCombo.character1));
                } else {
                    return JSON.stringify(c) === JSON.stringify(tempCombo);
                }
            });

            if (!isDuplicate) break;
            attempt++;
            tempCombo = comboGenerator(selectedGame);
        }
        combosPicked.push(tempCombo);
    }

    lastCombo = tempCombo;
    renderPickedCombos(selectedGame);
    combosContainer.innerHTML = renderComboText(tempCombo);
}

function getTwoRandomUnique(arr) {
    const copy = arr.slice();
    const first = randomItem(copy);
    copy.splice(copy.indexOf(first), 1);
    const second = randomItem(copy);
    return [first, second];
}

function getTotalCombos(game) {
    switch (game) {
        case "SNES":
        case "N64":
        case "GBA":
            return characters[game].length;

        case "DS":
        case "WORLD":
            return characters[game].length * full_vehicles[game].length;

        case "GCN": {
            const chars = characters.GCN;
            const veh = full_vehicles.GCN;

            const lightCount = chars.light.length;
            const mediumCount = chars.medium.length;
            const heavyCount = chars.heavy.length;

            const vehCounts = {
                light: veh.light.length,
                medium: veh.medium.length,
                heavy: veh.heavy.length
            };

            let total = 0;

            // Heavy-heavy
            total += (heavyCount * (heavyCount - 1) / 2) * vehCounts.heavy;
            // Heavy-medium
            total += (heavyCount * mediumCount) * vehCounts.heavy;
            // Heavy-light
            total += (heavyCount * lightCount) * vehCounts.heavy;
            // Medium-medium
            total += (mediumCount * (mediumCount - 1) / 2) * vehCounts.medium;
            // Medium-light
            total += (mediumCount * lightCount) * vehCounts.medium;
            // Light-light
            total += (lightCount * (lightCount - 1) / 2) * vehCounts.light;

            return total;
        }

        case "Wii": {
            const weights = Object.keys(characters.Wii);
            let total = 0;
            for (const w of weights) {
                total += characters.Wii[w].length * full_vehicles.Wii[w].length;
            }
            return total;
        }

        case "MK7":
        case "MK8":
        case "DX":
            return characters[game].length * bodies[game].length * wheels[game].length * gliders[game].length;

        default:
            return 0;
    }
}

function comboGenerator(selectedGame) {
    let tempCombo = null;

    if (["SNES", "N64", "GBA"].includes(selectedGame)) {
        const charList = characters[selectedGame];
        const character = randomItem(charList);
        tempCombo = { type: "single", character };
        return tempCombo
    }

    if (["DS", "WORLD"].includes(selectedGame)) {
        const charList = characters[selectedGame];
        const vehList = full_vehicles[selectedGame];
        const character = randomItem(charList);
        const vehicle = randomItem(vehList);
        tempCombo = { type: "combo", character, vehicle };
        return tempCombo
    }

    if (selectedGame === "GCN") {
        const charGroups = characters[selectedGame];
        const vehGroups = full_vehicles[selectedGame];
        const weights = Object.keys(charGroups);

        const allChars = [].concat(...weights.map(w => charGroups[w]));
        const [char1, char2] = getTwoRandomUnique(allChars);

        const weightPriority = { light: 1, medium: 2, heavy: 3 };
        const char1Weight = weights.find(w => charGroups[w].includes(char1));
        const char2Weight = weights.find(w => charGroups[w].includes(char2));
        const heaviestWeight = weightPriority[char1Weight] >= weightPriority[char2Weight] ? char1Weight : char2Weight;

        const vehicle = randomItem(vehGroups[heaviestWeight]);

        tempCombo = { type: "double", character1: char1, character2: char2, vehicle };
        return tempCombo
    }

    if (selectedGame === "Wii") {
        const charGroups = characters[selectedGame];
        const vehGroups = full_vehicles[selectedGame];
        const weights = Object.keys(charGroups);

        const weight = randomItem(weights);
        const character = randomItem(charGroups[weight]);
        const vehicle = randomItem(vehGroups[weight]);
        tempCombo = { type: "weight_class", character, vehicle };
        return tempCombo
    }

    if (["MK7", "MK8", "DX"].includes(selectedGame)) {
        const charList = characters[selectedGame];
        const bodyList = bodies[selectedGame];
        const wheelList = wheels[selectedGame];
        const gliderList = gliders[selectedGame];

        const character = randomItem(charList);
        const body = randomItem(bodyList);
        const wheelsPart = randomItem(wheelList);
        const glider = randomItem(gliderList);

        tempCombo = { type: "modular", character, body, wheels: wheelsPart, glider };
        return tempCombo
    }

    return null;
}

function renderPickedCombos(selectedGame, maxReached = false) {
    const disableRepicks = document.getElementById("disableRepicks").checked;
    if (!disableRepicks || combosPicked.length === 0) {
        pickedCombosList.innerHTML = "";
        return;
    }

    const reversed = combosPicked.slice().reverse();
    const content = reversed.map(renderComboText).join("<br>");

    pickedCombosList.innerHTML = `
        <div class="codeBoxTight">
            <b>${maxReached ? `Max ${["SNES", "N64", "GBA"].includes(selectedGame) ? "characters" : "combos"}! Please clear!` : `${["SNES", "N64", "GBA"].includes(selectedGame) ? "Picked characters": "Picked combos"} (${combosPicked.length} / ${getTotalCombos(selectedGame)})`}</b>
            <br><br>${content}
        </div>`;
}

function clearRepicks() {
    combosPicked = [];
    pickedCombosList.innerHTML = "";
    combosContainer.innerHTML = "Nothing picked";
}

function rerender() {
    let selectedGame = document.getElementById("game-select").value
    if (lastCombo) combosContainer.innerHTML = renderComboText(lastCombo);
    renderPickedCombos(selectedGame);
}

function changeText() {
    let selectedGame = document.getElementById("game-select").value
    if (["SNES", "N64", "GBA"].includes(selectedGame)){
        pickRandomComboButton.textContent = "Pick Character!"
    } else{
        pickRandomComboButton.textContent = "Pick Combo!"
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const tempLocale = localStorage.getItem("locale") || "en-GB";
    PALNamesCheckbox.checked = tempLocale === "en-GB";
});

document.getElementById("game-select").addEventListener("change", () => {
    clearRepicks();
    changeText();
});
pickRandomComboButton.addEventListener("click", pickRandomCombo);
clearRepicksButton.addEventListener("click", clearRepicks);
PALNamesCheckbox.addEventListener("click", rerender);
