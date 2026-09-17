/*
    Places a single dot on the thin UK outline map in a team's hero banner,
    marking that team's location. Projection matches maprender.js so the
    same coordinates line up on both maps.
*/

const MAP_WIDTH = 1326;
const MAP_HEIGHT = 2475;

const mapBounds = {
    minLat: 49.97,
    maxLat: 60.86088,
    minLon: -8.64,
    maxLon: 1.73,
};

function latLonToPixel(lat, lon) {
    const { minLon, maxLon, minLat, maxLat } = mapBounds;
    const x = ((lon - minLon) / (maxLon - minLon)) * MAP_WIDTH;

    const latRad = lat * Math.PI / 180;
    const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const mercMin = Math.log(Math.tan(Math.PI / 4 + (minLat * Math.PI / 180) / 2));
    const mercMax = Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI / 180) / 2));
    const y = ((mercMax - mercY) / (mercMax - mercMin)) * MAP_HEIGHT;

    return { x, y };
}

async function getTeamLocations() {
    const response = await fetch('https://api.umkl.co.uk/teamlocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}

async function loadHeroMap() {
    const wrapper = document.getElementById('heroMapWrapper');
    const dot = document.getElementById('heroMapDot');
    if (!wrapper || !dot) return;

    const team = new URLSearchParams(window.location.search).get('team');
    if (!team) {
        wrapper.remove();
        return;
    }

    try {
        const locations = await getTeamLocations();
        const match = locations.find(t => t.team_name?.toLowerCase() === team.toLowerCase());

        if (!match?.coords) {
            wrapper.remove();
            return;
        }

        const [lat, lon] = match.coords;
        const { x, y } = latLonToPixel(lat, lon);

        dot.style.left = `${(x / MAP_WIDTH) * 100}%`;
        dot.style.top = `${(y / MAP_HEIGHT) * 100}%`;
        dot.classList.add('visible');
    } catch (error) {
        console.error('Failed to load team location for hero map:', error);
        wrapper.remove();
    }
}

document.addEventListener('DOMContentLoaded', loadHeroMap);
