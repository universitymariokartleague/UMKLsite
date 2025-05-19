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

let currentlyShownDate = [2000, 0];
let dailyLogData = {};
let teamColorsData = {};

let discardLogOnChange = false;

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
    document.getElementById('goToCurrentMonthButton').addEventListener('click', () => generateCalendar(currentDate.getMonth(), currentDate.getFullYear()));
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
        if (dailyLogData[dateToCheck]) {
            dailyLogData[dateToCheck].forEach(entry => {
                const [team1, team2] = entry.teamsInvolved;
                const color1 = teamColorsData[team1];
                const color2 = teamColorsData[team2];
            
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

    const tempLocale = localStorage.getItem("locale") || "en-GB";

    const log = dailyLogData[date] || [];
    if (log.length) {
        const formattedDate = new Date(`${date}`).toLocaleString(tempLocale, { dateStyle: 'full' });
        expandedLog.innerHTML = `
            <div class="settingSubheading">
                <div class="current-season-area"> 
                    <h3 style="margin: 3px">${formattedDate}</h3>                            
                    <button id="shareButton"><span class="fa-solid fa-share"></span> Share this date</button>
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
                    return `
                        <div class="event">
                            <p style="margin: 3px 0; font-size:20px; opacity:70%;">${new Date(`1970-01-01T${entry.time || '00:00'}:00`).toLocaleTimeString(tempLocale, { hour: 'numeric', minute: '2-digit'})}</p>
                            <h2 style="margin-bottom: 10px;">
                                <span class=${team1.class_name}><a class="no-color-link no-underline-link" href="${team1.link}">${team1.team_name}</a></span> 
                                VS 
                                <span class="${team2.class_name}"><a class="no-color-link no-underline-link" href="${team2.link}">${team2.team_name}</a></span>
                            </h2>
                            ${entry.description.replace(/(?:\r\n|\r|\n)/g, '<br/>')}
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        createShareButtonListener(formattedDate);
    } else {
        expandedLog.innerHTML = `<div class="settingSubheading"><h3>No events scheduled</h3></div>`;
    }
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

    Object.entries(teamColorsData).forEach(([team, color]) => {
        styleSheet.innerText += `
            .${team} {
                cursor: pointer;
                padding: 0 3px;
                border: 2px solid ${color};
                background-color: ${color}aa;
                border-radius: 5px;
            }
        `
    });

    document.head.appendChild(styleSheet);
}

window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam && dailyLogData[dateParam]) {
        console.debug(`%cmatchcalendar.js %c> %cURL parameter changed`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        showDailyLog(dateParam);
    } else {
        expandedLog.innerHTML = 'No logs for this day';
    }
});

function displayCalendar() {
    let dailyLogPath = "database/matchdata.json";
    let teamColorsPath = "database/teamcolors.json";

    fetch(teamColorsPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(colorsData => {
            teamColorsData = colorsData
            console.debug(`%cmatchcalendar.js %c> %cTeam colors loaded: ${JSON.stringify(teamColorsData)}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
            makeTeamsColorStyles();
            console.debug(`%cmatchcalendar.js %c> %cTeam css created`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
            fetch(dailyLogPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    dailyLogData = data;
                    const currentDate = new Date();
                    generateCalendar(currentDate.getMonth(), currentDate.getFullYear());        
                    console.debug(`%cmatchcalendar.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        
                    const urlParams = new URLSearchParams(window.location.search);
                    const dateParam = urlParams.get('date');
                    if (dateParam && dailyLogData[dateParam]) {
                        console.debug(`%cmatchcalendar.js %c> %cURL parameter detected`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
                        const dateObj = new Date(dateParam);
                        generateCalendar(dateObj.getMonth(), dateObj.getFullYear());
                        showDailyLog(dateParam);
                    }
                })
                .catch(error => {
                    console.debug(`%cmatchcalendar.js %c> %cError loading match data: ${error}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
                });    
        })
        .catch(error => {
            console.debug(`%cmatchcalendar.js %c> %cError loading team colors: ${error}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        });
}

window.addEventListener('load', function() {
    startTime = performance.now();
    console.debug(`%cmatchcalendar.js %c> %cLoading calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    displayCalendar();
});