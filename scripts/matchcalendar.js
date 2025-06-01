/*
    This script is responsible for displaying a clickable calendar with upcoming matches on the 
    matches page. It fetches match data from a JSON file and displays it in a calendar format.
    The calendar allows users to click on a date to view the matches scheduled for that day.
*/

import { isWindowsOrLinux, copyTextToClipboard, getIsPopupShowing, shareText, shareImage, showTextPopup, showImagePreview, setOriginalMessage } from './shareAPIhelper.js';

const weekdayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const weekdayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULTSTARTDAY = 1;

const expandedLog = document.getElementById('expandedLog');
const calendarError = document.getElementById("calendarError")

const startYear = 2023;
const currentYear = new Date().getFullYear();
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
let currentlyShownDate = [2000, 0];
let matchData = {};
let teamColors = {};

let discardLogOnChange = false;

let previewTimeout = null;
let isPopupShowing = false;
let currentPreview = null;

let startTime;

function createEmptyCells(count) {
    for (let i = 0; i < count; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'empty');
        calendarDays.appendChild(emptyCell);
    }
}

function generateCalendar(month, year) {
    const startDay = localStorage.getItem("startDay") || DEFAULTSTARTDAY;
    const tempMonthType = localStorage.getItem("monthType") || "long";

    const monthYear = document.getElementById('monthYear');
    const calendarDays = document.getElementById('calendarDays');
    const adjustedWeekdayNames = weekdayNames.slice(startDay).concat(weekdayNames.slice(0, startDay));

    monthYear.innerHTML = `
        <a class="month-arrow fa-solid fa-arrow-left" id="previousMonthButton"></a>
        <span class="month-name" id="goToCurrentMonthButton">${Intl.DateTimeFormat('en', { month: tempMonthType }).format(new Date(year, month))} ${year}</span>
        <a class="month-arrow fa-solid fa-arrow-right" id="nextMonthButton"></a>
    `;

    const currentDate = new Date();
    document.getElementById('goToCurrentMonthButton').addEventListener('click', () => showMonthPicker(currentDate));
    document.getElementById('previousMonthButton').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthButton').addEventListener('click', () => changeMonth(1));

    calendarDays.innerHTML = '';
    if (discardLogOnChange) expandedLog.innerHTML = '';
    currentlyShownDate = [year, month];

    const firstDay = (new Date(year, month, 1).getDay() - startDay + 7) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    adjustedWeekdayNames.forEach(day => {
        const weekdayCell = document.createElement('div');
        weekdayCell.classList.add('day-header');
        weekdayCell.textContent = day;
        calendarDays.appendChild(weekdayCell);
    });

    createEmptyCells(firstDay);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.textContent = day;
        dayCell.classList.add('day');
        
        const today = new Date();
        const isToday = (year === today.getFullYear() && month === today.getMonth() && day === today.getDate());
        if (isToday) {
            dayCell.classList.add('day');
            setTimeout(() => {
                dayCell.classList.add('today');
            }, 50);
        }
        
        const dateToCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (matchData[dateToCheck]) {
            matchData[dateToCheck].forEach(entry => {
                const [team1, team2] = entry.teamsInvolved;

                // Find team color by team name from teamColors[0] array
                const color1 = (teamColors.find(t => t.team_name === team1) || {}).team_color || "#ccc";
                const color2 = (teamColors.find(t => t.team_name === team2) || {}).team_color || "#ccc";
            
                const colorBarContainer = document.createElement('div');
                colorBarContainer.classList.add('color-bar-container');
            
                const team1Div = document.createElement('div');
                team1Div.classList.add('team-color-bar');
                team1Div.style.backgroundColor = color1;
                team1Div.style.borderTopLeftRadius = '5px';
                team1Div.style.borderBottomLeftRadius = '5px';
            
                const team2Div = document.createElement('div');
                team2Div.classList.add('team-color-bar');
                team2Div.style.backgroundColor = color2;
                team2Div.style.borderTopRightRadius = '5px';
                team2Div.style.borderBottomRightRadius = '5px';
            
                colorBarContainer.appendChild(team1Div);
                colorBarContainer.appendChild(team2Div);
            
                dayCell.appendChild(colorBarContainer);
            });
            dayCell.classList.add('logged');
            dayCell.addEventListener('click', () => showDailyLog(dateToCheck, dayCell));
        }
        
        calendarDays.appendChild(dayCell);
    };

    const totalCells = firstDay + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
        createEmptyCells(remainingCells);
    }

    discardLogOnChange = true;
};

