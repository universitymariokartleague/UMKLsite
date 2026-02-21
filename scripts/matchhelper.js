export { generate6v6ScoreCalculatorLink };

function generate6v6ScoreCalculatorLink(entry) {
    const url = new URL("pages/tools/6v6scorecalculator/", window.location.origin);

    if (!entry.detailedResults) return '';

    const positionsString = entry.detailedResults
        .map(race => race[1].join(',')) // take only the "1" array - {1: Array(6), 2: Array(6), track: 'GCN Baby Park'}
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

    return url;
}