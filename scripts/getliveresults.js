/*
    A script that fetches from live match data from api.umkl.co.uk/live
*/

let scores = []
const firstTeamScore = document.getElementById("firstteamscore")
const secondTeamScore = document.getElementById("secondteamscore")
const errorMessage = document.getElementById("errormessage")

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

function setScores() {
    firstTeamScore.innerText = scores[0]
    secondTeamScore.innerText = scores[1]
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