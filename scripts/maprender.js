/*
    This script generates the map seen on team pages. It places the
    positions of all team locations on the map.
*/

const mapImg = document.getElementById('UKMap');
const container = mapImg.parentElement;

const mapBounds = {
    minLat: 49.97, // Southern edge
    maxLat: 60.86088,   // Northern edge
    minLon: -8.64,  // Western edge
    maxLon: 1.73,    // Eastern edge
};

let teamLocations = [];
let coords = [];
let teamParam = "";
let loadedOnce = false;
let startTime;

// Wrapper to hold the map and dots for zoom/pan
const wrapper = document.createElement('div');
wrapper.style.position = 'relative';
wrapper.style.width = container.clientWidth + 'px';
wrapper.style.height = container.clientHeight + 'px';
wrapper.style.touchAction = 'none';
container.style.position = 'relative';
container.parentElement.insertBefore(wrapper, container);
wrapper.appendChild(container);

function getIframeSize() {
    if (window.frameElement) {
        return {
            width: window.frameElement.offsetWidth,
            height: window.frameElement.offsetHeight
        };
    }
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

// Variables to track zoom and pan state
const DEFAULT_SCALE = 1;
const DEFAULT_PAN_X = 0;
const basePanY = Math.round(
    -150 + (getIframeSize().height - 538) / (576 - 538) * (-112 + 150)
);
const DEFAULT_PAN_Y = top.innerWidth < 767 ? (basePanY + 90) / 2 : basePanY;

let scale = DEFAULT_SCALE;
let panX = DEFAULT_PAN_X;
let panY = DEFAULT_PAN_Y;
let minScale = 1;
let maxScale = 1;
let isPanning = false;
let startPan = { x: 0, y: 0 };
let lastTouchDist = null;

function clampPan() {
    const { clientWidth, clientHeight } = container;
    const maxPanX = (clientWidth * (scale - 1)) / 2 + 250;
    const maxPanY = (clientHeight * (scale - 1)) / 2 + 300;

    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
}

function updateTransform() {
    clampPan();
    container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function getTouchDistance(touches) {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function injectStyle(id, css) {
    if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }
}

function onWheel(e) {
    e.preventDefault();

    const rect = wrapper.getBoundingClientRect(); // use wrapper, not container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 0.1;
    const scaleDelta = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
    const newScale = Math.min(maxScale, Math.max(minScale, scale * scaleDelta));

    if (newScale !== scale) {
        const scaleRatio = newScale / scale;

        // Adjust pan relative to cursor, in wrapper coordinates
        panX = mouseX - (mouseX - panX) * scaleRatio;
        panY = mouseY - (mouseY - panY) * scaleRatio;

        scale = newScale;
        updateTransform();
    }
}

function onPointerDown(e) {
    if (e.pointerType !== 'mouse') return;
    isPanning = true;
    startPan = { x: e.clientX - panX, y: e.clientY - panY };
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
    container.style.transition = 'transform 0.15s ease';
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
            if (newScale !== scale) {
                const rect = container.getBoundingClientRect();
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

                const scaleRatio = newScale / scale;
                panX = midX - (midX - panX) * scaleRatio;
                panY = midY - (midY - panY) * scaleRatio;

                scale = newScale;
                updateTransform();
            }
        }
        lastTouchDist = newDist;
    }
}

function onTouchEnd() {
    isPanning = false;
    lastTouchDist = null;
}

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
        const apiReqsSent = parseInt(localStorage.getItem("apiReqsSent")) || 0;
        localStorage.setItem("apiReqsSent", apiReqsSent + 1)
        return response.json();
    });
}

