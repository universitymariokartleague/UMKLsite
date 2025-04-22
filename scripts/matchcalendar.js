const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULTSTARTDAY = 1;

const calendarSettings = document.getElementById('calendarSettings');
const expandedLog = document.getElementById('expandedLog');

let currentlyShownDate = [2000, 0];
let dailyLogData = {};
let teamColorsData = {};

function generateCalendar(month, year, startDay) {    
    if (startDay == null || isNaN(startDay)) startDay = DEFAULTSTARTDAY;

    const monthYear = document.getElementById('monthYear');
    const calendarDays = document.getElementById('calendarDays');
    const adjustedWeekdayNames = weekdayNames.slice(startDay).concat(weekdayNames.slice(0, startDay));

    monthYear.innerHTML = `
        <button id="previousMonthButton">Prev</button>
        ${Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(year, month)).toUpperCase()} ${year}
        <button id="nextMonthButton">Next</button>
    `;

    document.getElementById('previousMonthButton').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthButton').addEventListener('click', () => changeMonth(1));

    calendarDays.innerHTML = '';
    expandedLog.innerHTML = '';
    currentlyShownDate = [year, month];

    const firstDay = (new Date(year, month, 1).getDay() - startDay + 7) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    adjustedWeekdayNames.forEach(day => {
        const weekdayCell = document.createElement('div');
        weekdayCell.classList.add('day');
        weekdayCell.textContent = day;
        calendarDays.appendChild(weekdayCell);
    });

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day');
        calendarDays.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.textContent = day;
        dayCell.classList.add('day');
        
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            console.log(dayCell)
            dayCell.innerHTML = "☆" + day;
            dayCell.classList.add('today');
        }
        
        const dateToCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dailyLogData[dateToCheck]) {
            const [team1, team2] = dailyLogData[dateToCheck][0].teamsInvolved;
            // dayCell.classList.remove('today');
            dayCell.classList.add('logged', team1, team2);
            dayCell.addEventListener('click', () => showDailyLog(dateToCheck));
        }
        calendarDays.appendChild(dayCell);
    }
}

function changeMonth(change) {
    const newDate = new Date(currentlyShownDate[0], currentlyShownDate[1] + change);
    generateCalendar(newDate.getMonth(), newDate.getFullYear(), parseInt(localStorage.getItem("startDay")));
}

function showDailyLog(date) {
    const log = dailyLogData[date] || [];
    expandedLog.innerHTML = `
        <div class="settingSubheading">
        <hr class="settings-hr">
        ${log.length ? log.map((entry, index) => `
            <b>
                <span class=${entry.teamsInvolved[0]}>${entry.teamsInvolved[0]}</span> 
                VS 
                <span class="${entry.teamsInvolved[1]}">${entry.teamsInvolved[1]}</span> | ${date} (${weekdayNames[new Date(date).getDay()]})</b>
                <br/>
                ${entry.description.replace(/(?:\r\n|\r|\n)/g, '<br/>')}`).join('<br/><hr/>') : 'No logs for this day'
        }
    `;
}

// Listen for theme change event
document.addEventListener('startDayChange', (event) => {
    displayCalendar();
});

function makeTeamsColorStyles() {
    const styleSheet = document.createElement("style");

    Object.entries(teamColorsData).forEach(([team, color]) => {
        // console.log(`Team: ${team}, Color: ${color}`);
        styleSheet.innerText += `
            .${team} {
                cursor: pointer;
                border: 2px solid ${color};
                background-color: ${color}50;
            }
        `
    });

    document.head.appendChild(styleSheet);
}

function displayCalendar() {
    let dailyLogPath = "database/matchdata.json"
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
            makeTeamsColorStyles();
            console.debug(`%cmatchcalendar.js %c> %cTeam colors loaded: ${JSON.stringify(teamColorsData)}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        })
        .catch(error => {
            console.debug(`%cmatchcalendar.js %c> %cError loading team colors: ${error}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        });

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
                generateCalendar(currentDate.getMonth(), currentDate.getFullYear(), parseInt(localStorage.getItem("startDay")));        
                console.debug(`%cmatchcalendar.js %c> %cMatch data loaded: ${JSON.stringify(dailyLogData)}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
            })
            .catch(error => {
                console.debug(`%cmatchcalendar.js %c> %cError loading match data: ${error}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
            });
}

displayCalendar();