/*
    Used on the team creation guidelines page to show the current team colors.
*/

const canvas = document.getElementById("colorWheel");
const ctx = canvas.getContext("2d");

const dpr = 2;
const cssWidth = 350;
const cssHeight = 275;

canvas.style.width = cssWidth + "px";
canvas.style.height = cssHeight + "px";

canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;

ctx.scale(dpr, dpr);

const centerX = cssWidth / 2;
const centerY = cssHeight / 2;
const radius = 100;

let teamColors = [];

async function getTeamcolors() {
    return fetch('https://api.umkl.co.uk/teamcolors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: "{}"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
            localStorage.setItem("apiReqsSent", apiReqsSent + 1)
            return response.json();
        });
}

// Helper: Convert hex to HSL hue
function hexToHue(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h;

    if (max === min) {
        h = 0;
    } else if (max === r) {
        h = (60 * ((g - b) / (max - min)) + 360) % 360;
    } else if (max === g) {
        h = (60 * ((b - r) / (max - min)) + 120) % 360;
    } else {
        h = (60 * ((r - g) / (max - min)) + 240) % 360;
    }

    return h;
}

const labelFont = "12px Montserrat";
const lineHeight = 14;

function resolveLabelOverlaps(labels) {
    for (let pass = 0; pass < 100; pass++) {
        let moved = false;
        labels.sort((a, b) => a.y - b.y);

        for (let i = 0; i < labels.length; i++) {
            for (let j = i + 1; j < labels.length; j++) {
                const a = labels[i];
                const b = labels[j];
                const gap = b.y - a.y;
                if (gap >= lineHeight) break;
                if (a.left >= b.right || b.left >= a.right) continue;

                const push = (lineHeight - gap) / 2;
                a.y -= push;
                b.y += push;
                moved = true;
            }
        }

        for (const label of labels) {
            label.y = Math.min(Math.max(label.y, lineHeight / 2), cssHeight - lineHeight / 2);
        }

        if (!moved) break;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    teamColors = await getTeamcolors();
    await document.fonts.load(labelFont);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = labelFont;
    const labels = [];

    for (const team of teamColors) {
        const hex = team.team_color;
        const hue = hexToHue(hex);

        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const isGrey = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(b - r) < 15;
        let distance = isGrey ? radius * 0.2 : radius;

        const angle = (hue * Math.PI) / 180;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = hex;
        ctx.fill();

        const textOffset = 15;
        const textX = centerX + (distance + textOffset) * Math.cos(angle);
        const textY = centerY + (distance + textOffset) * Math.sin(angle);

        const align = angle > Math.PI / 2 && angle < 3 * Math.PI / 2 ? "right" : "left";
        const width = ctx.measureText(team.team_name).width;
        const left = align === "right" ? textX - width : textX;

        labels.push({
            name: team.team_name,
            hex,
            align,
            x: textX,
            y: textY,
            originY: textY,
            dotX: x,
            dotY: y,
            left,
            right: left + width,
        });
    }

    resolveLabelOverlaps(labels);

    for (const label of labels) {
        if (Math.abs(label.y - label.originY) > 2) {
            ctx.beginPath();
            ctx.moveTo(label.dotX, label.dotY);
            ctx.lineTo(label.x, label.y);
            ctx.strokeStyle = label.hex;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = label.hex;
        ctx.textAlign = label.align;
        ctx.textBaseline = "middle";
        ctx.shadowColor = label.hex;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 10;
        ctx.fillText(label.name, label.x, label.y);

        // Reset shadow to avoid affecting other drawings
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
    }
});
