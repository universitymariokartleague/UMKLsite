/*
    This script is responsible for displaying a clickable calendar with upcoming matches on the 
    matches page. It fetches match data from a JSON file and displays it in a calendar format.
    The calendar allows users to click on a date to view the matches scheduled for that day.
*/

import { isWindowsOrLinux, copyTextToClipboard, getIsPopupShowing, shareText, shareImage, showTextPopup, showImagePreview, setOriginalMessage } from './shareAPIhelper.js';

const weekdayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const weekdayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULTSTARTDAY = 1;
const MATCH_LENGTH_MINS = 90;

const calendarContainer = document.getElementById('calendar-container');
const calendarListView = document.getElementById('calendarListView');
const expandedLog = document.getElementById('expandedLog');
const calendarError = document.getElementById("calendarError")

const currentYear = new Date().getFullYear();
const startYear = 2023; // currentYear of season = startYear + season (eg: season 1 - 2023 + 1 = 2024)
const minYear = startYear + 1; // Minimum year for the calendar, prevents going back to 2023
const maxYear = currentYear + 2; // Maximum year for the calendar, allows going up to 2 years in the future
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
let currentlyShownDate = [2000, 0];
let matchData = {};
let teamColors = {};

let refreshTimer = null;

let discardLogOnChange = false;

let previewTimeout = null;
let currentPreview = null;

let listViewEnabled = false;
let listViewToggledOnce = false;

let startTime;

function createEmptyCells(count) {
    for (let i = 0; i < count; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'empty');
        calendarDays.appendChild(emptyCell);
    }
}

