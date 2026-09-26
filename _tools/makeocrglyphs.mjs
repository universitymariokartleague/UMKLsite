/*
    Builds _assets/media/tools/ocrglyphs.json, the glyph templates the table maker's
    screenshot import uses to recognise symbols like ★ that Tesseract can't read.

    Templates come from two places: Rodin (close to the game's name font) for broad
    coverage, and glyphs cut from real results screenshots, which match best.

    Run from the repo root with Node:
        npm install --no-save @napi-rs/canvas
        node _tools/makeocrglyphs.mjs <path to FOT-RodinNTLG Pro DB.otf> [screenshot:row:glyph:char ...]

    Each screenshot sample is the image path, the row (1-12), which glyph in that
    name counting from 1, and the character it is, e.g. results.png:5:2:★
*/
import { writeFileSync } from "node:fs";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import {
    getNameMask, getGlyphColumns, getBaseline, normaliseGlyph,
    GLYPH_GRID, ROW_HEIGHT, BASE_WIDTH, BASE_HEIGHT, ROW_TOP, ROW_PITCH,
} from "../_assets/scripts/utils/resultsocr.js";

const OUTPUT_PATH = "_assets/media/tools/ocrglyphs.json";
// Rodin is close to the game's name font once it's rendered at this size with a thicker stroke
const FONT_SIZE = 38;
const STROKE_WIDTH = 2;
const BASELINE = 41;

const SYMBOLS = "★☆♪♬♩♥♡♦♢♠♤♣♧◆◇■□●○◎▲△▼▽※†‡∞♭♯→←↑↓√×÷±°·•〆々Ω¥£€¢";
const OTHERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$#&@%+=~^|\\/*!?-_()[]{}<>";

const [fontPath, ...samples] = process.argv.slice(2);
if (!fontPath) {
    console.error("Usage: node _tools/makeocrglyphs.mjs <path to FOT-RodinNTLG Pro DB.otf> [screenshot:row:glyph:char ...]");
    process.exit(1);
}
GlobalFonts.registerFromPath(fontPath, "Rodin");

function toTemplate(char, glyph, baseline, source) {
    return {
        char,
        symbol: SYMBOLS.includes(char),
        source,
        top: glyph.top - baseline,
        bottom: glyph.bottom - baseline,
        aspect: Math.round(glyph.aspect * 1000) / 1000,
        grid: Array.from(glyph.grid, v => Math.round(v * 15).toString(16)).join(""),
    };
}

function renderGlyph(char) {
    const width = FONT_SIZE * 3;
    const canvas = createCanvas(width, ROW_HEIGHT);
    const ctx = canvas.getContext("2d");
    ctx.font = `${FONT_SIZE}px Rodin`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = ctx.strokeStyle = "#fff";
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineJoin = "round";
    ctx.strokeText(char, 8, BASELINE);
    ctx.fillText(char, 8, BASELINE);

    const { data } = ctx.getImageData(0, 0, width, ROW_HEIGHT);
    const mask = new Uint8Array(width * ROW_HEIGHT);
    let x0 = width, x1 = -1;
    for (let i = 0; i < mask.length; i++) {
        if (data[i * 4 + 3] > 127) {
            mask[i] = 1;
            x0 = Math.min(x0, i % width);
            x1 = Math.max(x1, i % width);
        }
    }
    return x1 < 0 ? null : normaliseGlyph(mask, width, x0, x1 + 1);
}

// Rodin's baseline is wherever a flat-bottomed capital ends
const rodinBaseline = renderGlyph("E").bottom;
const templates = [...SYMBOLS, ...OTHERS]
    .map(char => [char, renderGlyph(char)])
    .filter(([, glyph]) => glyph)
    .map(([char, glyph]) => toTemplate(char, glyph, rodinBaseline, "rodin"));

const screenshots = new Map();
for (const sample of samples) {
    const match = sample.match(/^(.*):(\d+):(\d+):(.+)$/u);
    if (!match) {
        console.error(`Couldn't parse sample "${sample}", expected screenshot:row:glyph:char`);
        process.exit(1);
    }
    const [, path, row, glyphNumber, char] = match;
    if (!screenshots.has(path)) {
        const canvas = createCanvas(BASE_WIDTH, BASE_HEIGHT);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(await loadImage(path), 0, 0, BASE_WIDTH, BASE_HEIGHT);
        screenshots.set(path, ctx.getImageData(0, 0, BASE_WIDTH, BASE_HEIGHT));
    }

    const { mask, width } = getNameMask(screenshots.get(path), Math.round(ROW_TOP + (row - 1) * ROW_PITCH));
    const columns = getGlyphColumns(mask, width);
    const column = columns[glyphNumber - 1];
    if (!column) {
        console.error(`Row ${row} of ${path} only has ${columns.length} glyphs`);
        process.exit(1);
    }
    const glyph = normaliseGlyph(mask, width, ...column);
    templates.push(toTemplate(char, glyph, getBaseline(mask, width, columns), "game"));
}

writeFileSync(OUTPUT_PATH, JSON.stringify(templates));
console.log(`Wrote ${templates.length} ${GLYPH_GRID}x${GLYPH_GRID} templates (${samples.length} from screenshots) to ${OUTPUT_PATH}`);
