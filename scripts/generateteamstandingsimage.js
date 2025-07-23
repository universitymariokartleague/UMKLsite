/*
    This script is unused. It generates UMKL standing images client side.
*/

const JSImagegen = document.getElementById("JSImagegen");
let startTime;
let currentSeason;

// Constants
const TEAM_ICON_DIR = "assets/media/teamemblems/";
const DEFAULT_FONT = "SF-Pro-Display-Bold";
const DEFAULT_FONT_HEAVY = "SF-Pro-Display-Black";
const TITLE_COLOR = "#ffffff";
const ACCENT_COLOR = "#bc0839";

// Helper functions
async function loadFonts() {
    try {
        await Promise.all([
            loadFont('SF-Pro-Display-Bold', 'assets/pythongraphics/fonts/SF-Pro/SF-Pro-Display-Bold.otf'),
            loadFont('SF-Pro-Display-Black', 'assets/pythongraphics/fonts/SF-Pro/SF-Pro-Display-Black.otf')
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
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

function addText(ctx, text, pos, font, size, color, anchor = "left", spacing = 5) {
    ctx.font = `${size}px "${font}"`;
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";

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

// Main function
async function createTeamStandingsImage(seasonId, isCurrentSeason, teamStandingsData) {
    // Load required assets
    await loadFonts();

    // Constants
    const TITLE_POSITION = [200, 125];
    const TITLE_FONT_SIZE = 60;
    const INIT_POS = [200, 240];
    const TEAM_ICON_SIZE = [72, 72];
    const TEAM_COLOR_BOX_SIZE = [18, 72];
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
        const bgImg = await loadImage('assets/pythongraphics/graphics/teamstandingbgtall.png');
        ctx.drawImage(bgImg, 0, 0);
    } catch (error) {
        console.error('Background image failed to load:', error);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Add title
    addText(ctx, `SEASON ${seasonId}`, [TITLE_POSITION[0], TITLE_POSITION[1] - 55], 
           DEFAULT_FONT, TITLE_FONT_SIZE - 15, TITLE_COLOR, "l");
    addText(ctx, "TEAM STANDINGS", TITLE_POSITION, 
           DEFAULT_FONT, TITLE_FONT_SIZE, TITLE_COLOR, "l");

    // Add timestamp or season status
    const timestamp = new Date().toLocaleDateString('en-GB');
    if (isCurrentSeason) {
        addText(ctx, `Standings as of\n${timestamp}`, [TITLE_POSITION[0] + 1220, TITLE_POSITION[1] - 80], 
               DEFAULT_FONT, TITLE_FONT_SIZE - 35, TITLE_COLOR, "r");
    } else {
        addText(ctx, "This season\nhas concluded", [TITLE_POSITION[0] + 1220, TITLE_POSITION[1] - 80], 
               DEFAULT_FONT, TITLE_FONT_SIZE - 35, TITLE_COLOR, "r");
    }

    // Draw team standings
    for (let i = 0; i < Math.min(teamStandingsData.length, MAX_TEAMS); i++) {
        const team = teamStandingsData[i];
        const teamId = team.team_id;
        const currentPoints = await getTeamSeasonPoints(teamId, currentSeason);

        // In a real implementation, you would fetch these from your data source
        const teamData = {
            name: team.team_name, // Replace with actual data
            color: team.team_color   // Replace with actual data
        };

        // Add position marker
        addText(ctx, `${i+1}`, [INIT_POS[0] - POSITION_OFFSET, INIT_POS[1] - 4], 
               DEFAULT_FONT, 52, TITLE_COLOR, "m");

        // Add team name
        addText(ctx, teamData.name.toUpperCase(), [INIT_POS[0] + TEAM_NAME_OFFSET, INIT_POS[1]], 
               DEFAULT_FONT, 60, ACCENT_COLOR, "l");

        // Add team emblem
        try {
            const emblemPath = `${TEAM_ICON_DIR}${teamData.name.toUpperCase()}.png`;
            const icon = await loadImage(emblemPath);
            ctx.drawImage(icon, INIT_POS[0] - 35, INIT_POS[1] - 57, TEAM_ICON_SIZE[0], TEAM_ICON_SIZE[1]);
        } catch (error) {
            console.error('Team emblem failed to load:', error);
        }

        // Add team color box
        drawRoundedRect(ctx, INIT_POS[0] - 70, INIT_POS[1] - 58, 
                       TEAM_COLOR_BOX_SIZE[0], TEAM_COLOR_BOX_SIZE[1], 7, teamData.color);
        
        // Add points
        addText(ctx, `${currentPoints}`, [INIT_POS[0] + POINTS_X_OFFSET, INIT_POS[1] + POINTS_Y_OFFSET], 
               DEFAULT_FONT, 50, ACCENT_COLOR, "r");

        // Add match counter
        const matches = await getTeamMatchesPlayed(teamId, seasonId); // Replace with actual data
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

    return croppedCanvas.toDataURL('image/png');
}

// Usage example
async function generateAndDisplayStandings() {
    currentSeason = await getCurrentSeason();
    let teamStandings = await getSeasonTeamStandings(currentSeason);
    
    try {
        const imageUrl = await createTeamStandingsImage(currentSeason, true, teamStandings);
        JSImagegen.innerHTML = `<img class="image" src="${imageUrl}" alt="Team Standings">`;
    } catch (error) {
        console.error('Failed to generate standings:', error);
        JSImagegen.innerHTML = '<p>Error generating standings image</p>';
    }

    document.getElementById("timeTook").innerHTML = `${(performance.now() - startTime).toFixed(2)}ms`
    console.debug(`%cgenerateteamstandingsimage.js %c> %cGenerated team standings ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    await generateAndDisplayStandings();
});