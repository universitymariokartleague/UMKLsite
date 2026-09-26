/*
    Reads player names and scores from a Mario Kart 8 Deluxe results screenshot,
    and groups players into teams using their name tags.

    Tesseract can't output symbols like ★, so each name is also split into glyphs
    and matched against symbol templates (built by _tools/makeocrglyphs.mjs).
*/
export { readResultsScreenshot, groupPlayersByTag, getNameMask, getGlyphColumns, getBaseline, normaliseGlyph, GLYPH_GRID, ROW_HEIGHT, BASE_WIDTH, BASE_HEIGHT, ROW_TOP, ROW_PITCH };

// Positions are measured on a 1920x1080 capture; other 16:9 sizes are scaled to this first
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const ROW_COUNT = 12;
const ROW_TOP = 200;
const ROW_PITCH = 63.15;
const ROW_HEIGHT = 52;
const NAME_LEFT = 225;
const NAME_RIGHT = 680;
const SCORE_LEFT = 755;
const SCORE_WIDTH = 130;
const DIGIT_CELLS = [23, 59, 95];
const DIGIT_WIDTH = 30;
const DIGIT_HEIGHT = 42;
const NAME_END_GAP = 35;
const TEXT_BAND = [5, 48];
const MIN_COMPONENT_SIZE = 20;
const NAME_SCALE = 2;
const NAME_PADDING = 20;
// Wider than any glyph (★ is about 32px) so solid shapes aren't hollowed out
const TOPHAT_RADIUS = 22;
const MIN_TEXT_CONTRAST = 25;

const GLYPH_TEMPLATES_PATH = "/_assets/media/tools/ocrglyphs.json";
const GLYPH_GRID = 24;
const SYMBOL_MIN_SCORE = 0.35;
// Tesseract is 93-99% sure of real letters but under 93% on the guesses it makes for symbols like ★
const CONFIDENT_LETTER = 95;
const CONFIDENT_LETTERS = 85;
// Real game symbols match their screenshot templates at 0.65+, while Rodin-only matches are weaker,
// so a weak match can't overrule a letter or digit Tesseract was fairly sure of
const STRONG_SYMBOL_MATCH = 0.6;
const LIKELY_LETTER = 70;

// Sample rectangles [x0, y0, x1, y1] inside a digit cell for each seven-segment bar
const SEGMENTS = {
    a: [8, 1, 22, 5],
    b: [23, 7, 29, 15],
    c: [23, 25, 29, 33],
    d: [8, 37, 22, 41],
    e: [1, 25, 7, 33],
    f: [1, 7, 7, 15],
    g: [8, 18, 22, 22],
};
// The game draws 1 as a single centred bar rather than the usual right-hand segments
const CENTRE_BAR = [13, 7, 19, 33];
const SEGMENT_DIGITS = {
    abcdef: 0, abdeg: 2, abcdg: 3, bcfg: 4, acdfg: 5, acdefg: 6, cdefg: 6,
    abc: 7, abcf: 7, abcdefg: 8, abcdfg: 9, abcfg: 9,
};

let glyphTemplatesPromise;

function createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function toGrey(imageData, x, y, width, height) {
    const grey = new Float32Array(width * height);
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const i = ((y + row) * imageData.width + (x + col)) * 4;
            grey[row * width + col] = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        }
    }
    return grey;
}

function otsuThreshold(grey) {
    const histogram = new Array(256).fill(0);
    grey.forEach(v => histogram[Math.round(v)]++);
    const total = grey.length;
    const sumAll = histogram.reduce((sum, count, v) => sum + v * count, 0);
    let weightBack = 0, sumBack = 0, best = 0, threshold = 128;
    for (let t = 0; t < 256; t++) {
        weightBack += histogram[t];
        if (!weightBack) continue;
        const weightFore = total - weightBack;
        if (!weightFore) break;
        sumBack += t * histogram[t];
        const between = weightBack * weightFore * (sumBack / weightBack - (sumAll - sumBack) / weightFore) ** 2;
        if (between > best) {
            best = between;
            threshold = t;
        }
    }
    return threshold;
}

