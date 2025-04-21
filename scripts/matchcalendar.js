const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULTSTARTDAY = 1;

const calendarSettings = document.getElementById('calendarSettings');
const expandedLog = document.getElementById('expandedLog');

let currentlyShownDate = [2000, 0];
let dailyLogData = {};

function generateCalendar(month, year, startDay) {
    if (startDay == null) startDay = DEFAULTSTARTDAY;

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
        dayCell.classList.add('day');
        const dateToCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dailyLogData[dateToCheck]) {
            dayCell.classList.add('logged');
            dayCell.addEventListener('click', () => showDailyLog(dateToCheck));
        }
        dayCell.textContent = day;
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
        ${log.length ? log.map((entry, index) => `<b>${entry.title} | ${date} (${weekdayNames[new Date(date).getDay()]})</b><br/>${entry.description.replace(/(?:\r\n|\r|\n)/g, '<br/>')}`).join('<br/><hr/>') : 'No logs for this day'}
    `;
}

function updateSettings() {
    const tempStartDay = localStorage.getItem("startDay") || DEFAULTSTARTDAY;

    calendarSettings.innerHTML = `
        <div class="setting-sub-heading">Localization</div><hr class="settings-hr">
        First day of week <a href="javascript:void(0)" id="toggleStartDayButton" class="settings-option">${weekdayNamesFull[tempStartDay]}</a>
        <span class="settingsExtraInfo">(Monday or Sunday)</span><br/>

        <div class="setting-sub-heading">Data</div><hr class="settings-hr">
        Add daily log <input type="text" placeholder="Enter log" id="dailyLogText"> <input type="date" placeholder="Enter date" id="dailyLogDate"> <a href="javascript:void(0)" id="addDailyLogButton" class="settings-option">Add</a><br/>
    `;
    generateEventListeners();
}

function generateEventListeners() {
    document.getElementById('toggleStartDayButton').addEventListener('click', toggleStartDay);
    document.getElementById('addDailyLogButton').addEventListener('click', addDailyLogData);
}
function toggleStartDay() {
    const newStartDay = localStorage.getItem("startDay") == 0 ? 1 : 0;
    localStorage.setItem("startDay", newStartDay);
    console.log(`Set startDay to ${newStartDay} (${weekdayNamesFull[newStartDay]})`);
    displayCalendar();
    updateSettings();
}

function addDailyLogData() {
    const dailyLogText = document.getElementById('dailyLogText').value;
    const dailyLogDate = document.getElementById('dailyLogDate').value;

    if (!dailyLogText || !dailyLogDate) {
        alert('Please enter both a log and a date');
        return;
    }

    if (!dailyLogData[dailyLogDate]) {
        dailyLogData[dailyLogDate] = [];
    }

    dailyLogData[dailyLogDate].push(dailyLogText);

    console.log(`Added daily log to ${dailyLogDate}`);
    updateSettings();
    displayCalendar();

    console.log(JSON.stringify(dailyLogData))
}

// function downloadDailyLogData() {
//     const data = JSON.stringify(dailyLogData, null, 4);
//     const blob = new Blob([data], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'dailyLogData.json';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     console.log('Downloaded daily log data');
// }

// function uploadDailyLogData() {
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = '.json';
//     input.onchange = e => {
//         const file = e.target.files[0];
//         const reader = new FileReader();
//         reader.onload = () => {
//             dailyLogData = JSON.parse(reader.result);
//             console.log('Uploaded daily log data');
//             updateSettings();
//             displayCalendar();
//         };
//         reader.readAsText(file);
//     };
//     input.click();
// }

function displayCalendar() {
    let dailyLogPath = "database/matchdata.json"
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
            console.log('Match data loaded:', dailyLogData);
        })
        .catch(error => {
            console.error('Error loading match data:', error);
        });
}

displayCalendar();
updateSettings();