function generateCalendar(month, year, dateParam = null) {
    const startDay = localStorage.getItem("startDay") || DEFAULTSTARTDAY;
    const tempMonthType = localStorage.getItem("monthType") || "long";

    const monthYear = document.getElementById('monthYear');
    const calendarDays = document.getElementById('calendarDays');
    const adjustedWeekdayNames = weekdayNames.slice(startDay).concat(weekdayNames.slice(0, startDay));

    monthYear.innerHTML = `
        <a class="month-arrow fa-solid fa-arrow-left ${(year == minYear && month == 0) ? "empty" : ""}" id="previousMonthButton"></a>
        <span class="month-name" id="goToCurrentMonthButton">${Intl.DateTimeFormat('en', { month: tempMonthType }).format(new Date(year, month))} ${year}</span>
        <a class="month-arrow fa-solid fa-arrow-right ${(year == maxYear && month == 11) ? "empty" : ""}" id="nextMonthButton"></a>
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
            if (dateParam === dateToCheck) {
                dayCell.classList.add('selected');
            }
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
    // Prevent going below minYear or above maxYear/month 11
    if (
        newDate.getFullYear() < minYear ||
        (newDate.getFullYear() === minYear && newDate.getMonth() < 0) ||
        newDate.getFullYear() > maxYear ||
        (newDate.getFullYear() === maxYear && newDate.getMonth() > 11)
    ) {
        return;
    }
    generateCalendar(newDate.getMonth(), newDate.getFullYear());
};

function showMonthPicker(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (currentPreview?.parentNode) {
        // generateCalendar(month, year);
        return;
    }

    cleanupPopupPreview();

    const button = document.getElementById('goToCurrentMonthButton');
    const buttonRect = button.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const preview = document.createElement('div');
    preview.className = 'preview text-preview';
    preview.style.left = `${buttonRect.left + scrollX + buttonRect.width / 2 - 105}px`;
    preview.style.top = `${buttonRect.bottom + scrollY + 10}px`;

    preview.innerHTML = `
        <div class="arrow"></div>
        <div class="arrow-border"></div>
        <div class="preview-message" style="user-select:none;">
            <select title="Select a month" class="popupDropdown" id="monthDropdown">
                ${months.map((m, i) =>
        `<option value="${i}"${i === currentlyShownDate[1] ? ' selected' : ''}>${m}</option>`
    ).join('')}
            </select>
            <select title="Select a year" class="popupDropdown" id="yearDropdown">
                ${Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
        const y = minYear + i;
        return `<option value="${y}"${y === currentlyShownDate[0] ? ' selected' : ''}>${y}</option>`;
    }).join('')}
            </select>
            <button title="Return to the current date" class="currentDateButton" id="currentDateButton"><i class="fa-solid fa-calendar"></i></button>
        </div>
    `;

    document.body.appendChild(preview);

    document.getElementById('currentDateButton').addEventListener('click', () => {
        generateCalendar(month, year);
        clearURLParams();
        closePreview();
    });

    currentPreview = preview;

    const monthDropdown = preview.querySelector('#monthDropdown');
    const yearDropdown = preview.querySelector('#yearDropdown');

    function handleDropdownChange() {
        console.log("yeah")
        generateCalendar(Number(monthDropdown.value), Number(yearDropdown.value));
        resetAutoCloseTimer();
    }

    monthDropdown.addEventListener('click', resetAutoCloseTimer);
    yearDropdown.addEventListener('click', resetAutoCloseTimer);
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
}

function showDailyLog(date, dayCell) {
    listViewToggledOnce = false;

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
        window.history.replaceState({}, '', newUrl);
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
                    link: `pages/teams/details/?team=${teamName}`
                };
            }

            const [team1, team2] = entry.teamsInvolved.map(createTeamObject);

            function uses12HourClock(locale) {
                const test = new Date('2020-01-01T13:00');
                return test.toLocaleTimeString(locale).toLowerCase().includes('pm');
            }
            let timeString = entry.time || '00:00';
            if (/^\d{2}:\d{2}$/.test(timeString)) timeString += ':00';
            const is12Hour = uses12HourClock(locale);
            const formattedMatchTime = new Date(`1970-01-01T${timeString}`).toLocaleTimeString(locale, {
                hour: is12Hour ? 'numeric' : '2-digit',
                minute: '2-digit',
                hour12: is12Hour,
            });

            let isLive = false;
            if (entry.time) {
                const [hours, minutes] = entry.time.split(':');
                const dateObj = new Date(formattedDate);
                dateObj.setHours(Number(hours), Number(minutes), 0, 0);

                const now = new Date();
                const matchStart = dateObj;
                const matchEnd = new Date(matchStart.getTime() + MATCH_LENGTH_MINS * 60 * 1000);
                if (now >= matchStart && now <= matchEnd) {
                    isLive = true;
                }
            }

            const resultsHTML = formatResults(entry.results);
            if (entry.ytLinks) {
                team1.ytLink = entry.ytLinks[0]
                team2.ytLink = entry.ytLinks[1]
            }

            return `
                <div class="event-container">
                    <div class="team-box-container">
                        <div class="team-background left ${team1.class_name}"></div>
                        <div class="team-background right ${team2.class_name}"></div>
                        <img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.png"/>

                        <div class="event-overlay">
                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link" href="${team1.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team1.team_name.toUpperCase()}.png"
                                    alt="${team1.team_name} team logo"
                                    onload="this.style.opacity=1"
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                    <h2>${team1.team_name}</h2>
                                </a>
                                <div class="youtube-box left-team">
                                    ${team1.ytLink ? `
                                    <a class="no-color-link no-underline-link-footer fa-brands fa-youtube"
                                    href="${team1.ytLink}" target="_blank" title="View the archived livestream"></a>` : ''}
                                </div>
                            </div>

                            <div class="score-box">${resultsHTML ? formatResults(entry.results) : "VS"}</div>       

                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link" href="${team2.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team2.team_name.toUpperCase()}.png"
                                    alt="${team2.team_name} team logo"
                                    onload="this.style.opacity=1" 
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                    <h2>${team2.team_name}</h2>
                                </a>
                                <div class="youtube-box right-team">
                                    ${team2.ytLink ? `
                                    <a class="no-color-link no-underline-link-footer fa-brands fa-youtube"
                                    href="${team2.ytLink}" target="_blank" title="View the archived livestream"></a>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="match-details-box">
                        <div class="match-date-time-box">
                            <div class="match-detail-container">
                                <i class="fa-solid fa-clock"></i>
                                <h2>${formattedMatchTime}</h2>
                                ${isLive ? '<div class="live-dot"></div>' : ''}
                            </div>
                        </div>
                        <p class="match-season">${entry.testMatch ? "<span class='settings-extra-info'>Test match</span>" : `Season ${entry.season}`}</p>
                    </div>
                    <details class="match-box">
                        <summary>Match details</summary>
                        <p class="match-description">${autoLink(entry.description)}</p>
                    </details>
                </div>
            `;
        }).join('')}
        `;

        createShareButtonListener(formattedDate);
    } else {
        expandedLog.innerHTML = `<div class="settingSubheading">Select a date to see the matches happening on that day.</div>`;
        clearURLParams();
    }
}

function generateCalendarListView() {
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0];

    const sortedDates = Object.keys(matchData);
    let todayMarkerInserted = false;

    const locale = localStorage.getItem("locale") || "en-GB";

    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];

        if (!todayMarkerInserted && formattedToday < date) {
            calendarListView.innerHTML += `
                <div class="today-marker">
                    Today - ${new Date(formattedToday).toLocaleDateString(locale, { dateStyle: 'long' })}
                </div><hr>
            `;
            todayMarkerInserted = true;
        }

        const formattedDate = new Date(`${date}`).toLocaleString(locale, { dateStyle: 'long' });
        calendarListView.innerHTML += `
            <h3 id=${date}>${formattedDate}</h3>
        `

        matchData[date].forEach(entry => {
            function createTeamObject(teamName) {
                return {
                    team_name: teamName,
                    class_name: teamName.replace(/\s+/g, ''),
                    link: `pages/teams/details/?team=${teamName}`
                };
            }

            const [team1, team2] = entry.teamsInvolved.map(createTeamObject);

            function uses12HourClock(locale) {
                const test = new Date('2020-01-01T13:00');
                return test.toLocaleTimeString(locale).toLowerCase().includes('pm');
            }
            let timeString = entry.time || '00:00';
            if (/^\d{2}:\d{2}$/.test(timeString)) timeString += ':00';
            const is12Hour = uses12HourClock(locale);
            const formattedMatchTime = new Date(`1970-01-01T${timeString}`).toLocaleTimeString(locale, {
                hour: is12Hour ? 'numeric' : '2-digit',
                minute: '2-digit',
                hour12: is12Hour,
            });

            let isLive = false;
            if (entry.time) {
                const [hours, minutes] = entry.time.split(':');
                const dateObj = new Date(formattedDate);
                dateObj.setHours(Number(hours), Number(minutes), 0, 0);

                const now = new Date();
                const matchStart = dateObj;
                const matchEnd = new Date(matchStart.getTime() + MATCH_LENGTH_MINS * 60 * 1000);
                if (now >= matchStart && now <= matchEnd) {
                    isLive = true;
                }
            }

            const resultsHTML = formatResults(entry.results);
            if (entry.ytLinks) {
                team1.ytLink = entry.ytLinks[0]
                team2.ytLink = entry.ytLinks[1]
            }

            calendarListView.innerHTML += `
                <div class="event-container">
                    <div class="team-box-container">
                        <div class="team-background left ${team1.class_name}"></div>
                        <div class="team-background right ${team2.class_name}"></div>
                        <img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.png"/>

                        <div class="event-overlay">
                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link" href="${team1.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team1.team_name.toUpperCase()}.png"
                                    alt="${team1.team_name} team logo"
                                    onload="this.style.opacity=1"
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                    <h2>${team1.team_name}</h2>
                                </a>
                                <div class="youtube-box left-team">
                                    ${team1.ytLink ? `
                                    <a class="no-color-link no-underline-link-footer fa-brands fa-youtube"
                                    href="${team1.ytLink}" target="_blank" title="View the archived livestream"></a>` : ''}
                                </div>
                            </div>

                            <div class="score-box">${resultsHTML ? formatResults(entry.results) : "VS"}</div>       

                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link" href="${team2.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team2.team_name.toUpperCase()}.png"
                                    alt="${team2.team_name} team logo"
                                    onload="this.style.opacity=1" 
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.png';"/>
                                    <h2>${team2.team_name}</h2>
                                </a>
                                <div class="youtube-box right-team">
                                    ${team2.ytLink ? `
                                    <a class="no-color-link no-underline-link-footer fa-brands fa-youtube"
                                    href="${team2.ytLink}" target="_blank" title="View the archived livestream"></a>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="match-details-box">
                        <div class="match-date-time-box">
                            <div class="match-detail-container">
                                <i class="fa-solid fa-clock"></i>
                                <h2>${formattedMatchTime}</h2>
                                ${isLive ? '<div class="live-dot"></div>' : ''}
                            </div>
                        </div>
                        <p class="match-season">${entry.testMatch ? "<span class='settings-extra-info'>Test match</span>" : `Season ${entry.season}`}</p>
                    </div>
                    <details class="match-box">
                        <summary>Match details</summary>
                        <p class="match-description">${autoLink(entry.description)}</p>
                    </details>
                </div>
            `
        })

        calendarListView.innerHTML += `<hr>`
    }
}