async function getTeamlocationsFallback() {
    const response = await fetch(`database/teamlocationsfallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function latLonToPixel(lat, lon, width, height) {
    const { minLon, maxLon, minLat, maxLat } = mapBounds;

    const x = ((lon - minLon) / (maxLon - minLon)) * width;

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

    const makeBtn = (iconClass, title, onClick) => {
        const btn = document.createElement('button');
        const icon = document.createElement('i');
        icon.className = iconClass;
        btn.appendChild(icon);

        btn.title = title;
        btn.className = 'controls-button';
        btn.addEventListener('click', onClick);
        return btn;
    };

    // controls.appendChild(makeBtn('+', 'Zoom In', () => {
    //     scale = Math.min(maxScale, scale * 1.2);
    //     updateTransform();
    // }));

    // controls.appendChild(makeBtn('-', 'Zoom Out', () => {
    //     scale = Math.max(minScale, scale / 1.2);
    //     updateTransform();
    // }));

    controls.appendChild(makeBtn(`fa-solid fa-refresh`, 'Reset map position', () => {
        scale = DEFAULT_SCALE;
        panX = DEFAULT_PAN_X;
        panY = DEFAULT_PAN_Y;
        updateTransform();
    }));

    wrapper.appendChild(controls);
}

function placeDots() {
    // Remove existing dots
    const existingElements = container.querySelectorAll('.dot, .dot-label, svg.dot-lines');
    existingElements.forEach(el => el.remove());

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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
    const dotPositions = [];
    const dotBoxes = [];
    const labels = [];

    // Inject shared fade-in animation once
    injectStyle('dot-fade-in-style', `
        @keyframes dot-fade-in { from { opacity: 0; } to { opacity: 1; } }
    `);

    coords.forEach(({ coords: [lat, lon], color, name }) => {
        const { x, y } = latLonToPixel(lat, lon, w, h);
        const isCurrentTeam = name === teamParam;
        const colorClass = `pulse-${color.replace('#', '')}`;
        const fadeDelay = isCurrentTeam ? 0 : (0.25 + Math.random() * 0.25).toFixed(3);

        // Dot
        const dot = document.createElement('div');
        dot.className = `dot pulse ${colorClass}`;
        Object.assign(dot.style, {
            backgroundColor: color,
            left: `${x - 5}px`,
            top: `${y - 5}px`,
            pointerEvents: 'auto',
            zIndex: isCurrentTeam ? 3 : 2,
            opacity: 0,
            animation: `dot-fade-in ${loadedOnce ? 0 : 0.5}s ease-in-out ${loadedOnce ? 0 : fadeDelay}s forwards, dot-pulse-${colorClass} ${isCurrentTeam ? '1.25' : '2.0'}s infinite`
        });
        fragment.appendChild(dot);

        // Dot pulse animation CSS
        injectStyle(`dot-pulse-style-${colorClass}`, `
            @keyframes dot-pulse-${colorClass} {
                0% { box-shadow: 0 0 0 0 ${color}B3; }
                70% { box-shadow: 0 0 0 8px ${color}00; }
                100% { box-shadow: 0 0 0 0 ${color}00; }
            }
        `);

        dotPositions.push({ x, y, color, name, isCurrentTeam, colorClass, fadeDelay });
        dotBoxes.push({ x: x - 8, y: y - 8, width: 12, height: 12 });
    });

    // Place labels with collision detection
    dotPositions.forEach(({ x, y, color, name, isCurrentTeam, colorClass, fadeDelay }, dotIdx) => {
        const label = document.createElement('div');
        label.translate = false;
        label.className = 'dot-label';
        label.textContent = name;
        if (isCurrentTeam) label.style.fontWeight = 'bold';

        Object.assign(label.style, {
            opacity: 0,
            backgroundColor: `${color}${isCurrentTeam ? '60' : '40'}`,
            animation: `dotLabelFadeIn-${colorClass} ${loadedOnce ? 0 : 0.5}s ease-in-out ${loadedOnce ? 0 : (parseFloat(fadeDelay) + ((name === teamParam) ? 0 : 0.25))}s forwards`
        });

        injectStyle(`dotLabelFadeIn-${colorClass}`, `
            @keyframes dotLabelFadeIn-${colorClass} {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `);

        // Candidate positions for label
        const labelWidth = name.length * 10;
        const labelHeight = 24;
        const positions = [
            { left: x + 15, top: y - 11 },
            { left: x + 25, top: y - labelHeight + 4 },
            { left: x - labelWidth - 34, top: y - 11 },
            { left: x - labelWidth - 10, top: y - labelHeight + 4 },
            { left: x - labelWidth - 10, top: y + 12 },
            { left: x + 15, top: y + 12 },
            { left: x - labelWidth / 2, top: y + 12 },
            { left: x - labelWidth / 2, top: y - labelHeight - 8 }
        ];

        // Add spiral positions around dot
        const ringCount = 10, radiusStep = 20, degreesPerCircle = 360, angleStep = 1;
        for (let r = 2; r <= ringCount; r++) {
            const radius = r * radiusStep;
            for (let deg = 0; deg < degreesPerCircle; deg += angleStep) {
                const angleRad = deg * Math.PI / 180;
                const offsetX = radius * Math.cos(angleRad);
                const offsetY = radius * Math.sin(angleRad);
                if (x + offsetX - labelWidth / 2 < 280) positions.push({
                    left: x + offsetX - labelWidth / 2,
                    top: y + offsetY - labelHeight / 2
                });
            }
        }

        // Choose first non-colliding position
        const foundPosition = positions.find(pos => {
            const centerX = pos.left + labelWidth / 2;
            const centerY = pos.top + labelHeight / 2;
            const newRect = { x: centerX - labelWidth * 0.75, y: centerY - labelHeight * 0.75, width: labelWidth * 1.5, height: labelHeight * 1.2 };

            const collidesLabel = labels.some(l => !(newRect.x > l.x + l.width || newRect.x + newRect.width < l.x || newRect.y > l.y + l.height || newRect.y + newRect.height < l.y));
            const collidesDot = dotBoxes.some((d, i) => i !== dotIdx && !(newRect.x > d.x + d.width || newRect.x + newRect.width < d.x || newRect.y > d.y + d.height || newRect.y + newRect.height < d.y));
            return !collidesLabel && !collidesDot;
        });

        const finalPos = foundPosition || positions[0];
        if (finalPos.left > 280) { finalPos.left = 280; finalPos.top -= 15; }

        label.style.left = `${finalPos.left}px`;
        label.style.top = `${finalPos.top}px`;

        // Draw line to label
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const labelCenterX = finalPos.left + labelWidth / 2;
        const labelCenterY = finalPos.top + labelHeight / 2;
        line.setAttribute('x1', x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', labelCenterX);
        line.setAttribute('y2', labelCenterY);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '1');

        const lineLength = Math.hypot(labelCenterX - x, labelCenterY - y);
        injectStyle(`lineDrawFadeIn-${colorClass}`, `
            @keyframes lineDrawFadeIn-${colorClass} {
                0% { stroke-dashoffset: ${lineLength}; opacity: 0; }
                50% { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: ${isCurrentTeam ? '1' : '0.5'}; }
            }
        `);
        line.setAttribute('stroke-dasharray', lineLength);
        line.setAttribute('stroke-dashoffset', lineLength);
        line.style.animation = `lineDrawFadeIn-${colorClass} ${loadedOnce ? 0 : 0.5}s ease-in-out ${loadedOnce ? 0 : fadeDelay - 0.1}s forwards`;

        svg.appendChild(line);

        // Store label position for collision detection
        const padding = 2;
        labels.push({ x: finalPos.left - padding, y: finalPos.top - padding, width: labelWidth + 2 * padding, height: labelHeight + 2 * padding });

        fragment.appendChild(label);
    });

    container.appendChild(svg);
    container.appendChild(fragment);

    loadedOnce = true;
}

document.addEventListener('DOMContentLoaded', async () => {
    startTime = performance.now();
    updateTransform();
    createZoomControls();

    const urlParams = new URLSearchParams(window.location.search);
    teamParam = urlParams.get('team') || "";

    try {
        teamLocations = await getTeamlocations();
    } catch {
        teamLocations = await getTeamlocationsFallback();
    }

    coords = teamLocations
        .filter(t => t.coords)
        .map(t => ({
            coords: t.coords,
            color: t.team_color,
            name: t.team_name
        }));

    placeDots();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            wrapper.style.width = (window.frameElement?.offsetWidth || window.innerWidth) + 'px';
            updateTransform();
            placeDots();
        }, 200);
    });
});

wrapper.addEventListener('wheel', onWheel, { passive: false });
wrapper.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
wrapper.addEventListener('touchend', onTouchEnd);
wrapper.addEventListener('touchcancel', onTouchEnd);