// The player's own row is highlighted yellow with dark text instead of light text
function isHighlighted(imageData, x, y, width, height) {
    let yellow = 0;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const i = ((y + row) * imageData.width + (x + col)) * 4;
            const [r, g, b] = [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
            if (r > 170 && g > 140 && b < 110) yellow++;
        }
    }
    return yellow > width * height * 0.3;
}

// Sliding min or max over a window, run along rows then columns (a square erosion or dilation)
function rankFilter(values, width, height, radius, pick) {
    const pass = (source, length, count, index) => {
        const output = new Float32Array(source.length);
        for (let line = 0; line < count; line++) {
            for (let k = 0; k < length; k++) {
                let value = source[index(line, k)];
                for (let d = Math.max(0, k - radius); d <= Math.min(length - 1, k + radius); d++) {
                    value = pick(value, source[index(line, d)]);
                }
                output[index(line, k)] = value;
            }
        }
        return output;
    };
    const rows = pass(values, width, height, (line, k) => line * width + k);
    return pass(rows, height, width, (line, k) => k * width + line);
}

// Rows are see-through, so a flat threshold fails where the track behind is bright. Subtracting the
// background (anything wider than TOPHAT_RADIUS survives an opening) leaves just the text strokes
function getInkMask(imageData, x, y, width, height) {
    let grey = toGrey(imageData, x, y, width, height);
    if (isHighlighted(imageData, x, y, width, height)) grey = grey.map(v => 255 - v);

    const background = rankFilter(rankFilter(grey, width, height, TOPHAT_RADIUS, Math.min),
        width, height, TOPHAT_RADIUS, Math.max);
    const detail = grey.map((v, i) => Math.max(0, v - background[i]));
    const threshold = Math.max(otsuThreshold(detail), MIN_TEXT_CONTRAST);
    return Uint8Array.from(detail, v => (v > threshold ? 1 : 0));
}

// Background sparkles become stray characters or join neighbouring glyphs, so drop anything tiny
function removeSpecks(mask, width, height) {
    const seen = new Uint8Array(mask.length);
    for (let start = 0; start < mask.length; start++) {
        if (!mask[start] || seen[start]) continue;
        const component = [start];
        seen[start] = 1;
        for (let k = 0; k < component.length; k++) {
            const i = component[k];
            const x = i % width;
            for (const next of [i - width, i + width, x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1]) {
                if (next >= 0 && next < mask.length && mask[next] && !seen[next]) {
                    seen[next] = 1;
                    component.push(next);
                }
            }
        }
        if (component.length < MIN_COMPONENT_SIZE) component.forEach(i => { mask[i] = 0; });
    }
    return mask;
}

function inkFraction(mask, maskWidth, [x0, y0, x1, y1]) {
    let ink = 0;
    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) ink += mask[y * maskWidth + x];
    }
    return ink / ((x1 - x0) * (y1 - y0));
}

// Returns the score read with the digits' top edge at digitTop, and how clear-cut each segment was
function decodeDigitsAt(mask, digitTop) {
    let digits = "", clarity = 0;
    for (const cellX of DIGIT_CELLS) {
        const offset = ([x0, y0, x1, y1]) => [cellX + x0, digitTop + y0, cellX + x1, digitTop + y1];
        if (inkFraction(mask, SCORE_WIDTH, offset([0, 0, DIGIT_WIDTH, DIGIT_HEIGHT])) < 0.05) continue;

        const fractions = Object.entries(SEGMENTS).map(([segment, rect]) => [segment, inkFraction(mask, SCORE_WIDTH, offset(rect))]);
        const lit = fractions.filter(([, fraction]) => fraction > 0.5).map(([segment]) => segment).join("");
        clarity += fractions.reduce((sum, [, fraction]) => sum + Math.abs(fraction - 0.5), 0);
        if (!lit && inkFraction(mask, SCORE_WIDTH, offset(CENTRE_BAR)) > 0.5) {
            digits += "1";
        } else if (lit in SEGMENT_DIGITS) {
            digits += SEGMENT_DIGITS[lit];
        } else {
            return null;
        }
    }
    return digits ? { score: parseInt(digits), clarity } : null;
}

