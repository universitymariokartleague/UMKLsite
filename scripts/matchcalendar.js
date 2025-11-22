/*
    This script is responsible for displaying a clickable calendar with upcoming matches on the 
    matches page. It fetches match data from a JSON file and displays it in a calendar format.
    The calendar allows users to click on a date to view the matches scheduled for that day.
*/

import { isWindowsOrLinux, copyTextToClipboard, getIsPopupShowing, shareText, shareImage, showTextPopup, showImagePreview, setOriginalMessage } from './shareAPIhelper.js';

const weekdayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DEFAULTSTARTDAY = 1;
const MATCH_LENGTH_MINS = 90;

const calendarContainer = document.getElementById("calendar-container");
const calendarListView = document.getElementById("calendarListView");
const expandedLog = document.getElementById("expandedLog");
const calendarError = document.getElementById("calendarError")
const overseasMessage = document.getElementById("overseasMessage");

const currentYear = new Date().getFullYear();
const startYear = 2023; // currentYear of season = startYear + season (eg: season 1 - 2023 + 1 = 2024)
const minYear = startYear + 1; // Minimum year for the calendar, prevents going back to 2023
const maxYear = currentYear + 1; // Maximum year for the calendar, allows going up to 2 years in the future
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
let currentlyShownDate = [2000, 0];
let matchData = [];
let matchDataToUse = [];
let teamColors = [];

let currentlyShownLog = null;
let isKeyPressed = false;
let keySequence = [];
const devModeSequence = ['d', 'e', 'v'];

let refreshTimer = null;

let discardLogOnChange = false;

let previewTimeout = null;
let currentPreview = null;

let listViewEnabled = false;
let listViewToggledOnce = false;

let overseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1 || false;
let cached = false;

let eventliveIndicatorToUpdate;
let devMode = false;

let startTime;

function createEmptyCells(count) {
    for (let i = 0; i < count; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'empty');
        calendarDays.appendChild(emptyCell);
    }
}