function changeMonth(change) {
    const newDate = new Date(currentlyShownDate[0], currentlyShownDate[1] + change);
    generateCalendar(newDate.getMonth(), newDate.getFullYear());
};

function showMonthPicker(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (currentPreview?.parentNode) {
        generateCalendar(month, year);
        return;
    }

    cleanupPopupPreview();

    const button = document.getElementById('goToCurrentMonthButton');
    const buttonRect = button.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const preview = document.createElement('div');
    preview.className = 'preview text-preview';
    preview.style.left = `${buttonRect.left + scrollX + buttonRect.width / 2 - 87.5}px`;
    preview.style.top = `${buttonRect.bottom + scrollY + 10}px`;

    preview.innerHTML = `
        <div class="arrow"></div>
        <div class="arrow-border"></div>
        <div class="preview-message">
            <select class="popupDropdown" id="monthDropdown">
                ${months.map((m, i) =>
                    `<option value="${i}" ${i === currentlyShownDate[1] ? 'selected' : ''}>${m}</option>`
                ).join('')}
            </select>
            <select class="popupDropdown" id="yearDropdown">
                ${Array.from({ length: currentYear + 2 - (startYear + 1) + 1 }, (_, i) => {
                    const y = startYear + 1 + i;
                    return `<option value="${y}" ${y === currentlyShownDate[0] ? 'selected' : ''}>${y}</option>`;
                }).join('')}
            </select>
        </div>
    `;

    document.body.appendChild(preview);
    currentPreview = preview;
    isPopupShowing = true;

    const monthDropdown = preview.querySelector('#monthDropdown');
    const yearDropdown = preview.querySelector('#yearDropdown');

    function handleDropdownChange() {
        generateCalendar(Number(monthDropdown.value), Number(yearDropdown.value));
        resetAutoCloseTimer();
    }

    monthDropdown.addEventListener('change', handleDropdownChange);
    yearDropdown.addEventListener('change', handleDropdownChange);

    function resetAutoCloseTimer() {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(closePreview, 5000);
    }

    function closePreview() {
        if (!preview?.parentNode) return;
        preview.style.transform = 'scale(0.95) translateY(-10px)';
        preview.style.opacity = '0';
        document.removeEventListener('mousedown', handleClickOutside);
        setTimeout(cleanupPopupPreview, 150);
    }

    function handleClickOutside(e) {
        if (!preview.contains(e.target)) {
            closePreview();
        }
    }

    setTimeout(() => {
        preview.style.transform = 'scale(1) translateY(0)';
        preview.style.opacity = '1';
    }, 10);

    previewTimeout = setTimeout(closePreview, 5000);
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
}

function cleanupPopupPreview() {
    clearTimeout(previewTimeout);
    previewTimeout = null;

    if (currentPreview?.parentNode) {
        currentPreview.remove();
    }

    currentPreview = null;
    isPopupShowing = false;
}