function scrollMatchList() {
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0];

    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');

    const target = document.getElementById(dateParam ? dateParam : formattedToday);

    // Try to scroll to the date given, else scroll to bottom
    if (target) {
        calendarListView.scrollTo({
            top: target.offsetTop - calendarListView.offsetTop
        });
    } else {
        calendarListView.scrollTo({
            top: calendarListView.scrollHeight
        });
    }
}

function formatResults(results) {
    if (!results || results.length !== 2) {
        return '';
    }

    const [_, teamAScore, teamAPenalty] = results[0];
    const [__, teamBScore, teamBPenalty] = results[1];
    const hasPenalty = teamAPenalty !== 0 || teamBPenalty !== 0;

    return `
            ${teamAScore} - ${teamBScore}
            ${hasPenalty ?
            `
                <p class="penalty-text">
                    -${teamAPenalty}	 	 	 	 	 	  	  	  -${teamBPenalty}
                </p>
            ` : ''}
    `.trim();
}

function autoLink(text) {
    text = text.replaceAll("\n", "<br>")
    const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
    return text.replace(urlRegex, function (url) {
        let href = url;
        let displayUrl = url;
        let trailingDot = '';
        if (displayUrl.endsWith('.')) {
            displayUrl = displayUrl.slice(0, -1);
            href = href.slice(0, -1);
            trailingDot = '.';
        }
        if (!href.match(/^https?:\/\//)) {
            href = 'http://' + href;
        }
        return `<a href="${href}" target="_blank">${displayUrl}</a>${trailingDot}`;
    });
}

function clearURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('date');
    const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    if (window.location.href !== newUrl) {
        window.history.replaceState({}, '', newUrl);
    }
}

