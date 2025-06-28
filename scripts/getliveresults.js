/*
    A script that fetches from live match data from api.umkl.co.uk/live
*/

let scores = []
const firstTeamScore = document.getElementById("firstteamscore")
const secondTeamScore = document.getElementById("secondteamscore")
const errorMessage = document.getElementById("errormessage")
let reversed = Boolean(document.body.dataset.reversed) || false;

let refreshTimer = null;

let startTime;

async function getLive() {
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

function animateNumberChange(element, oldValue, newValue, duration = 500, grow = false) {
    const startTime = performance.now();
    const difference = newValue - oldValue;

    if (grow) {
        element.classList.remove("grow");
        void element.offsetWidth; // force reflow
        element.classList.add("grow");
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.round(oldValue + difference * progress);
        element.innerText = currentValue;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function setScores() {
    const [newFirst, newSecond] = reversed ? [scores[1], scores[0]] : [scores[0], scores[1]];

    const currentFirst = parseInt(firstTeamScore.innerText) || 0;
    const currentSecond = parseInt(secondTeamScore.innerText) || 0;

    const deltaFirst = Math.abs(newFirst - currentFirst);
    const deltaSecond = Math.abs(newSecond - currentSecond);

    const minDuration = 200;
    const maxDuration = 1000;

    let durationFirst = minDuration;
    let durationSecond = minDuration;

    if (deltaFirst !== 0 || deltaSecond !== 0) {
        const totalDelta = deltaFirst + deltaSecond;

        durationFirst = deltaFirst === 0 ? minDuration : minDuration + ((deltaFirst / totalDelta) * (maxDuration - minDuration));
        durationSecond = deltaSecond === 0 ? minDuration : minDuration + ((deltaSecond / totalDelta) * (maxDuration - minDuration));
    }

    if (deltaFirst > 0) {
        animateNumberChange(firstTeamScore, currentFirst, newFirst, durationFirst, newFirst > newSecond);
    }

    if (deltaSecond > 0) {
        animateNumberChange(secondTeamScore, currentSecond, newSecond, durationSecond, newSecond > newFirst);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    startTime = performance.now();
    console.debug(`%cgetlivedata.js %c> %cGetting live match data...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
    
    try {
        scores = await getLive();
        setScores();
        errorMessage.innerHTML = "";
    } catch (error) {
        errorMessage.innerHTML = `Connection lost...`;
        console.debug(`%cgetlivedata.js %c> %cAPI failed...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
        if (error && error.message && error.message.includes('429')) {
            errorMessage.innerHTML = `Rate limited...`;
        }
    }

    console.debug(`%cgetlivedata.js %c> %cFetched live data in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
    
    if (refreshTimer) clearTimeout(refreshTimer);
    const updateFetch = async () => {
        try {
            if (typeof retryCount === 'undefined') {
                window.retryCount = 1;
            } else {
                window.retryCount++;
            }
            console.debug(`%cgetlivedata.js %c> %cRefreshing live data...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
            scores = await getLive();
            setScores();
            errorMessage.innerHTML = "";
        } catch (err) {
            errorMessage.innerHTML = `Retrying: attempt ${window.retryCount}`;
        } finally {
            refreshTimer = setTimeout(updateFetch, 1000);
        }
    };
    refreshTimer = setTimeout(updateFetch, 1000);
});