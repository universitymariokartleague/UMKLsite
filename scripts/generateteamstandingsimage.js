/*
    This script is used to generate standing images for the share button 
    on the teams page.
*/
export { generateTeamStandingsImage };

let startTime;
let currentSeason;

// Constants
const TEAM_ICON_DIR = "assets/media/teamemblems/";
const DEFAULT_FONT = "SF-Pro-Display-Bold";
const DEFAULT_FONT_HEAVY = "SF-Pro-Display-Black";

async function getCurrentSeason() {
    return fetch('https://api.umkl.co.uk/seasoninfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            season: 0
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

async function getTeamdata(team = "", season) {
    console.debug(`%cteamboxgenerate.js %c> %cFetching teamdata from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetch('https://api.umkl.co.uk/teamdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            team: `${team}`,
            season: `${season}`
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

async function loadFonts() {
    try {
        await Promise.all([
            loadFont('SF-Pro-Display-Bold', 'assets/canvas/fonts/SF-Pro/SF-Pro-Display-Bold.otf'),
            loadFont('SF-Pro-Display-Black', 'assets/canvas/fonts/SF-Pro/SF-Pro-Display-Black.otf')
        ]);
    } catch (error) {
        console.error('Failed to load fonts:', error);
    }
}

async function loadFont(name, url) {
    const font = new FontFace(name, `url(${url})`);
    await font.load();
    document.fonts.add(font);
    return font;
}

async function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => img.src = 'assets/media/teamemblems/default.png'
        img.src = url;
    });
}

function addText(ctx, text, pos, font, size, color, anchor = "left", spacing = 5, shadow = false) {
    ctx.font = `${size}px "${font}"`;
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";

    if (shadow) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
    } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // Handle anchor positioning
    let x = pos[0];
    let y = pos[1];
    const metrics = ctx.measureText(text);

    if (anchor.includes("m")) { // middle alignment
        x -= metrics.width / 2;
    } 
    else if (anchor.includes("r")) { // right alignment
        x -= metrics.width;
    }

    // Handle multi-line text
    if (text.includes("\n")) {
        const lines = text.split("\n");
        const lineHeight = size * 1; // Approximate line height
        
        for (const line of lines) {
            const lineMetrics = ctx.measureText(line);
            let lineX = x;
            
            if (anchor.includes("m")) {
                lineX -= lineMetrics.width / 2;
            } 
            else if (anchor.includes("r")) {
                lineX -= lineMetrics.width;
            }
            
            ctx.fillText(line, lineX, y);
            y += lineHeight + spacing;
        }
    } else {
        ctx.fillText(text, x, y);
    }

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke, strokeWidth = 0) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }

    if (stroke && strokeWidth > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
}

async function createTeamStandingsImage(season, isCurrentSeason, teamStandingsData) {
    await loadFonts();

    // Constants
    const TITLE_POSITION = [200, 126];
    const TITLE_FONT_SIZE = 60;
    const TITLE_COLOR = "#ffffff";
    const ACCENT_COLOR = "#bc0839";
    const INIT_POS = [200, 239];
    const TEAM_ICON_SIZE = [72, 72];
    const TEAM_COLOR_BOX_SIZE = [19, 73];
    const POINTS_X_OFFSET = 865;
    const POINTS_Y_OFFSET = -15;
    const TEAM_NAME_OFFSET = 55;
    const POSITION_OFFSET = 118;
    const MAX_TEAMS = 20;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1125;
    canvas.height = 3000; // Start with max height, crop later
    const ctx = canvas.getContext('2d');

    // Load and draw background
    try {
        const bgImg = await loadImage('assets/canvas/graphics/teamstandingbgtall.png');
        ctx.drawImage(bgImg, 0, 0);
    } catch (error) {
        console.error('Background image failed to load:', error);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Add title
    addText(ctx, `SEASON ${season}`, [TITLE_POSITION[0], TITLE_POSITION[1] - 55], 
           DEFAULT_FONT, TITLE_FONT_SIZE - 15, TITLE_COLOR, "l", 5, true);
    addText(ctx, "TEAM STANDINGS", TITLE_POSITION, 
           DEFAULT_FONT, TITLE_FONT_SIZE, TITLE_COLOR, "l", 5, true);

    // Add timestamp or season status
    drawRoundedRect(ctx, TITLE_POSITION[0] + 562.5, TITLE_POSITION[1] - 110, 
                345, 45, 12, TITLE_COLOR);
    const timestamp = new Date().toLocaleDateString('en-GB');
    if (isCurrentSeason) {
        addText(ctx, `Standings as of ${timestamp}`, [TITLE_POSITION[0] + 735, TITLE_POSITION[1] - 79], 
               DEFAULT_FONT, TITLE_FONT_SIZE - 35, ACCENT_COLOR, "m");
    } else {
        addText(ctx, "This season has concluded", [TITLE_POSITION[0] + 735, TITLE_POSITION[1] - 79], 
               DEFAULT_FONT, TITLE_FONT_SIZE - 35, ACCENT_COLOR, "m");
    }

    // Draw team standings
    for (let i = 0; i < Math.min(teamStandingsData.length, MAX_TEAMS); i++) {
        const teamdata = teamStandingsData[i];

        // Add position marker
        addText(ctx, `${i+1}`, [INIT_POS[0] - POSITION_OFFSET, INIT_POS[1] - 4], 
               DEFAULT_FONT, 52, TITLE_COLOR, "m");

        // Add team name
        addText(ctx, teamdata.team_name.toUpperCase(), [INIT_POS[0] + TEAM_NAME_OFFSET, INIT_POS[1]], 
               DEFAULT_FONT, 60, ACCENT_COLOR, "l");

        // Add team emblem
        try {
            const emblemPath = `${TEAM_ICON_DIR}${teamdata.team_name.toUpperCase()}.png`;
            const icon = await loadImage(emblemPath);
            ctx.drawImage(icon, INIT_POS[0] - 35, INIT_POS[1] - 57, TEAM_ICON_SIZE[0], TEAM_ICON_SIZE[1]);
        } catch (error) {
            console.error('Team emblem failed to load:', error);
        }

        // Add team color box
        drawRoundedRect(ctx, INIT_POS[0] - 70, INIT_POS[1] - 57, 
                       TEAM_COLOR_BOX_SIZE[0], TEAM_COLOR_BOX_SIZE[1], 8, teamdata.team_color);
        
        // Add points
        addText(ctx, `${teamdata.team_season_points}`, [INIT_POS[0] + POINTS_X_OFFSET, INIT_POS[1] + POINTS_Y_OFFSET], 
               DEFAULT_FONT, 50, ACCENT_COLOR, "r");

        // Add match counter
        const matches = teamdata.season_matches_played;
        const matchText = `${matches} ${matches === 1 ? 'match' : 'matches'}`.toUpperCase();
        addText(ctx, matchText, [INIT_POS[0] + POINTS_X_OFFSET, INIT_POS[1] + 10], 
               DEFAULT_FONT, 20, ACCENT_COLOR, "r");

        // Update Y position for next team
        INIT_POS[1] += POSITION_OFFSET;
    }
    
    // Calculate final height and crop
    const finalHeight = POSITION_OFFSET * Math.min(teamStandingsData.length, MAX_TEAMS) + 166;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = 1125;
    croppedCanvas.height = finalHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(canvas, 0, 0, 1125, finalHeight, 0, 0, 1125, finalHeight);

    // Convert to Blob and return
    return new Promise((resolve) => {
        croppedCanvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}

async function generateTeamStandingsImage() {
    startTime = performance.now();

    currentSeason = (await getCurrentSeason())[0];
    let teamStandings = await getTeamdata("", currentSeason);

    console.debug(`%cgenerateteamstandingsimage.js %c> %cGenerated team standings ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
    return createTeamStandingsImage(currentSeason, true, teamStandings)
}