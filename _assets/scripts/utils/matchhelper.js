export { generate6v6ScoreCalculatorLink, getRacePositions };

// fallback
function getRacePositions(entry, race, seat) {
    const id = entry?.results?.[seat]?.[0];
    const byId = id != null ? race[String(id)] : undefined;
    const bySeat = race[String(seat + 1)];
    return Array.isArray(byId) ? byId : bySeat;
}

function generate6v6ScoreCalculatorLink(entry, date) {
    const url = new URL("/tools/matchdetails/", window.location.origin);

    if (!entry.detailedResults) return '';

    const positionsString = entry.detailedResults
        // only the first team's finishes are stored - the opponent's are the remaining positions
        .map(race => getRacePositions(entry, race, 0)?.join(','))
        .join('\n');

    const tracksString = entry.detailedResults
        .map(race => race.track)
        .join('\n');

    const teamsString = entry.teamsInvolved.join('\n');
    const penalties = entry.results.map(r => r[2]).join(',');

    const compressedMatchName = LZString.compressToEncodedURIComponent(entry.title);
    const compressedPositions = LZString.compressToEncodedURIComponent(positionsString);
    const compressedTracks = LZString.compressToEncodedURIComponent(tracksString);
    const compressedTeams = LZString.compressToEncodedURIComponent(teamsString);
    const compressedPenalties = LZString.compressToEncodedURIComponent(penalties);

    url.searchParams.set('m', compressedMatchName);
    url.searchParams.set('p', compressedPositions);
    url.searchParams.set('t', compressedTracks);
    url.searchParams.set('n', compressedTeams);
    url.searchParams.set('pen', compressedPenalties);

    if (entry.ytLinks && entry.ytLinks.some(Boolean)) {
        const ytLinksString = entry.ytLinks.join('\n');
        const compressedYtLinks = LZString.compressToEncodedURIComponent(ytLinksString);
        url.searchParams.set('y', compressedYtLinks);
    }

    const matchDate = date || entry.matchDate;
    if (matchDate) {
        url.searchParams.set('d', LZString.compressToEncodedURIComponent(matchDate));
    }

    return url;
}