// Rows drift a few pixels between captures, so try every vertical offset and keep the clearest read
function readScore(imageData, rowTop) {
    const mask = getInkMask(imageData, SCORE_LEFT, rowTop, SCORE_WIDTH, ROW_HEIGHT);
    let best = null;
    for (let digitTop = 0; digitTop + DIGIT_HEIGHT <= ROW_HEIGHT; digitTop++) {
        const read = decodeDigitsAt(mask, digitTop);
        if (read && (!best || read.clarity > best.clarity)) best = read;
    }
    return best ? best.score : null;
}

function columnInk(mask, width, x) {
    let ink = 0;
    for (let y = 0; y < ROW_HEIGHT; y++) ink += mask[y * width + x];
    return ink;
}

// Sparkles to the right of a name get read as stray characters, so stop at the first wide gap
function getNameEnd(mask, width) {
    let lastInk = -1;
    for (let x = 0; x < width; x++) {
        if (columnInk(mask, width, x) >= 2) {
            lastInk = x;
        } else if (lastInk >= 0 && x - lastInk > NAME_END_GAP) {
            break;
        }
    }
    return Math.min(width, lastInk + 4);
}

function getNameMask(imageData, rowTop) {
    const fullWidth = NAME_RIGHT - NAME_LEFT;
    const mask = getInkMask(imageData, NAME_LEFT, rowTop, fullWidth, ROW_HEIGHT);
    mask.fill(0, 0, TEXT_BAND[0] * fullWidth);
    mask.fill(0, TEXT_BAND[1] * fullWidth);
    removeSpecks(mask, fullWidth, ROW_HEIGHT);

    const width = Math.max(1, getNameEnd(mask, fullWidth));
    return { mask: mask.filter((_, i) => i % fullWidth < width), width };
}

function getGlyphColumns(mask, width) {
    const glyphs = [];
    let start = null;
    for (let x = 0; x <= width; x++) {
        const ink = x < width ? columnInk(mask, width, x) : 0;
        if (ink && start === null) start = x;
        if (!ink && start !== null) {
            glyphs.push([start, x]);
            start = null;
        }
    }
    return glyphs;
}

// Fits the glyph's bounding box into a square (keeping its shape) and samples it onto a fixed grid
function normaliseGlyph(mask, width, x0, x1) {
    let top = ROW_HEIGHT, bottom = -1;
    for (let y = 0; y < ROW_HEIGHT; y++) {
        for (let x = x0; x < x1; x++) {
            if (mask[y * width + x]) {
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
            }
        }
    }
    if (bottom < 0) return null;

    const glyphHeight = bottom - top + 1;
    const glyphWidth = x1 - x0;
    const size = Math.max(glyphHeight, glyphWidth);
    const offsetX = (size - glyphWidth) / 2;
    const offsetY = (size - glyphHeight) / 2;
    const cell = size / GLYPH_GRID;
    const grid = new Float32Array(GLYPH_GRID * GLYPH_GRID);
    for (let gy = 0; gy < GLYPH_GRID; gy++) {
        for (let gx = 0; gx < GLYPH_GRID; gx++) {
            let ink = 0, samples = 0;
            for (let sy = 0; sy < 3; sy++) {
                for (let sx = 0; sx < 3; sx++) {
                    const x = Math.floor((gx + (sx + 0.5) / 3) * cell - offsetX);
                    const y = Math.floor((gy + (sy + 0.5) / 3) * cell - offsetY);
                    samples++;
                    if (x >= 0 && x < glyphWidth && y >= 0 && y < glyphHeight) ink += mask[(top + y) * width + x0 + x];
                }
            }
            grid[gy * GLYPH_GRID + gx] = ink / samples;
        }
    }
    return { grid, top, bottom, aspect: glyphWidth / glyphHeight };
}

