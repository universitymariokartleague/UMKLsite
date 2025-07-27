// /*
//     This script generates a list of UMKL users you can click on
//     to go to their stats page.
// */

// const usersBox = document.getElementById("usersBox")
// const startYear = 2023;

// let playerData = [];
// const currentSeason = 2;
// let fetchedCurrentSeason = currentSeason;

// const UPDATEINVERVAL = 30000;
// let refreshTimer = null;

// let startTime;

// async function generateUsersBox(userData, showError) {
//     usersBox.innerHTML = "";

//     for (const [id, user] of Object.entries(userData)) {

//         console.log(user);

//         let possessiveUsername = makePossessive(user.username)

//         usersBox.innerHTML += `
//             <div class="userBox">
//                 <img loading="lazy" width=50 height=50 class="user-box-image" src="${user.profile_picture}"
//                 alt="${possessiveUsername} profile picture" title="${possessiveUsername} profile picture"
//                 onload="this.style.opacity=1"/>
//                 <div>
//                     <a href="pages/players/details/?ID=${id}">${user.username}</a>
//                     <br/>Team: ${user.team}
//                 </div>
//             </div>
//         ` ;
//     }
// }

// function makePossessive(name) {
//     if (!name) return '';
//     if (name.endsWith('s') || name.endsWith('S')) {
//         return `${name}'`;
//     }
//     return `${name}'s`;
// }

// async function getPlayerdata(ID = "") {
//     const response = await fetch('https://api.umkl.co.uk/playerdata', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ ID })
//     });

//     if (!response.ok) {
//         let errorData;
//         try {
//             errorData = await response.json();
//         } catch {
//             errorData = { error: `HTTP error! status: ${response.status}` };
//         }
//         throw errorData;
//     }

//     return response.json();
// }

// async function getPlayerdataFallback(playerID) {
//     const response = await fetch(`database/playerdatafallback.json`);
//     if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const allTeams = await response.json();
//     return allTeams.filter(team => team.team_name === playerID);
// }

// async function getCurrentSeason() {
//     return fetch('https://api.umkl.co.uk/seasoninfo', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             season: 0
//         })
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         return response.json();
//     });
// }

// document.addEventListener("DOMContentLoaded", async () => {
//     startTime = performance.now();
//     console.debug(`%cuserboxgenerate.js %c> %cFetching playerdata from the API...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
    
//     try {
//         playerData = await getPlayerdata();
//         fetchedCurrentSeason = parseInt(await getCurrentSeason());
//     } catch (error) {
//         console.debug(`%cuserboxgenerate.js %c> %cAPI failed - using fallback information...`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
//         await getPlayerdataFallback();
//     }

//     generateUsersBox(playerData)
//     console.debug(`%cuserboxgenerate.js %c> %cGenerated user boxes in ${(performance.now() - startTime).toFixed(2)}ms`, "color:#fc52ff", "color:#fff", "color:#fda6ff");
// });

window.location.href = "../../../";