/*
    Places a single dot on the thin UK outline map in a team's hero banner,
    marking that team's location. Projection matches maprender.js so the
    same coordinates line up on both maps. Hovering the map shows the
    area's current temperature, and clicking the dot opens a weather popup.
*/

import { createDebugLogger } from '/_assets/scripts/utils/debuglogger.js';

const debugLog = createDebugLogger('herolocationmap.js', '#d152ff', '#e6a1ff');

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

async function getWeather(lat, long) {
    debugLog(`Fetching location weather from the open-meteo API...`);
    return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,cloud_cover,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&forecast_days=5&wind_speed_unit=mph&timezone=auto`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
}

function describeWeather(code, isDay = 1) {
    if (code === 0 || code === 1) return { icon: isDay ? '☀️' : '🌙', label: code === 0 ? 'Clear' : 'Mostly clear' };
    if (code === 2) return { icon: '⛅', label: 'Partly cloudy' };
    if (code === 3) return { icon: '☁️', label: 'Overcast' };
    if (code === 45 || code === 48) return { icon: '🌫️', label: 'Fog' };
    if (code >= 51 && code <= 57) return { icon: '🌦️', label: 'Drizzle' };
    if (code >= 61 && code <= 67) return { icon: '🌧️', label: 'Rain' };
    if (code >= 71 && code <= 77) return { icon: '❄️', label: 'Snow' };
    if (code >= 80 && code <= 82) return { icon: '🌦️', label: 'Showers' };
    if (code === 85 || code === 86) return { icon: '🌨️', label: 'Snow showers' };
    if (code >= 95) return { icon: '⛈️', label: 'Thunderstorm' };
    return { icon: '🌡️', label: 'Unknown' };
}

function formatForecast(daily) {
    const locale = localStorage.getItem('locale') || 'en-GB';

    return daily.time.map((date, i) => {
        const day = i === 0 ? 'Today' : new Date(`${date}T12:00`).toLocaleDateString(locale, { weekday: 'short' });
        const { icon, label } = describeWeather(daily.weather_code[i]);

        return `
            <div class="weather-day">
                <span class="weather-day-name">${day}</span>
                <span class="weather-day-icon" title="${label}">${icon}</span>
                <span class="weather-day-temps">
                    <strong>${Math.round(daily.temperature_2m_max[i])}°</strong>
                    <span>${Math.round(daily.temperature_2m_min[i])}°</span>
                </span>
            </div>
        `;
    }).join('');
}

function formatTodayStats({ current, current_units, daily, daily_units }) {
    const value = (n, unit = '') => n == null ? 'N/A' : `${Math.round(n)}${unit}`;

    const stats = [
        ['Feels Like', value(current.apparent_temperature, current_units.apparent_temperature)],
        ['Humidity', value(current.relative_humidity_2m, current_units.relative_humidity_2m)],
        ['Wind', value(current.wind_speed_10m, ` ${current_units.wind_speed_10m.replace('mp/h', 'mph')}`)],
        ['Chance of Rain', value(daily.precipitation_probability_max[0], daily_units.precipitation_probability_max)],
        ['UV Index', value(daily.uv_index_max[0])],
        ['Cloud Cover', value(current.cloud_cover, current_units.cloud_cover)],
        ['Sunrise', daily.sunrise[0].slice(11, 16)],
        ['Sunset', daily.sunset[0].slice(11, 16)],
    ];

    return stats.map(([label, stat]) => `
        <div class="stat-item">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${stat}</span>
        </div>
    `).join('');
}

function createWeatherDialog() {
    const dialog = document.createElement('dialog');
    dialog.id = 'weatherBox';
    dialog.tabIndex = -1;
    dialog.innerHTML = `
        <div class="settings-header">
            <h2>Weather</h2>
            <button class="settings-close-btn" aria-label="Close weather">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" role="img">
                    <title>Close weather</title>
                    <path fill="currentColor" d="M13.48 12 19 17.52 17.52 19 12 13.48 6.48 19 5 17.52 10.52 12 5 6.48 6.48 5 12 10.52 17.52 5 19 6.48z"></path>
                </svg>
            </button>
        </div>
        <div class="weather-body">
            <div class="weather-today">
                <div class="weather-current">
                    <span class="weather-current-icon"></span>
                    <span class="weather-temperature"></span>
                </div>
                <p class="weather-condition"></p>
                <div class="season-stats-grid weather-stats"></div>
            </div>
            <div>
                <p class="weather-forecast-title">5-day forecast</p>
                <div class="weather-forecast"></div>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    const close = () => {
        if (!dialog.open || dialog.classList.contains('closing')) return;
        dialog.classList.add('closing');
        dialog.addEventListener('animationend', () => {
            dialog.classList.remove('closing');
            dialog.close();
        }, { once: true });
    };

    dialog.querySelector('.settings-close-btn').addEventListener('click', close);
    dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        close();
    });
    dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const clickedInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!clickedInside) close();
    });

    return dialog;
}

async function setupWeather(dot, lat, lon) {
    const tooltip = dot.querySelector('.hero-map-tooltip');
    const dialog = createWeatherDialog();
    const temperature = dialog.querySelector('.weather-temperature');
    const currentIcon = dialog.querySelector('.weather-current-icon');
    const condition = dialog.querySelector('.weather-condition');
    const stats = dialog.querySelector('.weather-stats');
    const forecast = dialog.querySelector('.weather-forecast');

    const setText = (text) => {
        if (tooltip) tooltip.textContent = text;
        temperature.textContent = text;
    };

    const openDialog = () => {
        if (dialog.open) return;
        dialog.showModal();
        // Stops the browser autofocusing the close button, which would look permanently hovered
        dialog.focus();
    };

    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('aria-label', 'Show weather');
    dot.addEventListener('click', openDialog);
    dot.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openDialog();
    });

    setText('Loading…');

    try {
        const data = await getWeather(lat, lon);
        const { current, current_units, daily } = data;
        const { icon, label } = describeWeather(current.weather_code, current.is_day);

        setText(`${Math.round(current.temperature_2m)}${current_units.temperature_2m}`);
        currentIcon.textContent = icon;
        condition.textContent = label;
        stats.innerHTML = formatTodayStats(data);
        forecast.innerHTML = formatForecast(daily);
    } catch (error) {
        console.error('Failed to load weather for hero map:', error);
        setText('Weather unavailable');
    }
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
        setupWeather(dot, lat, lon);
    } catch (error) {
        console.error('Failed to load team location for hero map:', error);
        wrapper.remove();
    }
}

document.addEventListener('DOMContentLoaded', loadHeroMap);
