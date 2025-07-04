/*
    This script generates the map seen on team pages. It places the
    positions of all team locations on the map.
*/

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

let loadedOnce = false;

let startTime;

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
    
    scale = newScale;

    updateTransform();
    // placeDots(); // Optional if dots need repositioning on zoom
}

function onPointerDown(e) {
    if (e.pointerType !== 'mouse') return;
    isPanning = true;
    startPan = {
        x: e.clientX - panX,
        y: e.clientY - panY,
    };
    wrapper.style.cursor = 'grabbing';
    container.style.transition = 'none';
}

function onPointerMove(e) {
    if (!isPanning || e.pointerType !== 'mouse') return;
    panX = e.clientX - startPan.x;
    panY = e.clientY - startPan.y;
    updateTransform();
}

function onPointerUp(e) {
    if (e && e.pointerType && e.pointerType !== 'mouse') return;
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

async function getTeamlocations() {
    console.debug(`%cmaprender.js %c> %cFetching teamlocations from the API...`, "color:#9452ff", "color:#fff", "color:#c29cff");
    return fetch('https://api.umkl.co.uk/teamlocations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
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

    let svg = container.querySelector('svg.dot-lines');
    if (svg) svg.remove(); // Remove existing lines

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('dot-lines');
    Object.assign(svg.style, {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
    });

    const { clientWidth: w, clientHeight: h } = mapImg;
    if (!w || !h) return;

    const fragment = document.createDocumentFragment();
    const labels = []; // To store label positions for collision detection

    coords.forEach(({ coords: [lat, lon], color, name }) => {
        const { x, y } = latLonToPixel(lat, lon, w, h);
        const dot = document.createElement('div');

        let isCurrentTeam = false;
        if (name === teamParam) isCurrentTeam = true;

        // Generate a unique class for each color
        const colorClass = `pulse-${color.replace('#', '')}`;
        dot.className = `dot pulse ${colorClass}`;
        const fadeDelay = isCurrentTeam ? 0 : (0.25 + Math.random() * 0.25).toFixed(3);
        Object.assign(dot.style, {
            backgroundColor: color,
            left: `${x - 5}px`,
            top: `${y - 5}px`,
            pointerEvents: 'auto',
            zIndex: isCurrentTeam ? 3 : 2, // Place selected team dot on top
            opacity: 0,
            animation: `dot-fade-in ${loadedOnce ? 0 : 0.5}s ease-in-out ${loadedOnce ? 0 : fadeDelay}s forwards, dot-pulse-${colorClass} ${isCurrentTeam ? '1.25' : '2.0'}s infinite`
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
        if (isCurrentTeam) {
            label.style.fontWeight = 'bold';
        }
        Object.assign(label.style, {
            opacity: 0,
            backgroundColor: `${color}${isCurrentTeam ? '50': '20'}`,
            animation: `dotLabelFadeIn-${colorClass} ${loadedOnce ? 0 : 0.5}s ease-in-out ${loadedOnce ? 0 : (parseFloat(fadeDelay) + ((name === teamParam) ? 0 : 0.25))}s forwards`
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
        const labelWidth = name.length * 8; // Approximate width based on character count
        const labelHeight = 24; // Approximate height
        
        // Possible positions to try (right, left, above, below, diagonals)
        const positions = [
            { left: x + 15, top: y - 11 }, // right (default)
            { left: x + 25, top: y - labelHeight + 4 }, // top-right
            { left: x - labelWidth - 34, top: y - 11 }, // left
            { left: x - labelWidth - 10, top: y - labelHeight + 4 }, // top-left
            { left: x - labelWidth - 10, top: y + 12 }, // bottom-left
            { left: x + 15, top: y + 12 }, // bottom-right
            { left: x - labelWidth / 2, top: y + 12 }, // below
            { left: x - labelWidth / 2, top: y - labelHeight - 8 }, // above
        ];

        // Find first position that doesn't collide with existing labels
        const foundPosition = positions.find(pos => {
            // Expand bounding box by 1.5x for collision detection
            const centerX = pos.left + labelWidth / 2;
            const centerY = pos.top + labelHeight / 2;
            const expandedWidth = labelWidth * 1.5;
            const expandedHeight = labelHeight * 1.2;
            const newLabelRect = {
                x: centerX - expandedWidth / 2,
                y: centerY - expandedHeight / 2,
                width: expandedWidth,
                height: expandedHeight
            };

            // Check against all existing labels
            return !labels.some(existingLabel =>
            !(
                newLabelRect.x > existingLabel.x + existingLabel.width ||
                newLabelRect.x + newLabelRect.width < existingLabel.x ||
                newLabelRect.y > existingLabel.y + existingLabel.height ||
                newLabelRect.y + newLabelRect.height < existingLabel.y
            )
            );
        });

        // Use found position or default to first position
        const finalPosition = foundPosition || positions[0];
        label.style.left = `${finalPosition.left}px`;
        label.style.top = `${finalPosition.top}px`;

        // Draw a line from dot to label center, with animation
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const labelCenterX = finalPosition.left + labelWidth / 2;
        const labelCenterY = finalPosition.top + labelHeight / 2;
        line.setAttribute('x1', x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', labelCenterX);
        line.setAttribute('y2', labelCenterY);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '1');
        const lineLength = Math.hypot(labelCenterX - x, labelCenterY - y);

        // Add line-draw animation CSS for this color if not already present
        if (!document.getElementById(`lineDrawFadeIn-${colorClass}`)) {
            const style = document.createElement('style');
            style.id = `lineDrawFadeIn-${colorClass}`;
            style.textContent = `
            @keyframes lineDrawFadeIn-${colorClass} {
                0% {
                    stroke-dashoffset: ${lineLength};
                    opacity: 0;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    stroke-dashoffset: 0;
                    opacity: ${isCurrentTeam ? '1' : '0.5'};
                }
            }`;
            document.head.appendChild(style);
        }

        line.setAttribute('stroke-dasharray', lineLength);
        line.setAttribute('stroke-dashoffset', lineLength);
        line.style.animation = `lineDrawFadeIn-${colorClass} ${loadedOnce ? 0 : 0.5}s ease-in-out ${loadedOnce ? 0 : fadeDelay - 0.1}s forwards`;
        svg.appendChild(line);

        // Store label position for future collision detection, with padding
        const padding = 6;
        labels.push({
            x: finalPosition.left - padding,
            y: finalPosition.top - padding,
            width: labelWidth + 2 * padding,
            height: labelHeight + 2 * padding
        });

        fragment.appendChild(label);
        fragment.appendChild(dot);
    });

    container.appendChild(svg);
    container.appendChild(fragment);

    loadedOnce = true;
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

function createZoomControls() {
    const controls = document.createElement('div');
    controls.className = 'zoom-controls';

    // Zoom In
    const zoomInBtn = document.createElement('button');
    zoomInBtn.innerHTML = '+';
    zoomInBtn.title = 'Zoom In';
    zoomInBtn.className = 'controls-button';
    zoomInBtn.addEventListener('click', () => {
        const zoomFactor = 1.2;
        const zoomStep = Math.sqrt(zoomFactor);
        const newScale = Math.min(maxScale, scale * zoomFactor);
        if (newScale !== scale) {
            scale = newScale;
            panX = panX * zoomStep;
            panY = panY * zoomStep;

            updateTransform();
            // placeDots();
        }
    });

    // Zoom Out
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.innerHTML = '-';
    zoomOutBtn.title = 'Zoom Out';
    zoomOutBtn.className = 'controls-button';
    zoomOutBtn.addEventListener('click', () => {
        const zoomFactor = 1 / 1.2;
        const zoomStep = Math.sqrt(zoomFactor);
        const newScale = Math.max(minScale, scale * zoomFactor);
        if (newScale !== scale) {
            scale = newScale;
            panX = panX * zoomStep;
            panY = panY * zoomStep;

            updateTransform();
            // placeDots();
        }
    });

    // Reset
    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = '⟳';
    resetBtn.title = 'Reset Zoom/Pan';
    resetBtn.className = 'controls-button';
    resetBtn.addEventListener('click', () => {
        scale = 1;
        panX = 0;
        panY = 0;
        updateTransform();
        // placeDots();
    });

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    controls.appendChild(resetBtn);

    // Add controls to wrapper
    wrapper.appendChild(controls);
}

document.addEventListener('DOMContentLoaded', async () => {
    startTime = performance.now();
    
    createZoomControls();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('team')) {
        teamParam = urlParams.get('team');
    }
    
    const teamLocations = await getTeamlocations("");
    coords = teamLocations
        .map(team => ({
            coords: team.coords,
            color: team.team_color,
            name: team.team_name
        }));
    placeDots();

    window.addEventListener('resize', () => {
        wrapper.style.width = window.frameElement.offsetWidth + 'px';

        updateTransform();
        placeDots();
    });

    console.debug(`%cmaprender.js %c> %cGenerated team info box in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#9452ff", "color:#fff", "color:#c29cff");
});