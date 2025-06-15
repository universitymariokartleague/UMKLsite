const mapImg = document.getElementById('worldMap');
const container = mapImg.parentElement;

const mapBounds = {
    minLat: 49.97, // Southern edge
    maxLat: 58.67193,   // Northern edge
    minLon: -8.64,  // Western edge
    maxLon: 1.73,    // Eastern edge
};

let coords = [];
let teamParam = "";

// Create a wrapper to hold the map and dots for zoom/pan
const wrapper = document.createElement('div');
wrapper.style.position = 'relative';
wrapper.style.width = container.clientWidth + 'px';
wrapper.style.height = container.clientHeight + 'px';
wrapper.style.touchAction = 'none'; // prevent default gestures on touch devices

// Move mapImg and existing dots container inside wrapper
container.style.position = 'relative';
container.parentElement.insertBefore(wrapper, container);
wrapper.appendChild(container);

let currentSeason = 2;
let maxSeason = currentSeason;

// Variables to track zoom and pan state
let scale = 1;
let minScale = 1;
let maxScale = 5;
let panX = 0;
let panY = 0;

let isPanning = false;
let startPan = { x: 0, y: 0 };

// Function to apply CSS transform for pan and zoom
function updateTransform() {
    container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function onWheel(e) {
    e.preventDefault();

    const zoomFactor = 0.1;
    const scaleDelta = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
    const newScale = Math.min(maxScale, Math.max(minScale, scale * scaleDelta));

    if (newScale === scale) return;

    // Get mouse position relative to the wrapper (screen space)
    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate position in map coordinates (content space)
    const contentX = (mouseX - panX) / scale;
    const contentY = (mouseY - panY) / scale;

    // Update scale
    scale = newScale;

    // Update pan so that the content under the cursor stays under the cursor
    panX = mouseX - contentX * scale;
    panY = mouseY - contentY * scale;

    updateTransform();
    placeDots();
}


// Mouse down to start pan
function onPointerDown(e) {
    isPanning = true;
    startPan = {
        x: e.clientX - panX,
        y: e.clientY - panY,
    };
    wrapper.style.cursor = 'grabbing';
    container.style.transition = 'none';
}

// Mouse move to pan
function onPointerMove(e) {
    if (!isPanning) return;
    panX = e.clientX - startPan.x;
    panY = e.clientY - startPan.y;
    updateTransform();
}

// Mouse up to stop pan
function onPointerUp() {
    isPanning = false;
    wrapper.style.cursor = 'default';
    container.style.transition = 'transform 0.2s ease'; 
}

// Touch support for panning and zooming (basic)
let lastTouchDist = null;

function getTouchDistance(touches) {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(e) {
    if (e.touches.length === 1) {
        isPanning = true;
        startPan = {
            x: e.touches[0].clientX - panX,
            y: e.touches[0].clientY - panY,
        };
    } else if (e.touches.length === 2) {
        lastTouchDist = getTouchDistance(e.touches);
    }
}

function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning) {
        panX = e.touches[0].clientX - startPan.x;
        panY = e.touches[0].clientY - startPan.y;
        updateTransform();
    } else if (e.touches.length === 2) {
        const newDist = getTouchDistance(e.touches);
        if (lastTouchDist) {
            const delta = newDist / lastTouchDist;
            const newScale = Math.min(maxScale, Math.max(minScale, scale * delta));
            scale = newScale;
            updateTransform();
        }
        lastTouchDist = newDist;
    }
}

function onTouchEnd(e) {
    if (e.touches.length === 0) {
        isPanning = false;
        lastTouchDist = null;
    }
}

// Attach event listeners for zoom and pan
wrapper.addEventListener('wheel', onWheel, { passive: false });
wrapper.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointercancel', onPointerUp);

wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
wrapper.addEventListener('touchend', onTouchEnd);
wrapper.addEventListener('touchcancel', onTouchEnd);

// Your existing fetching and dot placing code below...

