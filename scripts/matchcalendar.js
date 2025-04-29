const weekdayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const weekdayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULTSTARTDAY = 1;

const expandedLog = document.getElementById('expandedLog');

let currentlyShownDate = [2000, 0];
let dailyLogData = {};
let teamColorsData = {};

let generatedStyleSheets = false;

function createEmptyCells(count) {
    for (let i = 0; i < count; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day');
        emptyCell.classList.add('empty');
        calendarDays.appendChild(emptyCell);
    }
}

function generateCalendar(month, year, startDay) {

    if (startDay == null || isNaN(startDay)) startDay = DEFAULTSTARTDAY;
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
            dayCell.classList.add('today');
        }
        
        const dateToCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dailyLogData[dateToCheck]) {
            const [team1, team2] = dailyLogData[dateToCheck][0].teamsInvolved;
            const color1 = teamColorsData[team1];
            const color2 = teamColorsData[team2];
        
            const colorBarContainer = document.createElement('div');
            colorBarContainer.classList.add('color-bar-container');
        
            const team1Div = document.createElement('div');
            team1Div.classList.add('team-color-bar');
            team1Div.style.backgroundColor = color1;
        
            const team2Div = document.createElement('div');
            team2Div.classList.add('team-color-bar');
            team2Div.style.backgroundColor = color2;
        
            colorBarContainer.appendChild(team1Div);
            colorBarContainer.appendChild(team2Div);
        
            dayCell.appendChild(colorBarContainer);
            dayCell.classList.add('logged');
            dayCell.addEventListener('click', () => showDailyLog(dateToCheck));
        }
        
        calendarDays.appendChild(dayCell);
    };

    const totalCells = firstDay + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
        createEmptyCells(remainingCells);
    }

    generatedStyleSheets = true;
};

function changeMonth(change) {
    const newDate = new Date(currentlyShownDate[0], currentlyShownDate[1] + change);
    generateCalendar(newDate.getMonth(), newDate.getFullYear(), parseInt(localStorage.getItem("startDay")));
};

function showDailyLog(date) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('date', date);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    if (window.location.href !== newUrl) {
        window.history.pushState({}, '', newUrl);
    }

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

// function createTeamDots(team1, team2) {
//     const team1Dot = document.createElement('div');
//     const team2Dot = document.createElement('div');


//     const team1Color = teamColorsData[team1];
//     const team2Color = teamColorsData[team2];

//     styleSheet.innerText = `
//         .${team1}-vs-${team2} {
//             color: #FFF;
//             background: linear-gradient(to bottom right, ${team1Color}EE, ${team1Color}EE, var(--bg-color), ${team2Color}EE, ${team2Color}EE);
//             background-size: 300% 300%;
//             animation: gradient 5s ease infinite;
//         }

//         @keyframes gradient {
//             0% {
//                 background-position: 0% 50%;
//             }
//             50% {
//                 background-position: 100% 50%;
//             }
//             100% {
//                 background-position: 0% 50%;
//             }
//         }
//     `;

//     document.head.appendChild(styleSheet);
//     console.debug(`%cmatchcalendar.js %c> %cAdded style sheet: .${team1}-vs-${team2}`, "color:#fffc45", "color:#fff", "color:#fcfb9a");
// }

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