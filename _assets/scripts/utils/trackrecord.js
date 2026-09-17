const RACE_POINTS = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// How hard to pull thin samples toward the team's own baseline
const SHRINKAGE = 5;

// Guard against invalid data
function isValidRace(race) {
    const all = [...(race["1"] ?? []), ...(race["2"] ?? [])];
    if (all.length !== 12) return false;
    return new Set(all).size === 12 && all.every((p) => p >= 1 && p <= 12);
}

export function trackRecord(data, teamName, opts = {}) {
    const { minRaces = 2, includeTests = true, shrinkage = SHRINKAGE } = opts;
    const totals = new Map(); // track -> { sum, count, best, worst }

    for (const matches of Object.values(data)) {
        for (const match of matches) {
            if (!match.detailedResults) continue;
            if (!includeTests && match.testMatch) continue;

            const seat = match.teamsInvolved.indexOf(teamName);
            if (seat === -1) continue;
            const key = String(seat + 1); // "1" or "2"

            for (const race of match.detailedResults) {
                if (!isValidRace(race)) continue;
                const score = race[key].reduce((sum, pos) => sum + RACE_POINTS[pos - 1], 0);

                const entry = totals.get(race.track) ?? { sum: 0, count: 0, best: -Infinity, worst: Infinity };
                entry.sum += score;
                entry.count += 1;
                entry.best = Math.max(entry.best, score);
                entry.worst = Math.min(entry.worst, score);
                totals.set(race.track, entry);
            }
        }
    }

    if (totals.size === 0) return [];

    // The team's own points-per-race across every track
    const entries = [...totals.values()];
    const totalRaces = entries.reduce((sum, e) => sum + e.count, 0);
    const baseline = entries.reduce((sum, e) => sum + e.sum, 0) / totalRaces;

    return [...totals.entries()]
        .filter(([, e]) => e.count >= minRaces)
        .map(([track, e]) => ({
            track,
            average: e.sum / e.count,
            // A 4-race 52.5 is weaker than a 9-race 52.1
            adjusted: (e.sum + shrinkage * baseline) / (e.count + shrinkage),
            races: e.count,
            best: e.best,
            worst: e.worst,
        }))
        .sort((a, b) => b.adjusted - a.adjusted || b.races - a.races || a.track.localeCompare(b.track));
}

// The single best track, or null if no track clears minRaces
export function bestTrack(data, teamName, opts) {
    return trackRecord(data, teamName, opts)[0] ?? null;
}

// The weakest track
export function worstTrack(data, teamName, opts) {
    const rows = trackRecord(data, teamName, opts);
    return rows.length ? rows[rows.length - 1] : null;
}