function showDailyLog(date, dayCell) {
    // Remove highlight from all previously selected days
    document.querySelectorAll('.day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Add highlight to the newly selected day
    if (dayCell) {
        dayCell.classList.add('selected');
    }

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('date', date);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    if (window.location.href !== newUrl) {
        window.history.pushState({}, '', newUrl);
    }

    const locale = localStorage.getItem("locale") || "en-GB";

    const log = matchData[date] || [];
    if (log.length) {
        const formattedDate = new Date(`${date}`).toLocaleString(locale, { dateStyle: 'full' });
        expandedLog.innerHTML = `
            <div class="current-season-area"> 
                <h3 style="margin: 3px">${formattedDate}</h3>                            
                <button id="shareButton"><span class="fa-solid fa-share"></span> Share Date</button>
            </div>
            <hr class="after-title" style="margin-bottom:0;">
            ${log.map((entry, index) => {
                function createTeamObject(teamName) {
                    return {
                        team_name: teamName,
                        class_name: teamName.replace(/\s+/g, ''),
                        link: `pages/teams/${teamName.replace(/\s+/g, '-').toLowerCase()}/`
                    };
                }

                const [team1, team2] = entry.teamsInvolved.map(createTeamObject);
                let timeString = entry.time || '00:00';
                if (/^\d{2}:\d{2}$/.test(timeString)) timeString += ':00';
                const formattedMatchTime = new Date(`1970-01-01T${timeString}`).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit'});
                return `
                    <div class="event">
                        <p class="event-header">${formattedMatchTime}</p>
                        <h2 style="margin-bottom: 10px;">
                            <span class=${team1.class_name}><a class="no-color-link no-underline-link" href="${team1.link}">${team1.team_name}</a></span> 
                            VS 
                            <span class="${team2.class_name}"><a class="no-color-link no-underline-link" href="${team2.link}">${team2.team_name}</a></span>
                        </h2>
                        <p>${autoLink(entry.description.replace(/(?:\r\n|\r|\n)/g, '<br/>'))}</p>
                        <span class="settings-extra-info">This match from Season ${entry.season}.</span>
                    </div>
                `;
            }).join('')}
        `;

        createShareButtonListener(formattedDate);
    } else {
        expandedLog.innerHTML = `<div class="settingSubheading"><h3>No events scheduled</h3></div>`;
    }
}

function autoLink(text) {
    const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
    return text.replace(urlRegex, function(url) {
        let href = url;
        if (!href.match(/^https?:\/\//)) {
            href = 'http://' + href;
        }
        return `<a href="${href}" target="_blank">${url}</a>`;
    });
}

function createShareButtonListener(formattedDate) {
    const shareButton = document.getElementById("shareButton");

    setOriginalMessage(shareButton.innerHTML);

    shareButton.addEventListener("click", async () => {
        if (getIsPopupShowing()) return;
        const useClipboard = isWindowsOrLinux() || !navigator.canShare;
        
        const message = `Check out these UMKL matches on ${formattedDate}! ${window.location.href}`
        
        const imagePath = 'assets/image/calendar/mikuheadshake.gif'
        const blob = await fetch(imagePath).then(r => r.blob());

        if (useClipboard) {
            const success = await copyTextToClipboard(message);
            shareButton.innerText = success ? "Text copied to clipboard!" : "Failed to copy!";
            const messageWithURL = `Check out these UMKL matches on ${formattedDate}! <a href="${window.location.href}">${window.location.href}</a>`
            showImagePreview(blob, imagePath, messageWithURL)
        } else {
            await shareImage(
                `UMKL Matches on ${formattedDate}`,
                message,
                blob,
                "mikuheadshake.gif"
            );
        }
    });
}

document.addEventListener('startDayChange', () => {
    displayCalendar();
});

function makeTeamsColorStyles() {
    const styleSheet = document.createElement("style");

    teamColors.forEach((team) => {
        styleSheet.innerText += `
            .${team.team_name.replace(/\s+/g, '')} {
                cursor: pointer;
                padding: 0 3px;
                border: 2px solid ${team.team_color};
                background-color: ${team.team_color}aa;
                border-radius: 5px;
            }
        `
    })

    document.head.appendChild(styleSheet);
}

window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam && matchData[dateParam]) {
        console.debug(`%cmatchcalendar.js %c> %cURL parameter changed`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        showDailyLog(dateParam);
    } else {
        expandedLog.innerHTML = 'No logs for this day';
    }
});

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
        return response.json();
    });
}

async function getTeamcolorsFallback() {
    const response = await fetch(`database/teamcolorsfallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    teamColors = await response.json();
}

async function getMatchData() {
    return fetch('https://api.umkl.co.uk/matchdata', {
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
        return response.json();
    });
}

async function getMatchDataFallback() {
    const response = await fetch(`database/matchdatafallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    matchData = await response.json();
}

function displayCalendar() {
    const currentDate = new Date();
    generateCalendar(currentDate.getMonth(), currentDate.getFullYear());        

    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam && matchData[dateParam]) {
        console.debug(`%cmatchcalendar.js %c> %cURL parameter detected`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        const dateObj = new Date(dateParam);
        generateCalendar(dateObj.getMonth(), dateObj.getFullYear());
        showDailyLog(dateParam);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cmatchcalendar.js %c> %cLoading calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    
    try {
        matchData = await getMatchData();
        teamColors = await getTeamcolors();
    } catch (error) {
        console.debug(`%cmatchcalendar.js %c> %cAPI failed - using fallback information...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        await getMatchDataFallback();
        await getTeamcolorsFallback();

        calendarError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
    }

    makeTeamsColorStyles();
    displayCalendar();
    console.debug(`%cmatchcalendar.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
});