function loadGlyphTemplates() {
    glyphTemplatesPromise ??= fetch(GLYPH_TEMPLATES_PATH)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(templates => templates.map(t => ({
            ...t,
            grid: Float32Array.from(t.grid, c => parseInt(c, 16) / 15),
        })))
        .catch(error => {
            glyphTemplatesPromise = null;
            throw error;
        });
    return glyphTemplatesPromise;
}

// Most glyphs sit on the baseline, so the median bottom finds it even with a few descenders
function getBaseline(mask, width, columns) {
    const bottoms = columns
        .map(([x0, x1]) => normaliseGlyph(mask, width, x0, x1))
        .filter(glyph => glyph && glyph.bottom - glyph.top >= 15)
        .map(glyph => glyph.bottom)
        .sort((a, b) => a - b);
    return bottoms.length ? bottoms[Math.floor(bottoms.length / 2)] : ROW_HEIGHT - 12;
}

// Template top and bottom are stored relative to the baseline, so rows drifting up or down don't matter
function glyphScore(glyph, template) {
    let overlap = 0, union = 0;
    for (let i = 0; i < glyph.grid.length; i++) {
        overlap += Math.min(glyph.grid[i], template.grid[i]);
        union += Math.max(glyph.grid[i], template.grid[i]);
    }
    const drift = Math.abs(glyph.top - template.top) + Math.abs(glyph.bottom - template.bottom);
    // Stops a wide blob of touching letters like "zz!" matching a squarer symbol
    const stretch = Math.abs(Math.log(glyph.aspect / template.aspect));
    return (overlap / (union || 1)) * Math.exp(-drift / 10) * Math.exp(-stretch * 2);
}

// Letter templates only exist to stop letters being mistaken for symbols
function matchSymbol(normalised, baseline, templates) {
    const glyph = { ...normalised, top: normalised.top - baseline, bottom: normalised.bottom - baseline };
    let bestSymbol = null, bestSymbolScore = 0, bestOther = 0;
    for (const template of templates) {
        const score = glyphScore(glyph, template);
        if (template.symbol && score > bestSymbolScore) {
            bestSymbol = template.char;
            bestSymbolScore = score;
        } else if (!template.symbol) {
            bestOther = Math.max(bestOther, score);
        }
    }
    return bestSymbolScore >= SYMBOL_MIN_SCORE && bestSymbolScore > bestOther
        ? { char: bestSymbol, score: bestSymbolScore }
        : null;
}

function getNameCanvas(mask, width) {
    const crop = createCanvas(width, ROW_HEIGHT);
    const cropCtx = crop.getContext("2d");
    const pixels = cropCtx.createImageData(width, ROW_HEIGHT);
    mask.forEach((ink, i) => {
        const v = ink ? 0 : 255;
        pixels.data.set([v, v, v, 255], i * 4);
    });
    cropCtx.putImageData(pixels, 0, 0);

    // Tesseract reads small game text more reliably when upscaled with some margin
    const output = createCanvas(width * NAME_SCALE + NAME_PADDING * 2, ROW_HEIGHT * NAME_SCALE + NAME_PADDING * 2);
    const outputCtx = output.getContext("2d");
    outputCtx.fillStyle = "#fff";
    outputCtx.fillRect(0, 0, output.width, output.height);
    outputCtx.drawImage(crop, NAME_PADDING, NAME_PADDING, width * NAME_SCALE, ROW_HEIGHT * NAME_SCALE);
    return output;
}

function toCropX(x) {
    return (x - NAME_PADDING) / NAME_SCALE;
}

