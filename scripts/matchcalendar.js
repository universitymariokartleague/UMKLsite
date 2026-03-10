/*
    This script is responsible for displaying a clickable calendar with upcoming matches on the 
    matches page. It fetches match data from a JSON file and displays it in a calendar format.
    The calendar allows users to click on a date to view the matches scheduled for that day.
*/

import { generate6v6ScoreCalculatorLink } from './matchhelper.js';
import { isWindowsOrLinux, copyTextToClipboard, getIsPopupShowing, shareText, shareImage, showTextPopup, showImagePreview, setOriginalMessage } from './shareAPIhelper.js';

const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DEFAULT_START_DAY = 1;
const MATCH_LENGTH_MINS = 90;
const API_BASE = 'https://api.umkl.co.uk';
const DEV_MODE_SEQUENCE = ['d', 'e', 'v'];

const calendarContainer = document.getElementById("calendar-container");
const calendarListView = document.getElementById("calendarListView");
const expandedLog = document.getElementById("expandedLog");
const calendarError = document.getElementById("calendarError");
const overseasMessage = document.getElementById("overseasMessage");
const calendarDays = document.getElementById("calendarDays");

const currentYear = new Date().getFullYear();
const startYear = 2023;
const minYear = startYear + 1;
const maxYear = currentYear + 1;

let currentlyShownDate = [2000, 0];
let matchData = [];
let matchDataToUse = [];
let teamColors = [];
let currentlyShownLog = null;
let devMode = false;
let cached = false;
let discardLogOnChange = false;
let listViewEnabled = false;
let listViewToggledOnce = false;
let overseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1 || false;
let eventliveIndicatorToUpdate;
let previewTimeout = null;
let currentPreview = null;
let refreshTimer = null;
let listViewOverlay = null;
let retryCount = 0;

const YTSVGPATH = `<img class="ytsvg" alt="YouTube logo" src="assets/media/calendar/youtubelogo.svg">`;

