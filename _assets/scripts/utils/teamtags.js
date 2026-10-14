/*
    teamtags.js
    The in-game name tags that identify each team.
*/

export { getTeamTags };

const TEAM_TAGS_API = "https://api.umkl.co.uk/teamtags";

let pending = null;

async function getTeamTags() {
    // Fetched once per page; the import button is pressed more than once.
    pending ??= fetch(TEAM_TAGS_API)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => data.team_tags)
        .catch(error => {
            console.error(`Failed to load team tags: ${error}`);
            pending = null;  // let a later call retry rather than cache the failure
            return {};
        });
    return pending;
}