// Swaps Tesseract's guesses under each detected symbol for the symbol itself, keeping word breaks
function mergeSymbols(words, symbols) {
    const merged = words.map(word => ({
        x0: toCropX(word.bbox.x0),
        x1: toCropX(word.bbox.x1),
        chars: word.symbols.map(s => ({
            text: s.text,
            confidence: s.confidence,
            x: toCropX((s.bbox.x0 + s.bbox.x1) / 2),
        })),
    }));
    const isCovered = (c, x0, x1) => c.x >= x0 - 1 && c.x <= x1 + 1;
    for (const { char, score, x0, x1 } of symbols) {
        const covered = merged.flatMap(word => word.chars.filter(c => isCovered(c, x0, x1)));
        const isLetter = c => /[\p{L}\p{N}]/u.test(c.text);
        if (covered.length === 1 && isLetter(covered[0])) {
            const { confidence } = covered[0];
            if (confidence >= CONFIDENT_LETTER || (confidence >= LIKELY_LETTER && score < STRONG_SYMBOL_MATCH)) continue;
        }
        // Touching letters get cut out as one glyph, so trust Tesseract when it saw several
        if (covered.filter(c => isLetter(c) && c.confidence >= CONFIDENT_LETTERS).length >= 2) continue;

        merged.forEach(word => { word.chars = word.chars.filter(c => !isCovered(c, x0, x1)); });
        const x = (x0 + x1) / 2;
        const target = merged.find(word => x >= word.x0 - 2 && x <= word.x1 + 2)
            ?? merged.reduce((closest, word) =>
                (!closest || Math.abs(word.x0 - x) < Math.abs(closest.x0 - x) ? word : closest), null);
        if (target) {
            target.chars.push({ text: char, x });
        } else {
            merged.push({ x0, x1, chars: [{ text: char, x }] });
        }
    }
    return merged
        .map(word => word.chars.sort((a, b) => a.x - b.x).map(c => c.text).join(""))
        .filter(Boolean)
        .join(" ");
}

function cleanName(text) {
    return text.replace(/\s+/g, " ").trim().replace(/\s+[^\p{L}\p{N}]{1,2}$/u, "");
}

async function readName(imageData, rowTop, worker, templates) {
    const { mask, width } = getNameMask(imageData, rowTop);
    const { data } = await worker.recognize(getNameCanvas(mask, width), {}, { blocks: true });
    const words = (data.blocks || []).flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words)));
    if (!templates) return cleanName(data.text);

    const columns = getGlyphColumns(mask, width);
    const baseline = getBaseline(mask, width, columns);
    const symbols = columns
        .map(([x0, x1]) => {
            const glyph = normaliseGlyph(mask, width, x0, x1);
            return { ...(glyph && matchSymbol(glyph, baseline, templates)), x0, x1 };
        })
        .filter(symbol => symbol.char);
    return cleanName(mergeSymbols(words, symbols));
}

// worker is a Tesseract.js worker; image is anything drawImage accepts; onProgress gets (rowsRead, totalRows)
async function readResultsScreenshot(image, worker, onProgress = () => { }) {
    const canvas = createCanvas(BASE_WIDTH, BASE_HEIGHT);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, BASE_WIDTH, BASE_HEIGHT);
    const imageData = ctx.getImageData(0, 0, BASE_WIDTH, BASE_HEIGHT);

    let templates = null;
    try {
        templates = await loadGlyphTemplates();
    } catch (error) {
        console.error("Failed to load glyph templates:", error);
    }

    const players = [];
    for (let i = 0; i < ROW_COUNT; i++) {
        const rowTop = Math.round(ROW_TOP + i * ROW_PITCH);
        players.push({
            name: await readName(imageData, rowTop, worker, templates),
            score: readScore(imageData, rowTop),
        });
        onProgress(i + 1, ROW_COUNT);
    }
    return players;
}

function isTagBoundary(char) {
    return !/[\p{L}\p{N}]/u.test(char);
}

// A tag is a shared prefix ending in a separator or symbol, so "PRI Peach" and "PRI Daisy" match,
// but "YOS|Yoshi" and "YOS Birdo" don't, and nor do tags written after the name
function getCandidateTags(name) {
    const tags = [];
    const chars = [...name];
    for (let i = 1; i < chars.length; i++) {
        if (isTagBoundary(chars[i - 1])) tags.push(chars.slice(0, i).join("").toLowerCase());
    }
    return tags;
}