document.addEventListener("DOMContentLoaded", async () => {
    const startTime = performance.now();
    console.debug(`%cmatchcalendar.js %c> %cFetching calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    generateListViewButton();
    checkIfOutsideUK();

    if (localStorage.matchDataCache && localStorage.teamColorsCache) {
        try {
            cached = true;
            console.debug(`%cmatchcalendar.js %c> %cRendering calendar (cache)...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
            matchData = JSON.parse(localStorage.matchDataCache);
            teamColors = JSON.parse(localStorage.teamColorsCache);
            makeTeamsColorStyles();
            loadCalendarView();
        } catch {
            localStorage.matchDataCache = "";
            localStorage.teamColorsCache = "";
        }
    }

    try {
        matchData = await getMatchData();
        teamColors = await getTeamColors();
    } catch (error) {
        console.debug(`%cmatchcalendar.js %c> %cAPI failed - using fallback information...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        await getMatchDataFallback();
        await getTeamColorsFallback();

        if (error?.message?.includes('429')) {
            calendarError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Your device or network is sending too many requests, so you have been rate-limited. Please try again later.</blockquote>`;
        } else {
            calendarError.innerHTML = `<blockquote class="fail"><b>API error</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
            if (refreshTimer) clearTimeout(refreshTimer);
            const retryFetch = debounce(async () => {
                try {
                    retryCount++;
                    matchData = await getMatchData();
                    teamColors = await getTeamColors();
                    calendarError.innerHTML = "";
                    makeTeamsColorStyles();
                    displayCalendar();
                } catch {
                    calendarError.innerHTML = `<blockquote class="fail"><b>API error - Retrying: attempt ${retryCount}...</b><br>Failed to fetch match data from the API, the below information may not be up to date!</blockquote>`;
                    refreshTimer = setTimeout(retryFetch, 2000);
                }
            }, 2000);
            refreshTimer = setTimeout(retryFetch, 2000);
        }
    }

    localStorage.setItem("matchDataCache", JSON.stringify(matchData));
    localStorage.setItem("teamColorsCache", JSON.stringify(teamColors));
    document.dispatchEvent(new CustomEvent('removeScrollbarFromCalendarListView'));
    cached = false;
    listViewToggledOnce = false;
    discardLogOnChange = false;
    makeTeamsColorStyles();
    loadCalendarView();
    console.debug(`%cmatchcalendar.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
});

const fetchAPI = async (endpoint, body = {}) => {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    localStorage.setItem("apiReqsSent", (parseInt(localStorage.getItem("apiReqsSent")) || 0) + 1);
    return response.json();
};

const getMatchData = () => fetchAPI('matchdata', {});
const getTeamColors = () => fetchAPI('teamcolors', {});
const getLiveResults = () => fetchAPI('live', {});

const getMatchDataFallback = async () => {
    const response = await fetch('database/matchdatafallback.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    matchData = await response.json();
};

const getTeamColorsFallback = async () => {
    const response = await fetch('database/teamcolorsfallback.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    teamColors = await response.json();
};

const makePossessive = name => !name ? "" : (name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`);

const uses12HourClock = locale => {
    const test = new Date('1970-01-01T13:00');
    return test.toLocaleTimeString(locale).toLowerCase().includes('pm');
};

const formatTime = (timeStr, is12Hour = false) => {
    const [hourStr, minuteStr] = timeStr.split(":");
    let hours = parseInt(hourStr, 10);
    let suffix = "";
    if (is12Hour) {
        suffix = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
    }
    return is12Hour
        ? `${hours}:${minuteStr.padStart(2, "0")} ${suffix}`
        : `${hourStr.padStart(2, "0")}:${minuteStr.padStart(2, "0")}`;
};

const formatMatchTime = (date, timeString, locale) => {
    const is12Hour = uses12HourClock(locale);
    const isoStr = `${date}T${timeString}`;
    const dateObj = new Date(isoStr);

    const UKTime = new Intl.DateTimeFormat(locale, {
        timeZone: "Europe/London",
        hour: is12Hour ? "numeric" : "2-digit",
        minute: "2-digit",
        hour12: is12Hour,
    }).format(dateObj);

    const localTime = new Intl.DateTimeFormat(locale, {
        hour: is12Hour ? "numeric" : "2-digit",
        minute: "2-digit",
        hour12: is12Hour,
    }).format(dateObj);

    const outsideUKTimezone = checkTimezoneMatches(date, timeString);

    let formattedMatchTime, formattedLocalMatchTime;
    if (outsideUKTimezone) {
        formattedMatchTime = UKTime;
        formattedLocalMatchTime = localTime;
    } else {
        formattedMatchTime = UKTime;
        formattedLocalMatchTime = null;
    }

    if (formattedMatchTime === formattedLocalMatchTime) {
        return { formattedMatchTime, formattedLocalMatchTime: null, outsideUKTimezone: false };
    }

    return { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone };
};

const checkTimezoneMatches = (dateStr, timeStr) => {
    const match = timeStr.match(/([+-]\d{2}):([0-5]\d)$/);
    if (!match) return false;

    const [, offsetH, offsetM] = match;
    const offsetMinutes = parseInt(offsetH, 10) * 60 + parseInt(offsetM, 10) * (offsetH.startsWith("-") ? -1 : 1);

    const [hourStr, minuteStr] = timeStr.split(":");
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);

    const [year, month, day] = dateStr.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    const londonTime = new Date(utcDate.toLocaleString("en-GB", { timeZone: "Europe/London" }));
    const londonOffsetMinutes = (londonTime - utcDate) / 60000;

    return offsetMinutes !== londonOffsetMinutes;
};

const compareDayRelation = (dateStr1, dateStr2) => {
    const parseDate = (str) => {
        const separator = str.includes('/') ? '/' : '-';
        const [part1, part2, part3] = str.split(separator).map(Number);
        return separator === '/' ? new Date(part3, part2 - 1, part1) : new Date(part1, part2 - 1, part3);
    };

    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));

    if (overseasDateDisplay) {
        if (diffDays === -1) return `Day<br>after`;
        if (diffDays === 1) return `Day<br>before`;
    } else {
        if (diffDays === 1) return `Day<br>after`;
        if (diffDays === -1) return `Day<br>before`;
    }
    return "";
};

const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const normalizeMatchData = (data) => {
    const localMatchData = {};
    for (const dateKey in data) {
        for (const entry of data[dateKey]) {
            const matchDate = new Date(`${dateKey}T${entry.time}`);
            const localDateKey = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}-${String(matchDate.getDate()).padStart(2, '0')}`;
            if (!localMatchData[localDateKey]) localMatchData[localDateKey] = [];
            localMatchData[localDateKey].push(entry);
        }
    }
    return localMatchData;
};

const sortMatchesByTime = (matches) => [...matches].sort((a, b) => (a.time || '00:00:00').localeCompare(b.time || '00:00:00'));

const autoLink = (text) => {
    text = text.replaceAll("\n", "<br>");
    const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
    return text.replace(urlRegex, (url) => {
        let href = url;
        let displayUrl = url;
        let trailingDot = '';
        if (displayUrl.endsWith('.')) {
            displayUrl = displayUrl.slice(0, -1);
            href = href.slice(0, -1);
            trailingDot = '.';
        }
        if (!href.match(/^https?:\/\//)) href = 'http://' + href;
        return `<a translate="no" href="${href}" target="_blank">${displayUrl}</a>${trailingDot}`;
    });
};

const formatResults = (results) => {
    if (!results || results.length !== 2) return '';
    const [, teamAScore, teamAPenalty] = results[0];
    const [, teamBScore, teamBPenalty] = results[1];
    const hasPenalty = teamAPenalty !== 0 || teamBPenalty !== 0;
    return `${teamAScore} - ${teamBScore}${hasPenalty ? `<p class="penalty-text">-${teamAPenalty}        -${teamBPenalty}</p>` : ''}`;
};

const createTeamObject = (teamName) => ({
    team_name: teamName,
    class_name: teamName.replace(/\s+/g, ''),
    link: `pages/teams/details/?team=${teamName}`
});

function createEmptyCells(count) {
    for (let i = 0; i < count; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'empty');
        calendarDays.appendChild(emptyCell);
    }
}

function generateCalendar(month, year, dateParam = null) {
    const startDay = localStorage.getItem("startDay") || DEFAULT_START_DAY;
    const monthYear = document.getElementById('monthYear');

    const adjustedWeekdayNames = WEEKDAY_NAMES.slice(startDay).concat(WEEKDAY_NAMES.slice(0, startDay));

    monthYear.innerHTML = `
        <a class="month-arrow fa-solid fa-arrow-left ${(year == minYear && month == 0) ? "empty" : ""}" id="previousMonthButton"></a>
        <span class="month-name" id="goToCurrentMonthButton">${Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(year, month))} ${year}</span>
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

    matchDataToUse = overseasDateDisplay ? normalizeMatchData(matchData) : matchData;
    const teamColorsMap = new Map(teamColors.map(t => [t.team_name, t.team_color]));

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.textContent = day;
        dayCell.classList.add('day');

        const today = new Date();
        const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
        if (isToday && !cached) {
            setTimeout(() => dayCell.classList.add('today'), 50);
        }

        const dateToCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (matchDataToUse[dateToCheck]) {
            matchDataToUse[dateToCheck] = sortMatchesByTime(matchDataToUse[dateToCheck]);

            matchDataToUse[dateToCheck].forEach(entry => {
                const [team1, team2] = entry.teamsInvolved;
                const color1 = teamColorsMap.get(team1) || "#ccc";
                const color2 = teamColorsMap.get(team2) || "#ccc";

                const colorBarContainer = document.createElement('div');
                colorBarContainer.classList.add('color-bar-container');

                const createColorBar = (isLeft) => {
                    const div = document.createElement('div');
                    div.classList.add('team-color-bar');
                    div.style.backgroundColor = isLeft ? color1 : color2;
                    if (isLeft) {
                        div.style.borderTopLeftRadius = '2px';
                        div.style.borderBottomLeftRadius = '2px';
                    } else {
                        div.style.borderTopRightRadius = '2px';
                        div.style.borderBottomRightRadius = '2px';
                    }
                    if (entry.testMatch) {
                        div.style.backgroundImage = `repeating-conic-gradient(rgba(255,255,255,0.6) 0deg 90deg, rgba(0,0,0,0.15) 90deg 180deg)`;
                        div.style.backgroundSize = '9px 9px';
                        div.style.backgroundRepeat = 'repeat';
                        div.style.backgroundPosition = 'center';
                    }
                    return div;
                };

                colorBarContainer.appendChild(createColorBar(true));
                colorBarContainer.appendChild(createColorBar(false));
                dayCell.appendChild(colorBarContainer);
            });

            dayCell.classList.add('logged');
            if (dateParam === dateToCheck) dayCell.classList.add('selected');
            dayCell.addEventListener('click', () => showDailyLog(dateToCheck, dayCell));
        }

        calendarDays.appendChild(dayCell);
    }

    const totalCells = firstDay + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) createEmptyCells(remainingCells);

    discardLogOnChange = true;
}

function changeMonth(change) {
    const newDate = new Date(currentlyShownDate[0], currentlyShownDate[1] + change);
    if (newDate.getFullYear() < minYear || newDate.getFullYear() > maxYear ||
        (newDate.getFullYear() === minYear && newDate.getMonth() < 0) ||
        (newDate.getFullYear() === maxYear && newDate.getMonth() > 11)) {
        return;
    }
    generateCalendar(newDate.getMonth(), newDate.getFullYear());
}

function showMonthPicker(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (currentPreview?.parentNode) return;

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
                ${MONTHS.map((m, i) => `<option value="${i}"${i === currentlyShownDate[1] ? ' selected' : ''}>${m}</option>`).join('')}
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

    const resetAutoCloseTimer = () => {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(closePreview, 5000);
    };

    const handleDropdownChange = () => {
        generateCalendar(Number(monthDropdown.value), Number(yearDropdown.value));
        resetAutoCloseTimer();
    };

    monthDropdown.addEventListener('click', resetAutoCloseTimer);
    yearDropdown.addEventListener('click', resetAutoCloseTimer);
    monthDropdown.addEventListener('change', handleDropdownChange);
    yearDropdown.addEventListener('change', handleDropdownChange);

    const closePreview = () => {
        if (!preview?.parentNode) return;
        preview.style.transform = 'scale(0.95) translateY(-10px)';
        preview.style.opacity = '0';
        document.removeEventListener('mousedown', handleClickOutside);
        setTimeout(cleanupPopupPreview, 150);
    };

    const handleClickOutside = (e) => {
        if (!preview.contains(e.target)) closePreview();
    };

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
    if (currentPreview?.parentNode) currentPreview.remove();
    currentPreview = null;
}

function changeShownDay(change) {
    if (!currentlyShownLog) return;
    const dates = Object.keys(matchDataToUse).sort();
    let currentIndex = dates.indexOf(currentlyShownLog);
    if (currentIndex === -1) {
        currentIndex = dates.findIndex(d => d > currentlyShownLog);
        if (currentIndex === -1) currentIndex = dates.length;
    }
    let newIndex = currentIndex + change;
    if (dates[currentIndex] && dates[currentIndex] > currentlyShownLog && change < 0) newIndex = currentIndex - 1;
    if (newIndex < 0 || newIndex >= dates.length) return;
    return dates[newIndex];
}

function createMatchHTML(entry, index, date, locale, is12Hour, liveResults) {
    const [team1Name, team2Name] = entry.teamsInvolved;
    const team1 = createTeamObject(team1Name);
    const team2 = createTeamObject(team2Name);

    const timeString = entry.time || '00:00:00';
    const { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone } = formatMatchTime(date, timeString, locale);

    let formattedLocalDate, dayRelation;
    if (outsideUKTimezone) {
        formattedLocalDate = new Date(`${date}T${timeString}`).toLocaleString(locale, { dateStyle: "short" });
        dayRelation = compareDayRelation(formattedLocalDate, date);
    }

    let isLive = false;
    let timeUntilMatch;
    if (entry.time) {
        const [hours, minutes] = entry.time.split(':');
        const dateObj = new Date(date);
        dateObj.setHours(Number(hours), Number(minutes), 0, 0);
        const now = new Date();
        const matchStart = dateObj;
        const matchEnd = new Date(matchStart.getTime() + MATCH_LENGTH_MINS * 60 * 1000);

        if (now >= matchStart && now <= matchEnd) {
            isLive = true;
        } else if (!entry.endTime) {
            const diffMs = dateObj.getTime() - now.getTime();
            if (diffMs <= 0) {
                timeUntilMatch = "0:00:00";
            } else {
                const totalSeconds = Math.floor(diffMs / 1000);
                const days = Math.floor(totalSeconds / 86400);
                const hours = Math.floor((totalSeconds % 86400) / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                timeUntilMatch = `${days > 0 ? `${days}d ` : ''}${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            }
        }

        if (!isLive && !entry.endTime) {
            const countdownId = `matchCountdown${entry.eventID}`;
            setTimeout(() => {
                const interval = setInterval(async () => {
                    const countdownElement = document.getElementById(countdownId);
                    if (!countdownElement) { clearInterval(interval); return; }
                    const now = new Date();
                    const diffMs = dateObj.getTime() - now.getTime();
                    if (diffMs <= 0) {
                        countdownElement.innerHTML = "0:00:00";
                        clearInterval(interval);
                        matchData = await getMatchData();
                        loadCalendarView();
                        const urlParams = new URLSearchParams(window.location.search);
                        const dateParam = urlParams.get('date');
                        if (dateParam && matchData[dateParam]) showDailyLog(dateParam);
                    } else {
                        const totalSeconds = Math.floor(diffMs / 1000);
                        const days = Math.floor(totalSeconds / 86400);
                        const hours = Math.floor((totalSeconds % 86400) / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        countdownElement.innerHTML = `<i class="fa-solid fa-clock"></i> ${days > 0 ? `${days}d ` : ''}${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                    }
                }, 1000);
            }, 0);
        }
    }

    const resultsHTML = formatResults(entry.results);

    let matchEndedText = '';
    if (entry.endTime) {
        isLive = false;
        const formattedEndTime = formatTime(entry.endTime, is12Hour);
        const isoStr = `${date}T${entry.endTime}`;
        const dateObj = new Date(isoStr);
        const londonFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "short" });
        const zoneName = londonFormatter.formatToParts(dateObj).find(p => p.type === "timeZoneName")?.value || "";
        matchEndedText = `Match started at ${formattedMatchTime} and ended at ${formattedEndTime} (${zoneName})`;
    }

    if (entry.ytLinks) {
        team1.youtubeLink = entry.ytLinks[0];
        team2.youtubeLink = entry.ytLinks[1];
    }

    const matchDetailsLink = resultsHTML && entry.detailedResults ? generate6v6ScoreCalculatorLink(entry) : '';

    if (isLive && !entry.endTime) eventliveIndicatorToUpdate = entry.eventID;

    return `
        <div class="event-wrapper">
            <div class="event-container" id="event${index}">
                <div class="team-box-container">
                    <div class="team-background left ${team1.class_name}"></div>
                    <div class="team-background right ${team2.class_name}"></div>
                    ${!entry.testMatch ? `<picture><source srcset="assets/media/calendar/event_box_overlay.avif" type="image/avif"><img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.png" alt="Team background overlay" ${cached ? `` : 'onload="this.style.opacity=1"'} loading="lazy"/></picture>` : ''}
                    ${entry.testMatch ? `<div class="test-match-indicator"><i class="fa-solid fa-test"></i> Test match</div>` : ''}
                    ${entry.endTime ? '' : `${isLive ? `<div class="test-match-indicator ${entry.testMatch ? 'push-lower' : ''}" id='liveIndicator${entry.eventID}'><span style="display:flex"><div class="live-dot"></div>Live ${devMode && !entry.endTime ? `${liveResults.length + 1 > 12 ? '(Finishing up...)' : `(${liveResults.length + 1}/12)`}` : ''}</span></div>` : `<div class="test-match-indicator timer-indicator ${entry.testMatch ? 'push-lower' : ''}" id="matchCountdown${entry.eventID}"><i class="fa-solid fa-clock"></i> ${timeUntilMatch}</div>`}`}
                    ${devMode && !entry.endTime ? `<div class="test-match-indicator signed-up-count">Players signed up: ${team1.team_name}: ${entry.signedUpPlayerCounts[0]} | ${team2.team_name}: ${entry.signedUpPlayerCounts[1]}</div>` : ''}
                    <div class="event-overlay" translate="no">
                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link team-box-underline-hover" href="${team1.link}">
                                <picture>
                                        <source srcset="assets/media/teamemblems/${team1.team_name.toUpperCase()}.avif" type="image/avif">
                                        <img height="100px" class="team-box-image" src="assets/media/teamemblems/og/${team1.team_name.toUpperCase()}.png" alt="${makePossessive(team1.team_name)} team logo" loading="lazy" ${cached ? `` : 'onload="this.style.opacity=1"'} onerror="this.onerror=null; this.src='assets/media/teamemblems/og/DEFAULT.png'; this.parentNode.querySelector('source').srcset='assets/media/teamemblems/DEFAULT.avif';">
                                    </picture>
                                <h2>${team1.team_name}</h2>
                            </a>
                            <div class="youtube-box left-team">
                                ${team1.youtubeLink ? `<a class="no-underline-link-footer ${isLive ? 'youtube-live-animation' : 'no-color-link'}" href="${team1.youtubeLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'Open the livestream'}">${YTSVGPATH}</a>` : ''}
                            </div>
                        </div>
                        <div class="score-box">${matchDetailsLink ? `<a class="no-underline-link" href="${matchDetailsLink}" title="View detailed results">${resultsHTML || "VS"}</a>` : `${resultsHTML || "VS"}`}</div>
                        <div class="event-box-team">
                            <a class="no-underline-link no-color-link team-box-underline-hover" href="${team2.link}">
                                <picture>
                                        <source srcset="assets/media/teamemblems/${team2.team_name.toUpperCase()}.avif" type="image/avif">
                                        <img height="100px" class="team-box-image" src="assets/media/teamemblems/og/${team2.team_name.toUpperCase()}.png" alt="${makePossessive(team2.team_name)} team logo" loading="lazy" ${cached ? `` : 'onload="this.style.opacity=1"'} onerror="this.onerror=null; this.src='assets/media/teamemblems/og/DEFAULT.png'; this.parentNode.querySelector('source').srcset='assets/media/teamemblems/DEFAULT.avif';">
                                    </picture>
                                <h2>${team2.team_name}</h2>
                            </a>
                            <div class="youtube-box right-team">
                                ${team2.youtubeLink ? `<a class="no-underline-link-footer ${isLive ? 'youtube-live-animation' : 'no-color-link'}" href="${team2.youtubeLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'Open the livestream'}">${YTSVGPATH}</a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="match-details-box">
                    <div class="match-date-time-box">
                        <div class="match-detail-container">
                            ${overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ``}
                            <i class="${outsideUKTimezone ? 'local-time-clock' : ''} fa-solid fa-clock"></i>
                            <h2>
                                <span translate="no" title="${matchEndedText}">${formattedMatchTime}</span>
                                ${outsideUKTimezone ? `<span translate="no" title="Local time" style="display: inline-flex; align-items: center;">|&nbsp;<i class="overseas-time-clock fa-solid fa-clock"></i>${formattedLocalMatchTime}</span>` : ''}
                            </h2>
                            ${!overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ''}
                            ${isLive ? '<div class="live-dot"></div>' : ''}
                        </div>
                    </div>
                    <p class="match-season">${entry.testMatch ? 'Test match' : `Season ${entry.season}`}</p>
                </div>
                <details class="match-box">
                    <summary>Match details</summary>
                    <p class="match-description">${autoLink(entry.description)}</p>
                </details>
            </div>
        </div>
    `;
}

async function showDailyLog(date, dayCell) {
    currentlyShownLog = date;
    listViewToggledOnce = false;

    if (dayCell) {
        document.querySelectorAll('.day.selected').forEach(day => day.classList.remove('selected'));
        dayCell.classList.add('selected');
    }

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('date', date);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    if (window.location.href !== newUrl) window.history.replaceState({}, '', newUrl);

    const locale = localStorage.getItem("locale") || "en-GB";
    const log = matchDataToUse[date] || [];

    if (log.length) {
        const liveResults = await getLiveResults();
        const sortedLog = sortMatchesByTime(log);
        const formattedDate = parseLocalDate(date).toLocaleString(locale, { dateStyle: "full" });
        const is12Hour = uses12HourClock(locale);

        expandedLog.innerHTML = `
            <div class="current-season-area"> 
                <h3 style="margin: 3px">${formattedDate}</h3>                            
                <button id="shareButton"><span class="fa-solid fa-share"></span> Share Date</button>
            </div>
            <hr class="after-title" style="margin-bottom:10px;">
            ${sortedLog.map((entry, index) => createMatchHTML(entry, index, date, locale, is12Hour, liveResults)).join('')}
        `;

        createShareButtonListener(formattedDate);
    } else {
        expandedLog.innerHTML = `<div class="settingSubheading">Select a date to see the matches happening on that day.</div>`;
        clearURLParams();
    }
}

function generateCalendarListView() {
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    matchDataToUse = overseasDateDisplay ? normalizeMatchData(matchData) : matchData;
    const sortedDates = Object.keys(matchDataToUse);
    const locale = localStorage.getItem("locale") || "en-GB";

    if (listViewOverlay) listViewOverlay.remove();

    listViewOverlay = document.createElement('div');
    listViewOverlay.id = 'listViewOverlay';
    listViewOverlay.innerHTML = `
        <div class="list-view-slide-over">
            <div class="list-view-header">
                <h2>All Matches</h2>
                <button class="close-list-view-button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="list-view-content" id="listViewContent"></div>
        </div>
    `;
    document.body.appendChild(listViewOverlay);

    const listViewContent = listViewOverlay.querySelector('#listViewContent');
    let HTMLOutput = "";
    let todayMarkerInserted = false;

    for (const date of sortedDates) {
        if (!todayMarkerInserted && formattedToday < date) {
            HTMLOutput += `<div class="today-marker">Today - ${new Date(formattedToday).toLocaleDateString(locale, { dateStyle: 'long' })}</div><hr>`;
            todayMarkerInserted = true;
        }

        const formattedDate = parseLocalDate(date).toLocaleString(locale, { dateStyle: "full" });
        HTMLOutput += `<h3 class="list-view-date-header" data-date="${date}">${formattedToday === date ? ' ☆ ' : ''}${formattedDate}</h3>`;

        const sortedMatches = sortMatchesByTime(matchDataToUse[date]);
        const is12Hour = uses12HourClock(locale);

        for (const entry of sortedMatches) {
            const [team1Name, team2Name] = entry.teamsInvolved;
            const team1 = createTeamObject(team1Name);
            const team2 = createTeamObject(team2Name);

            const timeString = entry.time || '00:00:00';
            const { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone } = formatMatchTime(date, timeString, locale);

            let formattedLocalDate, dayRelation;
            if (outsideUKTimezone) {
                formattedLocalDate = new Date(`${date}T${timeString}`).toLocaleString(locale, { dateStyle: "short" });
                dayRelation = compareDayRelation(formattedLocalDate, date);
            }

            let isLive = false;
            if (entry.time) {
                const [hours, minutes] = entry.time.split(':');
                const dateObj = new Date(formattedDate);
                dateObj.setHours(Number(hours), Number(minutes), 0, 0);
                const now = new Date();
                const matchEnd = new Date(dateObj.getTime() + MATCH_LENGTH_MINS * 60 * 1000);
                isLive = now >= dateObj && now <= matchEnd;
            }

            const resultsHTML = formatResults(entry.results);

            let matchEndedText = '';
            if (entry.endTime) {
                const formattedEndTime = formatTime(entry.endTime, is12Hour);
                const isoStr = `${date}T${entry.endTime}`;
                const dateObj = new Date(isoStr);
                const londonFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "short" });
                const zoneName = londonFormatter.formatToParts(dateObj).find(p => p.type === "timeZoneName")?.value || "";
                matchEndedText = `Match started at ${formattedMatchTime} and ended at ${formattedEndTime} (${zoneName})`;
            }

            if (entry.ytLinks) {
                team1.youtubeLink = entry.ytLinks[0];
                team2.youtubeLink = entry.ytLinks[1];
            }

            const matchDetailsLink = resultsHTML && entry.detailedResults ? generate6v6ScoreCalculatorLink(entry) : '';

            HTMLOutput += `
                <div class="event-container">
                    <div class="team-box-container">
                        <div class="team-background left ${team1.class_name}"></div>
                        <div class="team-background right ${team2.class_name}"></div>
                        ${!entry.testMatch ? `<picture><source srcset="assets/media/calendar/event_box_overlay.avif" type="image/avif"><img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.jpg" alt="Team background overlay" ${cached ? `` : 'onload="this.style.opacity=1"'} loading="lazy"/></picture>` : ''}
                        ${entry.testMatch ? `<div class="test-match-indicator"><i class="fa-solid fa-test"></i> Test match</div>` : ''}
                        <div class="event-overlay">
                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link team-box-underline-hover" href="${team1.link}">
                                    <picture>
                                        <source srcset="assets/media/teamemblems/${team1.team_name.toUpperCase()}.avif" type="image/avif">
                                        <img height="100px" class="team-box-image" src="assets/media/teamemblems/og/${team1.team_name.toUpperCase()}.png" alt="${makePossessive(team1.team_name)} team logo" loading="lazy" ${cached ? `` : 'onload="this.style.opacity=1"'} onerror="this.onerror=null; this.src='assets/media/teamemblems/og/DEFAULT.png'; this.parentNode.querySelector('source').srcset='assets/media/teamemblems/DEFAULT.avif';">
                                    </picture>
                                    <h2>${team1.team_name}</h2>
                                </a>
                                <div class="youtube-box left-team">
                                    ${team1.youtubeLink ? `<a class="no-underline-link-footer ${isLive ? 'youtube-live-animation' : 'no-color-link'}" href="${team1.youtubeLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'View the archived livestream'}">${YTSVGPATH}</a>` : ''}
                                </div>
                            </div>
                            <div class="score-box">${matchDetailsLink ? `<a class="no-underline-link" href="${matchDetailsLink}" title="View detailed results">${resultsHTML || "VS"}</a>` : `${resultsHTML || "VS"}`}</div>
                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link team-box-underline-hover" href="${team2.link}">
                                    <picture>
                                        <source srcset="assets/media/teamemblems/${team2.team_name.toUpperCase()}.avif" type="image/avif">
                                        <img height="100px" class="team-box-image" src="assets/media/teamemblems/og/${team2.team_name.toUpperCase()}.png" alt="${makePossessive(team2.team_name)} team logo" loading="lazy" ${cached ? `` : 'onload="this.style.opacity=1"'} onerror="this.onerror=null; this.src='assets/media/teamemblems/og/DEFAULT.png'; this.parentNode.querySelector('source').srcset='assets/media/teamemblems/DEFAULT.avif';">
                                    </picture>
                                    <h2>${team2.team_name}</h2>
                                </a>
                                <div class="youtube-box right-team">
                                    ${team2.youtubeLink ? `<a class="no-underline-link-footer ${isLive ? 'youtube-live-animation' : 'no-color-link'}" href="${team2.youtubeLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'View the archived livestream'}">${YTSVGPATH}</a>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="match-details-box">
                        <div class="match-date-time-box">
                            <div class="match-detail-container">
                                ${overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ``}
                                <i class="${outsideUKTimezone ? 'local-time-clock' : ''} fa-solid fa-clock"></i>
                                <h2>
                                    <span title="${matchEndedText}">${formattedMatchTime}</span>
                                    ${outsideUKTimezone ? `<span title="Local time" style="display: inline-flex; align-items: center;">|&nbsp;<i class="overseas-time-clock fa-solid fa-clock"></i>${formattedLocalMatchTime}</span>` : ''}
                                </h2>
                                ${!overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ''}
                                ${isLive ? '<div class="live-dot"></div>' : ''}
                            </div>
                        </div>
                        <p class="match-season">${entry.testMatch ? 'Test match' : `Season ${entry.season}`}</p>
                    </div>
                    <details class="match-box">
                        <summary>Match details</summary>
                        <p class="match-description">${autoLink(entry.description)}</p>
                    </details>
                </div>
            `;
        }
    }

    listViewContent.innerHTML = HTMLOutput;

    listViewContent.querySelectorAll('.list-view-date-header').forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const date = header.dataset.date;
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('date', date);
            window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
            toggleListView(false);
            displayCalendar();
        });
    });

    listViewOverlay.querySelector('.close-list-view-button').addEventListener('click', () => toggleListView(false));
    listViewOverlay.addEventListener('click', (e) => { if (e.target === listViewOverlay) toggleListView(false); });

    requestAnimationFrame(() => listViewOverlay.classList.add('active'));
    scrollMatchList();
}

function scrollMatchList() {
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const listViewContent = document.getElementById('listViewContent');
    if (!listViewContent) return;

    const targetDate = dateParam || formattedToday;
    const target = listViewContent.querySelector(`.list-view-date-header[data-date="${targetDate}"]`);
    if (target) listViewContent.scrollTo({ top: target.offsetTop - listViewContent.offsetTop - 20 });
}

function clearURLParams() {
    if (cached) return;
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('date');
    const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    if (window.location.href !== newUrl) window.history.replaceState({}, '', newUrl);
}

function createShareButtonListener(formattedDate) {
    const shareButton = document.getElementById("shareButton");
    setOriginalMessage(shareButton.innerHTML);
    shareButton.addEventListener("click", async () => generateMatchImage());
}

document.addEventListener('startDayChange', () => displayCalendar());

function makeTeamsColorStyles() {
    const styleSheet = document.createElement("style");
    teamColors.forEach((team) => {
        styleSheet.innerText += `.${team.team_name.replace(/\s+/g, '')} { cursor: pointer; background-color: ${team.team_color}; }`;
    });
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

function findEventByID(graphEventID) {
    if (!graphEventID) return null;

    for (const [date, events] of Object.entries(matchData)) {
        const found = events.find(event => event.eventID === graphEventID);
        if (found) {
            return found;
        }
    }

    return null;
}

function displayCalendar() {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const graphEventID = urlParams.get('graphEventID');
    if (graphEventID) {
        let event = findEventByID(graphEventID);
        window.location.href = generate6v6ScoreCalculatorLink(event);
    }
    if (dateParam && matchData[dateParam]) {
        console.debug(`%cmatchcalendar.js %c> %cURL parameter detected`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        const dateObj = new Date(dateParam);
        generateCalendar(dateObj.getMonth(), dateObj.getFullYear(), dateParam);
        showDailyLog(dateParam);
    } else {
        const currentDate = new Date();
        generateCalendar(currentDate.getMonth(), currentDate.getFullYear());
        showDailyLog(currentDate.toISOString().split('T')[0]);
    }
}

function generateListViewButton() {
    const listViewButton = document.getElementById("listViewButton");
    listViewButton.onclick = () => { listViewEnabled = !listViewEnabled; toggleListView(listViewEnabled); };
}

function toggleListView(enable) {
    if (enable) {
        generateCalendarListView();
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
        if (listViewOverlay) {
            listViewOverlay.classList.remove('active');
            setTimeout(() => { if (listViewOverlay) { listViewOverlay.remove(); listViewOverlay = null; } }, 300);
        }
        listViewEnabled = false;
    }
}

function loadCalendarView() {
    listViewEnabled ? generateCalendarListView() : displayCalendar();
}

function checkIfOutsideUK() {
    const { outsideUKTimezone } = formatMatchTime('2025-01-01', '00:00:00+01:00', "en-GB");
    if (outsideUKTimezone) {
        overseasMessage.classList.remove("hidden");
        overseasMessage.innerHTML = `
            <b translate="no">Note</b><br>You seem to be outside the UK.
            Times and dates displayed will show the UK time, then your local time next to it.<br>
            <b>Overseas date type:</b> <button id="overseasDisplayButton"><span class="fa-solid fa-bars"></span> Overseas Display Toggle</button>
        `;
        generateOverseasDateDisplayButton();
    }
}

function updateButton() {
    const tempOverseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1;
    const overseasDisplayButton = document.getElementById("overseasDisplayButton");
    if (overseasDisplayButton) {
        overseasDisplayButton.innerHTML = `<span class="fa-solid ${tempOverseasDateDisplay ? 'fa-earth' : 'fa-house'}"></span> ${tempOverseasDateDisplay ? 'Overseas' : 'UK'}`;
    }
}

function generateOverseasDateDisplayButton() {
    const overseasDisplayButton = document.getElementById("overseasDisplayButton");
    updateButton();
    overseasDisplayButton.onclick = () => {
        const tempOverseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1;
        localStorage.setItem("overseasDateDisplay", tempOverseasDateDisplay ? 0 : 1);
        location.reload();
    };
}

const debounce = (fn, delay) => {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

let keySequence = [];
let isKeyPressed = false;

const handleKeyNavigation = (e) => {
    const key = e.key.toLowerCase();
    if (!isKeyPressed) {
        let newDate;
        if (key === 'arrowleft') {
            isKeyPressed = true;
            newDate = changeShownDay(-1);
        } else if (key === 'arrowright') {
            isKeyPressed = true;
            newDate = changeShownDay(1);
        }
        if (newDate) {
            const dateObj = new Date(newDate);
            generateCalendar(dateObj.getMonth(), dateObj.getFullYear(), newDate);
            showDailyLog(newDate);
        }
        if (key === '[') { isKeyPressed = true; changeMonth(-1); }
        if (key === ']') { isKeyPressed = true; changeMonth(1); }

        keySequence.push(key);
        if (keySequence.length > DEV_MODE_SEQUENCE.length) keySequence.shift();
        if (keySequence.join('') === DEV_MODE_SEQUENCE.join('')) {
            devMode = !devMode;
            loadCalendarView();
            const urlParams = new URLSearchParams(window.location.search);
            const dateParam = urlParams.get('date');
            if (dateParam && matchData[dateParam]) showDailyLog(dateParam);
            keySequence = [];
            if (refreshTimer) clearTimeout(refreshTimer);
            refreshTimer = setTimeout(updateFetch, 30000);
        }
    }
};

const updateFetch = async () => {
    try {
        const liveResults = await getLiveResults();
        matchData = await getMatchData();
        matchDataToUse = overseasDateDisplay ? normalizeMatchData(matchData) : matchData;
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        const liveIndicatorDiv = document.getElementById(`liveIndicator${eventliveIndicatorToUpdate}`);
        if (liveIndicatorDiv) {
            const isLive = matchDataToUse[dateParam || Object.keys(matchDataToUse)[0]]?.some(entry => entry.eventID === eventliveIndicatorToUpdate && !entry.endTime) || false;
            if (!isLive) {
                liveIndicatorDiv.innerHTML = '';
            } else {
                const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                const calculatePoints = (positions) => positions.reduce((sum, pos) => sum + (pos >= 1 && pos <= scoreMap.length ? scoreMap[pos - 1] : sum), 0);
                const teamAPoints = liveResults.reduce((total, race) => total + calculatePoints(race["1"] || []), 0);
                const teamBPoints = liveResults.reduce((total, race) => total + calculatePoints(race["2"] || []), 0);
                liveIndicatorDiv.innerHTML = `<span style="display:flex"><div class="live-dot"></div>Live ${devMode ? `${liveResults.length + 1 > 12 ? '(Finishing up...)' : `(${teamAPoints} - ${teamBPoints} | ${liveResults.length + 1}/12)`}` : ''}</span>`;
            }
        }
    } finally {
        refreshTimer = setTimeout(updateFetch, 30000);
    }
};

document.addEventListener('keydown', handleKeyNavigation);
document.addEventListener('keyup', () => { isKeyPressed = false; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && listViewOverlay?.classList.contains('active')) toggleListView(false); });
document.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 's') generateMatchImage(); });

async function generateMatchImage() {
    try {
        if (getIsPopupShowing()) return;
        const useClipboard = isWindowsOrLinux() || !navigator.canShare;
        let blob;
        const nodes = document.querySelectorAll('.event-wrapper');

        for (const node of nodes) {
            const matchBoxes = node.querySelectorAll('.match-box, .timer-indicator, .youtube-box');
            matchBoxes.forEach(el => el.style.display = 'none');
            const eventContainer = node.querySelector('.event-container');
            eventContainer.style.paddingBottom = '29px';
            const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2 });
            matchBoxes.forEach(el => el.style.display = '');
            eventContainer.style.paddingBottom = '';
            const response = await fetch(dataUrl);
            blob = await response.blob();
        }

        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        const locale = localStorage.getItem("locale") || "en-GB";
        const formattedDate = parseLocalDate(dateParam).toLocaleString(locale, { dateStyle: "full" });
        const message = `Check out this match happening on ${formattedDate}!`;

        if (useClipboard) {
            const success = await copyTextToClipboard(message);
            const shareButton = document.getElementById("shareButton");
            shareButton.innerText = success ? "Copied to clipboard!" : "Failed to copy!";
            showImagePreview(blob, blob.url, message);
        } else {
            await shareImage(`Match Sharing`, message, blob, `UMKL_match.png`);
        }
    } catch (err) { console.error("Failed to copy to clipboard!:", err); }
}