const mapImg = document.getElementById('worldMap');
const container = mapImg.parentElement;

const mapBounds = {
    minLat: 49.97, // Southern edge
    maxLat: 60.83,   // Northern edge
    minLon: -8.64,  // Western edge (e.g., Ireland)
    maxLon: 1.73,    // Eastern edge
};

let coords = [];

// Create a wrapper to hold the map and dots for zoom/pan
const wrapper = document.createElement('div');
wrapper.style.position = 'relative';
wrapper.style.overflow = 'hidden';
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
let maxScale = 20;
let panX = 0;
let panY = 0;

let isPanning = false;
let startPan = { x: 0, y: 0 };

// Function to apply CSS transform for pan and zoom
function updateTransform() {
    container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

// Zoom handler for mouse wheel
function onWheel(e) {
    e.preventDefault();

    // Zoom step factor
    const zoomFactor = 0.1;
    const delta = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
    const newScale = Math.min(maxScale, Math.max(minScale, scale * delta));

    if (newScale === scale) return; // no change

    // Calculate the mouse position relative to the container
    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate how pan should change to zoom towards mouse pointer
    panX = mouseX - ((mouseX - panX) * (newScale / scale));
    panY = mouseY - ((mouseY - panY) * (newScale / scale));

    scale = newScale;
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
    // Remove existing dots
    container.querySelectorAll('.dot').forEach(dot => dot.remove());

    const { clientWidth: w, clientHeight: h } = mapImg;
    if (!w || !h) return;

    console.log(scale)

    const fragment = document.createDocumentFragment();
    coords.forEach(([lat, lon]) => {
        const { x, y } = latLonToPixel(lat, lon, w, h);
        const dot = document.createElement('div');
        dot.className = 'dot';
        Object.assign(dot.style, {
            position: 'absolute',
            width: `${5}px`,
            height: `${5}px`,
            borderRadius: '50%',
            backgroundColor: 'red',
            left: `${x - 1}px`,
            top: `${y}px`,
            pointerEvents: 'none'
        });
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
    const teamData = await getTeamdata("");

    // Extract valid coordinates
    coords = teamData
        .filter(team => Array.isArray(team.coords) && team.coords.length === 2)
        .map(team => team.coords);

    // Place dots when image is loaded
    if (mapImg.complete && mapImg.naturalWidth !== 0) {
        placeDots();
    } else {
        mapImg.addEventListener('load', placeDots, { once: true });
    }

    window.addEventListener('resize', () => {
        placeDots();
        // Optionally reset pan and zoom on resize
        // scale = 1; panX = 0; panY = 0; updateTransform();
    });
});