function getTagCore(tag) {
    return tag.replace(/[^\p{L}\p{N}]/gu, "");
}

function sameStars(text) {
    return text.replaceAll("☆", "★");
}

// Never leaves a name empty, in case the whole name looked like a tag
function removePrefix(name, length) {
    return name.slice(length).replace(/^[^\p{L}\p{N}]+/u, "").trim() || name;
}

// knownTags maps a tag to a team name, e.g. { "MKS": "Staffs" }
function groupPlayersByTag(players, teamCount, knownTags = {}) {
    const teamSize = players.length / teamCount;
    const teams = [];
    const assigned = new Set();
    // Tags are only removed from players who actually matched one
    const shortNames = players.map(p => p.name);

    // Known tags go first as they're certain. Players write the same tag differently ("EDI★", "EDI☆",
    // "EDI " or "EDIname"), so only the tag's letters need to match; symbol-only tags like "¥★"
    // match whole, treating ★ and ☆ alike. Case-sensitive so "WAR" doesn't catch "Wario"
    const knownByLength = Object.entries(knownTags).sort((a, b) => b[0].length - a[0].length);
    for (const [tag, teamName] of knownByLength) {
        if (teams.length === teamCount) break;
        const core = getTagCore(tag);
        const matchLength = core ? core.length : tag.length;
        const matches = name => (core ? name.startsWith(core) : sameStars(name).startsWith(sameStars(tag)));
        const members = players.map((_, i) => i).filter(i => !assigned.has(i) && matches(players[i].name));
        if (members.length < 2 || members.length > teamSize) continue;
        teams.push({ tag: tag.toLowerCase(), label: core || tag, teamName, members });
        members.forEach(i => {
            assigned.add(i);
            shortNames[i] = removePrefix(players[i].name, matchLength);
        });
    }

    const membersByTag = new Map();
    players.forEach((player, i) => {
        for (const tag of getCandidateTags(player.name)) {
            if (!membersByTag.has(tag)) membersByTag.set(tag, []);
            membersByTag.get(tag).push(i);
        }
    });

    // Prefer tags covering the most players, then the most specific tag
    const candidates = [...membersByTag]
        .filter(([, members]) => members.length >= 2 && members.length <= teamSize)
        .sort((a, b) => b[1].length - a[1].length || b[0].length - a[0].length);

    for (const [tag, members] of candidates) {
        if (teams.length === teamCount) break;
        if (members.some(i => assigned.has(i))) continue;
        teams.push({ tag, label: players[members[0]].name.slice(0, tag.length).trim(), members: [...members] });
        members.forEach(i => {
            assigned.add(i);
            shortNames[i] = removePrefix(players[i].name, tag.length);
        });
    }
    while (teams.length < teamCount) teams.push({ tag: null, label: null, teamName: null, members: [] });

    const untagged = new Set();
    for (const i of players.map((_, i) => i).filter(i => !assigned.has(i))) {
        const open = teams.filter(team => team.members.length < teamSize);
        // Catches a missing separator, e.g. "MKSJamWamm" alongside "MKS Primo", but not "Wario" for "WAR"
        const closest = open.find(team => team.label && getTagCore(team.label) && players[i].name.startsWith(getTagCore(team.label)));
        if (closest) {
            shortNames[i] = removePrefix(players[i].name, getTagCore(closest.label).length);
        } else {
            untagged.add(i);
        }
        (closest || open[0]).members.push(i);
    }

    teams.forEach(team => team.members.sort((a, b) => a - b));
    teams.sort((a, b) => (a.members[0] ?? Infinity) - (b.members[0] ?? Infinity));
    return {
        teams: teams.map(team => ({
            tag: team.label,
            teamName: team.teamName ?? knownTags[team.label] ?? null,
            players: team.members.map(i => ({ ...players[i], shortName: shortNames[i], untagged: untagged.has(i) })),
        })),
    };
}