function normalizeMatchData(matchData) {
    const localMatchData = {};

    Object.keys(matchData).forEach(dateKey => {
        matchData[dateKey].forEach(entry => {
            const matchDate = new Date(`${dateKey}T${entry.time}`);

            const localYear = matchDate.getFullYear();
            const localMonth = matchDate.getMonth() + 1;
            const localDay = matchDate.getDate();

            const localDateKey = `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;

            if (!localMatchData[localDateKey]) {
                localMatchData[localDateKey] = [];
            }
            localMatchData[localDateKey].push(entry);
        });
    });

    return localMatchData;
}

function generateCalendar(month, year, dateParam = null) {
    const startDay = localStorage.getItem("startDay") || DEFAULTSTARTDAY;

    const monthYear = document.getElementById('monthYear');
    const calendarDays = document.getElementById('calendarDays');
    const adjustedWeekdayNames = weekdayNames.slice(startDay).concat(weekdayNames.slice(0, startDay));

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

    if (overseasDateDisplay) {
        matchDataToUse = normalizeMatchData(matchData);
    } else {
        matchDataToUse = matchData;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.textContent = day;
        dayCell.classList.add('day');

        const today = new Date();
        const isToday = (year === today.getFullYear() && month === today.getMonth() && day === today.getDate());
        if (isToday) {
            if (!cached) {
                setTimeout(() => {
                    dayCell.classList.add('today');
                }, 50);
            }
        }

        const dateToCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (matchDataToUse[dateToCheck]) {
            const sortedMatches = [...matchDataToUse[dateToCheck]].sort((a, b) => {
                const timeA = a.time || '00:00:00';
                const timeB = b.time || '00:00:00';
                return timeA.localeCompare(timeB);
            });
            matchDataToUse[dateToCheck] = sortedMatches;
        }

        if (matchDataToUse[dateToCheck]) {
            matchDataToUse[dateToCheck].forEach(entry => {
                const [team1, team2] = entry.teamsInvolved;

                // Find team color by team name from teamColors[0] array
                const color1 = (teamColors.find(t => t.team_name === team1) || {}).team_color || "#ccc";
                const color2 = (teamColors.find(t => t.team_name === team2) || {}).team_color || "#ccc";

                const colorBarContainer = document.createElement('div');
                colorBarContainer.classList.add('color-bar-container');

                const team1Div = document.createElement('div');
                team1Div.classList.add('team-color-bar');
                team1Div.style.borderTopLeftRadius = '5px';
                team1Div.style.borderBottomLeftRadius = '5px';
                team1Div.style.backgroundColor = color1;

                const team2Div = document.createElement('div');
                team2Div.classList.add('team-color-bar');
                team2Div.style.borderTopRightRadius = '5px';
                team2Div.style.borderBottomRightRadius = '5px';
                team2Div.style.backgroundColor = color2;

                // use a checkered pattern for test matches
                if (entry.testMatch) {
                    const checkerPattern = `
                        repeating-conic-gradient(
                        rgba(255,255,255,0.6) 0deg 90deg,
                        rgba(0,0,0,0.15) 90deg 180deg
                        )
                    `;

                    [team1Div, team2Div].forEach(teamDiv => {
                        const color = teamDiv === team1Div ? color1 : color2;

                        teamDiv.style.backgroundColor = color;
                        teamDiv.style.backgroundImage = checkerPattern;
                        teamDiv.style.backgroundSize = '9px 9px';
                        teamDiv.style.backgroundRepeat = 'repeat';
                        teamDiv.style.backgroundPosition = 'center';
                    });
                }

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
}

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
}

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

function changeShownDay(change) {
    if (!currentlyShownLog) return;

    const dates = Object.keys(matchDataToUse).sort();
    let currentIndex = dates.indexOf(currentlyShownLog);

    if (currentIndex === -1) {
        currentIndex = dates.findIndex(d => d > currentlyShownLog);
        if (currentIndex === -1) {
            currentIndex = dates.length;
        }
    }

    let newIndex = currentIndex + change;
    if (dates[currentIndex] && dates[currentIndex] > currentlyShownLog && change < 0) {
        newIndex = currentIndex - 1;
    }

    if (newIndex < 0 || newIndex >= dates.length) {
        return;
    }

    return dates[newIndex];
}

function generate6v6ScoreCalculatorLink(entry) {
    const url = new URL("pages/tools/6v6scorecalculator/", window.location.origin);

    const positionsString = entry.detailedResults
        .map(race => race[1].join(',')) // take only the "1" array - {1: Array(6), 2: Array(6), track: 'GCN Baby Park'}
        .join('\n');

    const tracksString = entry.detailedResults
        .map(race => race.track)
        .join('\n');

    const teamsString = entry.teamsInvolved.join('\n');

    const compressedMatchName = LZString.compressToEncodedURIComponent(entry.title);
    const compressedPositions = LZString.compressToEncodedURIComponent(positionsString);
    const compressedTracks = LZString.compressToEncodedURIComponent(tracksString);
    const compressedTeams = LZString.compressToEncodedURIComponent(teamsString);

    url.searchParams.set('m', compressedMatchName);
    url.searchParams.set('p', compressedPositions);
    url.searchParams.set('t', compressedTracks);
    url.searchParams.set('n', compressedTeams);

    return url;
}

async function showDailyLog(date, dayCell) {
    currentlyShownLog = date;

    listViewToggledOnce = false;

    if (dayCell) {
        document.querySelectorAll('.day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        dayCell.classList.add('selected');
    }

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('date', date);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    if (window.location.href !== newUrl) {
        window.history.replaceState({}, '', newUrl);
    }
    const locale = localStorage.getItem("locale") || "en-GB";

    const log = matchDataToUse[date] || [];
    if (log.length) {
        let liveResults = await getLiveResults();

        const sortedLog = [...log].sort((a, b) => {
            const timeA = a.time || '00:00:00';
            const timeB = b.time || '00:00:00';
            return timeA.localeCompare(timeB);
        });

        const formattedDate = parseLocalDate(date).toLocaleString(locale, { dateStyle: "full" });
        let formattedLocalDate, dayRelation;
        expandedLog.innerHTML = `
            <div class="current-season-area"> 
                <h3 style="margin: 3px">${formattedDate}</h3>                            
                <button id="shareButton"><span class="fa-solid fa-share"></span> Share Date</button>
            </div>
            <hr class="after-title" style="margin-bottom:0;">
        ${sortedLog.map((entry, index) => {
            function createTeamObject(teamName) {
                return {
                    team_name: teamName,
                    class_name: teamName.replace(/\s+/g, ''),
                    link: `pages/teams/details/?team=${teamName}`
                };
            }

            const [team1, team2] = entry.teamsInvolved.map(createTeamObject);

            const is12Hour = uses12HourClock(locale);
            let timeString = entry.time || '00:00:00';
            const { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone } = formatMatchTime(date, timeString, locale);

            if (outsideUKTimezone) {
                formattedLocalDate = new Date(`${date}T${timeString}`).toLocaleString(locale, { dateStyle: "short" });
                dayRelation = compareDayRelation(formattedLocalDate, date);
            }

            let isLive = false;
            let timeUntilMatch;
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

                if (!isLive) {
                    const now = new Date();
                    const diffMs = dateObj.getTime() - now.getTime();

                    if (diffMs <= 0) {
                        timeUntilMatch = "0:00:00";
                    } else {
                        const totalSeconds = Math.floor(diffMs / 1000);
                        const days = Math.floor(totalSeconds / 86400);
                        const hours = Math.floor((totalSeconds % 86400) / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        timeUntilMatch = `${days > 0 ? `${days.toString()}d `: ''}${hours.toString()}:${minutes
                            .toString()
                            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                    }
                }

                if (!isLive && !entry.endTime) {
                    let interval = setInterval(async () => {
                        const countdownElement = document.getElementById(`matchCountdown${entry.eventID}`);
                        if (!countdownElement) {
                            clearInterval(interval);
                            return;
                        }

                        const now = new Date();
                        const diffMs = dateObj.getTime() - now.getTime();

                        if (diffMs <= 0) {
                            countdownElement.innerHTML = "0:00:00";
                            clearInterval(interval);
                            matchData = await getMatchData();
                            loadCalendarView();
                            const urlParams = new URLSearchParams(window.location.search);
                            const dateParam = urlParams.get('date');
                            if (dateParam && matchData[dateParam]) {
                                showDailyLog(dateParam);
                            }
                        } else {
                            const totalSeconds = Math.floor(diffMs / 1000);
                            const days = Math.floor(totalSeconds / 86400);
                            const hours = Math.floor((totalSeconds % 86400) / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            countdownElement.innerHTML = `<i class="fa-solid fa-clock"></i> ${days > 0 ? `${days.toString()}d `: ''}${hours.toString()}:${minutes
                                .toString()
                                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                        }
                    }, 1000);
                }
            }
            const resultsHTML = formatResults(entry.results);

            let matchEndedText = ''
            if (entry.endTime) {
                isLive = false;
                function formatTime(timeStr, is12Hour = false) {
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
                }
                let formattedEndTime = formatTime(entry.endTime, is12Hour);
                const isoStr = `${date}T${entry.endTime}`;
                const dateObj = new Date(isoStr);
                const londonFormatter = new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Europe/London",
                    timeZoneName: "short"
                });
                const parts = londonFormatter.formatToParts(dateObj);
                const zoneName = parts.find(p => p.type === "timeZoneName")?.value || "";
                matchEndedText = `Match started at ${formattedMatchTime} and ended at ${formattedEndTime} (${zoneName})`;
            }

            if (entry.ytLinks) {
                team1.ytLink = entry.ytLinks[0]
                team2.ytLink = entry.ytLinks[1]
            }

            let calculatorlink = '';
            if (resultsHTML && entry.detailedResults) calculatorlink = generate6v6ScoreCalculatorLink(entry);

            if (isLive && !entry.endTime) {
                eventliveIndicatorToUpdate = entry.eventID;
            }

            return `
                <div class="event-container">
                    <div class="team-box-container">
                        <div class="team-background left ${team1.class_name}"></div>
                        <div class="team-background right ${team2.class_name}"></div>
                        ${!entry.testMatch ? `<img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.avif"
                        alt="Team background overlay"
                        ${cached ? `` : 'onload="this.style.opacity=1"'} loading="lazy"/>` : ''}
                        
                        ${entry.testMatch ? `<div class="test-match-indicator"><i class="fa-solid fa-test"></i> Test match</div>` : ''}
                        ${entry.endTime ? '' : `${isLive ? `<div class="test-match-indicator ${entry.testMatch ? 'push-lower' : ''}" id='liveIndicator${entry.eventID}'><span style="display:flex"><div class="live-dot"></div>Live ${devMode && !entry.endTime ? `${liveResults.length + 1 > 12 ? '(Finishing up...)' : `(${liveResults.length + 1}/12)`}` : ''}</span></div>` : `<div class="test-match-indicator ${entry.testMatch ? 'push-lower' : ''}" id="matchCountdown${entry.eventID}"><i class="fa-solid fa-clock"></i> ${timeUntilMatch}</div>`}`}
                        ${devMode && !entry.endTime ? `<div class="test-match-indicator signed-up-count">Players signed up: ${team1.team_name}: ${entry.signedUpPlayerCounts[0]} | ${team2.team_name}: ${entry.signedUpPlayerCounts[1]}</div>` : ''}

                        <div class="event-overlay" translate="no">
                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link team-box-underline-hover" href="${team1.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team1.team_name.toUpperCase()}.avif"
                                    alt="${makePossessive(team1.team_name)} team logo" loading="lazy"
                                    ${cached ? `` : 'onload="this.style.opacity=1"'}
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';"/>
                                    <h2>${team1.team_name}</h2>
                                </a>
                                <div class="youtube-box left-team">
                                    ${team1.ytLink ? `
                                    <a class="no-underline-link-footer fa-brands fa-youtube ${isLive ? 'youtube-live-animation' : 'no-color-link'}"
                                    href="${team1.ytLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'Open the livestream'}"></a>` : ''}
                                </div>
                            </div>

                            <div class="score-box">${calculatorlink ? `<a href="${calculatorlink}" title="View detailed results">${resultsHTML ? formatResults(entry.results) : "VS"}</a>` : `${resultsHTML ? formatResults(entry.results) : "VS"}`}</div>       

                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link team-box-underline-hover" href="${team2.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team2.team_name.toUpperCase()}.avif"
                                    alt="${makePossessive(team2.team_name)} team logo" loading="lazy"
                                    ${cached ? `` : 'onload="this.style.opacity=1"'}
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';"/>
                                    <h2>${team2.team_name}</h2>
                                </a>
                                <div class="youtube-box right-team">
                                    ${team2.ytLink ? `
                                    <a class="no-underline-link-footer fa-brands fa-youtube ${isLive ? 'youtube-live-animation' : 'no-color-link'}"
                                    href="${team2.ytLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'Open the livestream'}"></a>` : ''}
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
                                    ${outsideUKTimezone ? `
                                        <span translate="no" title="Local time" style="display: inline-flex; align-items: center;">
                                        |&nbsp;<i class="overseas-time-clock fa-solid fa-clock"></i>${formattedLocalMatchTime}</span>` : ''}
                                </h2>
                                ${!overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ``}
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
    const formattedToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    if (overseasDateDisplay) {
        matchDataToUse = normalizeMatchData(matchData);
    } else {
        matchDataToUse = matchData;
    }
    const sortedDates = Object.keys(matchDataToUse);
    let todayMarkerInserted = false;

    const locale = localStorage.getItem("locale") || "en-GB";

    calendarListView.innerHTML = "";
    let HTMLOutput = "";

    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];

        if (!todayMarkerInserted && formattedToday < date) {
            HTMLOutput += `
                <div class="today-marker">
                    Today - ${new Date(formattedToday).toLocaleDateString(locale, { dateStyle: 'long' })}
                </div><hr>
            `;
            todayMarkerInserted = true;
        }

        const formattedDate = parseLocalDate(date).toLocaleString(locale, { dateStyle: "full" });
        HTMLOutput += `
            <h3 id=${date}>${formattedToday == date ? ' ☆ ' : ''}${formattedDate}</h3>
        `

        const sortedMatches = [...matchDataToUse[date]].sort((a, b) => {
            const timeA = a.time || '00:00:00';
            const timeB = b.time || '00:00:00';
            return timeA.localeCompare(timeB);
        });

        sortedMatches.forEach(entry => {
            function createTeamObject(teamName) {
                return {
                    team_name: teamName,
                    class_name: teamName.replace(/\s+/g, ''),
                    link: `pages/teams/details/?team=${teamName}`
                };
            }
            const [team1, team2] = entry.teamsInvolved.map(createTeamObject);

            const is12Hour = uses12HourClock(locale);
            let timeString = entry.time || '00:00:00';
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
                const matchStart = dateObj;
                const matchEnd = new Date(matchStart.getTime() + MATCH_LENGTH_MINS * 60 * 1000);
                if (now >= matchStart && now <= matchEnd) {
                    isLive = true;
                }
            }

            const resultsHTML = formatResults(entry.results);

            let matchEndedText = ''
            if (entry.endTime) {
                function formatTime(timeStr, is12Hour = false) {
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
                }
                let formattedEndTime = formatTime(entry.endTime, is12Hour);
                const isoStr = `${date}T${entry.endTime}`;
                const dateObj = new Date(isoStr);
                const londonFormatter = new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Europe/London",
                    timeZoneName: "short"
                });
                const parts = londonFormatter.formatToParts(dateObj);
                const zoneName = parts.find(p => p.type === "timeZoneName")?.value || "";
                matchEndedText = `Match started at ${formattedMatchTime} and ended at ${formattedEndTime} (${zoneName})`;
            }

            if (entry.ytLinks) {
                team1.ytLink = entry.ytLinks[0]
                team2.ytLink = entry.ytLinks[1]
            }
            HTMLOutput += `
                <div class="event-container">
                    <div class="team-box-container">
                        <div class="team-background left ${team1.class_name}"></div>
                        <div class="team-background right ${team2.class_name}"></div>
                        ${!entry.testMatch ? `<img class="team-background-overlay" src="assets/media/calendar/event_box_overlay.avif"
                        alt="Team background overlay"
                        ${cached ? `` : 'onload="this.style.opacity=1"'} loading="lazy"/>` : ''}

                        ${entry.testMatch ? `<div class="test-match-indicator"><i class="fa-solid fa-test"></i> Test match</div>` : ''}

                        <div class="event-overlay">
                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link team-box-underline-hover" href="${team1.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team1.team_name.toUpperCase()}.avif"
                                    alt="${makePossessive(team1.team_name)} team logo" loading="lazy"
                                    ${cached ? `` : 'onload="this.style.opacity=1"'}
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';"/>
                                    <h2>${team1.team_name}</h2>
                                </a>
                                <div class="youtube-box left-team">
                                    ${team1.ytLink ? `
                                    <a class="no-underline-link-footer fa-brands fa-youtube ${isLive ? 'youtube-live-animation' : 'no-color-link'}"
                                    href="${team1.ytLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'View the archived livestream'}"></a>` : ''}
                                </div>
                            </div>

                            <div class="score-box">${resultsHTML ? resultsHTML : "VS"}</div>       

                            <div class="event-box-team">
                                <a class="no-underline-link no-color-link team-box-underline-hover" href="${team2.link}">
                                    <img height="100px" class="team-box-image" src="assets/media/teamemblems/${team2.team_name.toUpperCase()}.avif"
                                    alt="${makePossessive(team1.team_name)} team logo" loading="lazy"
                                    ${cached ? `` : 'onload="this.style.opacity=1"'}
                                    onerror="this.onerror=null; this.src='assets/media/teamemblems/DEFAULT.avif';"/>
                                    <h2>${team2.team_name}</h2>
                                </a>
                                <div class="youtube-box right-team">
                                    ${team2.ytLink ? `
                                    <a class="no-underline-link-footer fa-brands fa-youtube ${isLive ? 'youtube-live-animation' : 'no-color-link'}"
                                    href="${team2.ytLink}" target="_blank" title="${isLive ? 'Watch the livestream' : 'View the archived livestream'}"></a>` : ''}
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
                                    ${outsideUKTimezone ? `
                                        <span title="Local time" style="display: inline-flex; align-items: center;">
                                        |&nbsp;<i class="overseas-time-clock fa-solid fa-clock"></i>${formattedLocalMatchTime}</span>` : ''}
                                </h2>
                                ${!overseasDateDisplay && dayRelation ? `<span class="dayRelation">${dayRelation}</span>` : ``}
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
            `
        });
    };

    calendarListView.innerHTML = HTMLOutput;
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
        return target.offsetTop - calendarListView.offsetTop;
    } else {
        calendarListView.scrollTo({
            top: calendarListView.scrollHeight
        });
        return calendarListView.scrollHeight;
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

function makePossessive(name) {
    if (!name) return '';
    if (name.endsWith('s') || name.endsWith('S')) {
        return `${name}'`;
    }
    return `${name}'s`;
}

function uses12HourClock(locale) {
    const test = new Date('1970-01-01T13:00');
    return test.toLocaleTimeString(locale).toLowerCase().includes('pm');
}

function formatMatchTime(date, timeString, locale) {
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

    let outsideUKTimezone = checkTimezoneMatches(date, timeString);

    let formattedMatchTime, formattedLocalMatchTime;
    if (outsideUKTimezone) {
        formattedMatchTime = UKTime;
        formattedLocalMatchTime = localTime;
    } else {
        formattedMatchTime = UKTime;
        formattedLocalMatchTime = null;
    }

    if (formattedMatchTime == formattedLocalMatchTime) {
        outsideUKTimezone = false;
    }

    return { formattedMatchTime, formattedLocalMatchTime, outsideUKTimezone };
}

function checkTimezoneMatches(dateStr, timeStr) {
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
}

function compareDayRelation(dateStr1, dateStr2) {
    function parseDate(str) {
        if (str.includes('/')) {
            const [day, month, year] = str.split('/').map(Number);
            return new Date(year, month - 1, day);
        } else if (str.includes('-')) {
            const [year, month, day] = str.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        throw new Error("Unsupported date format: " + str);
    }

    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);

    const day1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const day2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());

    const diffDays = Math.round((day1 - day2) / (1000 * 60 * 60 * 24));

    if (overseasDateDisplay) {
        if (diffDays === -1) return `Day<br>after`;
        if (diffDays === 1) return `Day<br>before`;
    } else {
        if (diffDays === 1) return `Day<br>after`;
        if (diffDays === -1) return `Day<br>before`;
    }
    return "";
}

function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
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
        return `<a translate="no" href="${href}" target="_blank">${displayUrl}</a>${trailingDot}`;
    })
}

