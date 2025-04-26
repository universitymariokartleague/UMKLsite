const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULTSTARTDAY = 1;

const expandedLog = document.getElementById('expandedLog');

let currentlyShownDate = [2000, 0];
let dailyLogData = {};
let teamColorsData = {};

let generatedStyleSheets = false;

function generateCalendar(month, year, startDay) {
    if (startDay == null || isNaN(startDay)) startDay = DEFAULTSTARTDAY;
    const tempMonthType = localStorage.getItem("monthType") || "long";

    const monthYear = document.getElementById('monthYear');
    const calendarDays = document.getElementById('calendarDays');
    const adjustedWeekdayNames = weekdayNames.slice(startDay).concat(weekdayNames.slice(0, startDay));

    monthYear.innerHTML = `
        <button id="previousMonthButton">Prev</button>
        <button id="goToCurrentMonthButton">${Intl.DateTimeFormat('en', { month: tempMonthType }).format(new Date(year, month))} ${year}</button>
        <button id="nextMonthButton">Next</button>
    `;

    const currentDate = new Date();
    document.getElementById('goToCurrentMonthButton').addEventListener('click', () => generateCalendar(currentDate.getMonth(), currentDate.getFullYear(), parseInt(localStorage.getItem("startDay"))));
    document.getElementById('previousMonthButton').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthButton').addEventListener('click', () => changeMonth(1));

    calendarDays.innerHTML = '';
    if (generatedStyleSheets) expandedLog.innerHTML = '';
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
    };

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.textContent = day;
        dayCell.classList.add('day');
        
        const today = new Date();
        const isToday = (year === today.getFullYear() && month === today.getMonth() && day === today.getDate());
        if (isToday) {
            dayCell.innerHTML = "☆" + day;
            dayCell.classList.add('today');
        }
        
        const dateToCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dailyLogData[dateToCheck]) {
            const [team1, team2] = dailyLogData[dateToCheck][0].teamsInvolved;
            if (!generatedStyleSheets) {
                createTeamStyleSheet(team1, team2);
            }
            dayCell.classList.add('logged', `${team1}-vs-${team2}`);
            dayCell.addEventListener('click', () => showDailyLog(dateToCheck));
        }
        calendarDays.appendChild(dayCell);
    };
    generatedStyleSheets = true;
};

function changeMonth(change) {
    const newDate = new Date(currentlyShownDate[0], currentlyShownDate[1] + change);
    generateCalendar(newDate.getMonth(), newDate.getFullYear(), parseInt(localStorage.getItem("startDay")));
};

function showDailyLog(date) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('date', date);

    const log = dailyLogData[date] || [];
    expandedLog.innerHTML = `
        <div class="settingSubheading">
        ${log.length ? log.map((entry, index) => {
            function createTeamObject(teamName) {
                return {
                    team_name: teamName,
                    class_name: teamName.replace(/\s+/g, ''),
                    link: `pages/teams/${teamName.replace(/\s+/g, '-').toLowerCase()}/`
                };
            }

            const [team1, team2] = entry.teamsInvolved.map(createTeamObject);
            return `
                <b>
                    <span class=${team1.class_name}><a class="no-color-link no-underline-link" href="${team1.link}">${team1.team_name}</a></span> 
                    VS 
                    <span class="${team2.class_name}"><a class="no-color-link no-underline-link" href="${team2.link}">${team2.team_name}</a></span>
                    | ${entry.time} ${date} (${weekdayNames[new Date(date).getDay()]})
                </b><br/>
                ${entry.description.replace(/(?:\r\n|\r|\n)/g, '<br/>')}`;
        }).join('<br/><hr/>') : 'No logs for this day'}
    `;
}

// Listen for theme change event
document.addEventListener('startDayChange', (event) => {
    displayCalendar();
});

function createTeamStyleSheet(team1, team2) {
    const styleSheet = document.createElement("style");

    const team1Color = teamColorsData[team1];
    const team2Color = teamColorsData[team2];

    styleSheet.innerText = `
        .${team1}-vs-${team2} {
            color: #FFF;
            background: linear-gradient(to bottom right, ${team1Color}EE, ${team1Color}EE, var(--bg-color), ${team2Color}EE, ${team2Color}EE);
            background-size: 300% 300%;
            animation: gradient 5s ease infinite;
        }

        @keyframes gradient {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
    `;

    document.head.appendChild(styleSheet);
    console.debug(`%cmatchcalendar.js %c> %cAdded style sheet: .${team1}-vs-${team2}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
}

function makeTeamsColorStyles() {
    const styleSheet = document.createElement("style");

    Object.entries(teamColorsData).forEach(([team, color]) => {
        styleSheet.innerText += `
            .${team} {
                cursor: pointer;
                border: 2px solid ${color};
                background-color: ${color}50;
                border-radius: 5px;
            }
        `
    });

    document.head.appendChild(styleSheet);
}

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
            makeTeamsColorStyles();
            console.debug(`%cmatchcalendar.js %c> %cTeam colors loaded: ${JSON.stringify(teamColorsData)}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
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
                    console.debug(`%cmatchcalendar.js %c> %cMatch data loaded`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
        
                    const urlParams = new URLSearchParams(window.location.search);
                    const dateParam = urlParams.get('date');
                    if (dateParam && dailyLogData[dateParam]) {
                        console.debug(`%cmatchcalendar.js %c> %cURL parameter detected`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
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
    console.debug(`%cmatchcalendar.js %c> %cLoading calendar...`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
    displayCalendar();
});