async function getTeamdata(team = "", season) {
    console.debug(`%cmaprender.js %c> %cFetching teamdata from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
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

function placeDots() {
    container.querySelectorAll('.dot, .dot-label').forEach(el => el.remove());

    const { clientWidth: w, clientHeight: h } = mapImg;
    if (!w || !h) return;

    const fragment = document.createDocumentFragment();
    const labels = []; // To store label positions for collision detection

    coords.forEach(({ coords: [lat, lon], color, name }) => {
        const { x, y } = latLonToPixel(lat, lon, w, h);
        const dot = document.createElement('div');
        // Generate a unique class for each color
        const colorClass = `pulse-${color.replace('#', '')}`;
        dot.className = `dot pulse ${colorClass}`;
        const fadeDelay = (name === teamParam) ? 0 : (0.25 + Math.random() * 0.25).toFixed(3);
        Object.assign(dot.style, {
            backgroundColor: color,
            left: `${x - 5}px`,
            top: `${y - 5}px`,
            pointerEvents: 'auto',
            zIndex: name === teamParam ? 3 : 2, // Place selected team dot on top
            opacity: 0,
            animation: `dot-fade-in 0.5s ease-in-out ${fadeDelay}s forwards, dot-pulse-${colorClass} 2.0s infinite`
        });

        // Add fade-in animation CSS if not already present
        if (!document.getElementById('dot-fade-in-style')) {
            const style = document.createElement('style');
            style.id = 'dot-fade-in-style';
            style.textContent = `
            @keyframes dot-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            `;
            document.head.appendChild(style);
        }

        // Add pulsing animation CSS for this color if not already present
        if (!document.getElementById(`dot-pulse-style-${colorClass}`)) {
            const style = document.createElement('style');
            style.id = `dot-pulse-style-${colorClass}`;
            style.textContent = `
            @keyframes dot-pulse-${colorClass} {
                0% {
                box-shadow: 0 0 0 0 ${color}B3;
                }
                70% {
                box-shadow: 0 0 0 8px ${color}00;
                }
                100% {
                box-shadow: 0 0 0 0 ${color}00;
                }
            }
            `;
            document.head.appendChild(style);
        }

        // Create label with collision detection
        const label = document.createElement('div');
        label.className = 'dot-label';
        label.textContent = name;
        label.dataset.dotLabel = '1';
        if (name === teamParam) {
            label.style.fontWeight = 'bold';
        }
        Object.assign(label.style, {
            opacity: 0,
            animation: `dotLabelFadeIn-${colorClass} 0.5s ease-in-out ${parseFloat(fadeDelay) + ((name === teamParam) ? 0 : 0.25)}s forwards`
        });

        // Add dotLabelFadeIn animation CSS for this color if not already present
        if (!document.getElementById(`dotLabelFadeIn-${colorClass}`)) {
            const style = document.createElement('style');
            style.id = `dotLabelFadeIn-${colorClass}`;
            style.textContent = `
            @keyframes dotLabelFadeIn-${colorClass} {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            `;
            document.head.appendChild(style);
        }

        // Try different positions until we find one that doesn't collide
        const labelWidth = name.length * 8 + 12; // Approximate width based on character count
        const labelHeight = 24; // Approximate height
        
        // Possible positions to try (right, left, above, below)
        const positions = [
            { left: x + 12, top: y - 12 }, // right (default)
            { left: x - labelWidth - 12, top: y - 12 }, // left
            { left: x - labelWidth / 2, top: y - labelHeight - 8 }, // above
            { left: x - labelWidth / 2, top: y + 12 } // below
        ];

        // Find first position that doesn't collide with existing labels
        const foundPosition = positions.find(pos => {
            const newLabelRect = {
                x: pos.left,
                y: pos.top,
                width: labelWidth,
                height: labelHeight
            };
            
            // Check against all existing labels
            return !labels.some(existingLabel => 
                !(newLabelRect.x > existingLabel.x + existingLabel.width ||
                  newLabelRect.x + newLabelRect.width < existingLabel.x ||
                  newLabelRect.y > existingLabel.y + existingLabel.height ||
                  newLabelRect.y + newLabelRect.height < existingLabel.y)
            );
        });

        // Use found position or default to first position
        const finalPosition = foundPosition || positions[0];
        label.style.left = `${finalPosition.left}px`;
        label.style.top = `${finalPosition.top}px`;

        // Store label position for future collision detection
        labels.push({
            x: finalPosition.left,
            y: finalPosition.top,
            width: labelWidth,
            height: labelHeight
        });

        fragment.appendChild(label);
        fragment.appendChild(dot);
    });

    container.appendChild(fragment);
}

// Mercator projection conversion
function latLonToPixel(lat, lon, width, height) {
    const { minLon, maxLon, minLat, maxLat } = mapBounds;

    const x = ((lon - minLon) / (maxLon - minLon)) * width;

    // Convert latitudes to Mercator Y
    const latRad = lat * Math.PI / 180;
    const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));

    const mercMin = Math.log(Math.tan(Math.PI / 4 + (minLat * Math.PI / 180) / 2));
    const mercMax = Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI / 180) / 2));

    const y = ((mercMax - mercY) / (mercMax - mercMin)) * height;

    return { x, y };
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('team')) {
        teamParam = urlParams.get('team');
    }

    const teamData = await getTeamdata("");

    // Extract valid coordinates and team color
    coords = teamData
        .filter(team => Array.isArray(team.coords) && team.coords.length === 2 && team.team_color)
        .map(team => ({
            coords: team.coords,
            color: team.team_color,
            name: team.team_name
        }));

    // Place dots when image is loaded
    if (mapImg.complete && mapImg.naturalWidth !== 0) {
        placeDots();
    } else {
        mapImg.addEventListener('load', placeDots, { once: true });
    }

    window.addEventListener('resize', () => {
        placeDots();
    });
});