function createShareButtonListener(formattedDate) {
    const shareButton = document.getElementById("shareButton");

    setOriginalMessage(shareButton.innerHTML);

    shareButton.addEventListener("click", async () => {
        if (getIsPopupShowing()) return;
        const useClipboard = isWindowsOrLinux() || !navigator.canShare;

        const message = `Check out these UMKL matches on ${formattedDate}! ${window.location.href}`

        if (useClipboard) {
            const success = await copyTextToClipboard(message);
            shareButton.innerText = success ? "Text copied to clipboard!" : "Failed to copy!";
            const messageWithURL = `Check out these UMKL matches on ${formattedDate}! <a href="${window.location.href}">${window.location.href}</a>`
            showTextPopup(messageWithURL)
        } else {
            await shareText(
                `UMKL Matches on ${formattedDate}`,
                message
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
                background-color: ${team.team_color};
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
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam && matchData[dateParam]) {
        console.debug(`%cmatchcalendar.js %c> %cURL parameter detected`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        const dateObj = new Date(dateParam);
        showDailyLog(dateParam);
        generateCalendar(dateObj.getMonth(), dateObj.getFullYear(), dateParam);
    } else {
        const currentDate = new Date();
        if (!discardLogOnChange) {
            showDailyLog(currentDate.toISOString().split('T')[0]);
        }
        generateCalendar(currentDate.getMonth(), currentDate.getFullYear());
    }
}

function generateListViewButton() {
    const listViewButton = document.getElementById("listViewButton");
    
    listViewButton.onclick = () => {
        listViewEnabled = !listViewEnabled;
        listViewButton.innerHTML = `${listViewEnabled ? `<span class="fa-regular fa-calendar"></span> Disable` : `<span class="fa-solid fa-bars"></span> Enable`} List View`
        
        changeCalendarView(listViewEnabled);
        
        localStorage.setItem("calendarListView", listViewEnabled ? 1 : 0);
    };
}

function changeCalendarView(listView) {
    if (listView) {
        calendarListView.classList.remove("hidden")
        calendarContainer.classList.add("hidden")
        if (!listViewToggledOnce) scrollMatchList();
        listViewToggledOnce = true;
    } else {
        calendarListView.classList.add("hidden")
        calendarContainer.classList.remove("hidden")
    }
}

function loadCalendarView() {
    const calendarListView = localStorage.getItem("calendarListView") == 1 || false;
    changeCalendarView(calendarListView);
    listViewEnabled = calendarListView;
    listViewButton.innerHTML = `${listViewEnabled ? `<span class="fa-regular fa-calendar"></span> Disable` : `<span class="fa-solid fa-bars"></span> Enable`} List View`
}

document.addEventListener('calendarListViewChange', async () => {
    loadCalendarView();
})

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cmatchcalendar.js %c> %cFetching calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    generateListViewButton();

    try {
        matchData = await getMatchData();
        teamColors = await getTeamcolors();
    } catch (error) {
        console.debug(`%cmatchcalendar.js %c> %cAPI failed - using fallback information...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        await getMatchDataFallback();
        await getTeamcolorsFallback();

        if (error && error.message && error.message.includes('429')) {
            calendarError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.</blockquote>`;
        } else {
            calendarError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;

            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = async () => {
                try {
                    if (typeof retryCount === 'undefined') {
                        window.retryCount = 1;
                    } else {
                        window.retryCount++;
                    }
                    matchData = await getMatchData();
                    teamColors = await getTeamcolors();
                    calendarError.innerHTML = ""
                    makeTeamsColorStyles();
                    displayCalendar();
                } catch (err) {
                    calendarError.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${window.retryCount}...</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            };
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }

    makeTeamsColorStyles();
    displayCalendar();
    generateCalendarListView();
    loadCalendarView();
    console.debug(`%cmatchcalendar.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
});