function clearURLParams() {
    if (cached) return;
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
            shareButton.innerText = success ? "Copied to clipboard!" : "Failed to copy!";
            const messageWithURL = `Check out these UMKL matches on ${formattedDate}! <a href="${window.location.href}">${window.location.href}</a>`
            showTextPopup(messageWithURL)
        } else {
            await shareText(
                `UMKL Matches on ${formattedDate}`,
                message
            )
        }
    })
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
})

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
        })
}

async function getMatchDataFallback() {
    const response = await fetch(`database/matchdatafallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    matchData = await response.json();
}

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
        })
}

async function getTeamcolorsFallback() {
    const response = await fetch(`database/teamcolorsfallback.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    teamColors = await response.json();
}

async function getLiveResults() {
    return fetch('https://api.umkl.co.uk/live', {
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
        listViewButton.innerHTML = `${listViewEnabled ? `<span class="fa-solid fa-calendar"></span> Calendar View` : `<span class="fa-solid fa-bars"></span> List View`}`

        changeCalendarView(listViewEnabled);

        localStorage.setItem("calendarListView", listViewEnabled ? 1 : 0);
    }
}

function changeCalendarView(listView) {
    if (listView) {
        generateCalendarListView();
        calendarListView.classList.remove("hidden")
        calendarContainer.classList.add("hidden")
        if (!listViewToggledOnce) {
            let y = scrollMatchList();
            document.dispatchEvent(new CustomEvent('scrollbarToCalendarListView', { detail: { scrollToY: y } }));
        }
        listViewToggledOnce = true;
    } else {
        document.dispatchEvent(new CustomEvent('removeScrollbarFromCalendarListView'));
        displayCalendar();
        calendarListView.classList.add("hidden")
        calendarContainer.classList.remove("hidden")
    }
}

function loadCalendarView() {
    const calendarListView = localStorage.getItem("calendarListView") == 1 || false;
    changeCalendarView(calendarListView);
    listViewEnabled = calendarListView;
    listViewButton.innerHTML = `${listViewEnabled ? `<span class="fa-solid fa-calendar"></span> Calendar View` : `<span class="fa-solid fa-bars"></span> List View`}`
}

function testOutsideUK() {
    let { _, __, outsideUKTimezone } = formatMatchTime('2025-01-01', '00:00:00+01:00', "en-GB");

    if (outsideUKTimezone) {
        overseasMessage.classList.remove("hidden");
        overseasMessage.innerHTML = `
            <b translate="no">Note</b><br/>You seem to be outside the UK.
            Times and dates displayed will show the UK time, then your local time next to it.<br/>
            <b>Overseas date type:</b> <button id="overseasDisplayButton"><span class="fa-solid fa-bars"></span> Overseas Display Toggle</button>
        `;
        generateOverseasDateDisplayButton();
    }
}

document.addEventListener('calendarListViewChange', async () => {
    loadCalendarView();
})

function updateButton() {
    const tempOverseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1;
    overseasDisplayButton.innerHTML = `<span class="fa-solid ${tempOverseasDateDisplay ? 'fa-earth' : 'fa-house'}"></span> ${tempOverseasDateDisplay ? 'Overseas' : 'UK'}`;
}

function generateOverseasDateDisplayButton() {
    const overseasDisplayButton = document.getElementById("overseasDisplayButton");

    updateButton();

    overseasDisplayButton.onclick = () => {
        const tempOverseasDateDisplay = localStorage.getItem("overseasDateDisplay") == 1;
        localStorage.setItem("overseasDateDisplay", tempOverseasDateDisplay ? 0 : 1);
        location.reload();
        document.dispatchEvent(new CustomEvent('startDayChange'));
    }
}

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

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

        if (key === '[') {
            isKeyPressed = true;
            changeMonth(-1);
        }
        if (key === ']') {
            isKeyPressed = true;
            changeMonth(1);
        }

        keySequence.push(key);
        if (keySequence.length > devModeSequence.length) {
            keySequence.shift();
        }
        if (keySequence.join('') == devModeSequence.join('')) {
            devMode = !devMode;
            loadCalendarView();
            const urlParams = new URLSearchParams(window.location.search);
            const dateParam = urlParams.get('date');
            if (dateParam && matchData[dateParam]) {
                showDailyLog(dateParam);
            }           
            keySequence = [];

            if (refreshTimer) clearTimeout(refreshTimer);

            const updateFetch = async () => {
                try {
                    let liveResults = await getLiveResults();
                    matchData = await getMatchData();
                    if (overseasDateDisplay) {
                        matchDataToUse = normalizeMatchData(matchData);
                    } else {
                        matchDataToUse = matchData;
                    }
                    const liveIndicatorDiv = document.getElementById(`liveIndicator${eventliveIndicatorToUpdate}`);
                    if (liveIndicatorDiv) {
                        let isLive = matchDataToUse[dateParam || Object.keys(matchDataToUse)[0]].some(entry => {
                            if (entry.eventID == eventliveIndicatorToUpdate) {
                                return !entry.endTime;
                            }
                            return false;
                        });
                        if (!isLive) {
                            liveIndicatorDiv.innerHTML = '';
                        } else {
                            const scoreMap = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                            const maxPos = scoreMap.length;

                            function calculatePoints(positions) {
                                return positions.reduce((sum, pos) => {
                                    if (pos >= 1 && pos <= maxPos) {
                                        return sum + scoreMap[pos - 1];
                                    }
                                    return sum;
                                }, 0);
                            }

                            let teamAPoints = liveResults.reduce((total, race) => {
                                return total + calculatePoints(race["1"] || []);
                            }, 0);

                            let teamBPoints = liveResults.reduce((total, race) => {
                                return total + calculatePoints(race["2"] || []);
                            }, 0);

                            let scores = [teamAPoints, teamBPoints]

                            liveIndicatorDiv.innerHTML = `<span style="display:flex"><div class="live-dot"></div>Live ${devMode && !matchDataToUse[dateParam || Object.keys(matchDataToUse)[0]][0].endTime ? `${liveResults.length + 1 > 12 ? '(Finishing up...)' : `(${scores[0]} - ${scores[1]} | <i class="fa-solid fa-flag-checkered"></i> ${liveResults.length + 1}/12)`}` : ''}</span>`;
                        }
                    };
                } finally {
                    refreshTimer = setTimeout(updateFetch, 30000);
                }
            };

            refreshTimer = setTimeout(updateFetch, 30000);
        }
    }
});

document.addEventListener('keyup', () => {
    isKeyPressed = false;
});

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cmatchcalendar.js %c> %cFetching calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    generateListViewButton();
    testOutsideUK();

    if (localStorage.matchDataCache && localStorage.teamColorsCache) {
        cached = true;
        console.debug(`%cmatchcalendar.js %c> %cRendering calendar (cache)...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        matchData = JSON.parse(localStorage.matchDataCache)
        teamColors = JSON.parse(localStorage.teamColorsCache)
        makeTeamsColorStyles();
        loadCalendarView();
    }

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

    localStorage.setItem("matchDataCache", JSON.stringify(matchData));
    localStorage.setItem("teamColorsCache", JSON.stringify(teamColors));
    listViewToggledOnce = false;
    discardLogOnChange = false;
    cached = false;
    document.dispatchEvent(new CustomEvent('removeScrollbarFromCalendarListView'));
    makeTeamsColorStyles();
    loadCalendarView();
    console.debug(`%cmatchcalendar.js %c> %cMatch data loaded in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
})