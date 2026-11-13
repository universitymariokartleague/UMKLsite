// AVIF encoding runs in a dedicated worker so the page stays responsive

import { defaultOptions } from '/_assets/vendor/jsquash-avif/meta.js';
import { initEmscriptenModule } from '/_assets/vendor/jsquash-avif/utils.js';

function hasWasmThreads() {
    return (
        typeof crossOriginIsolated !== 'undefined' &&
        crossOriginIsolated &&
        typeof SharedArrayBuffer !== 'undefined'
    );
}

let avifModule = null;
let avifInit = null;

async function loadAvif() {
    if (avifModule) return avifModule;
    if (avifInit) return avifInit;
    const promise = (async () => {
        const factory = hasWasmThreads()
            ? (await import('/_assets/vendor/jsquash-avif/codec/enc/avif_enc_mt.js')).default
            : (await import('/_assets/vendor/jsquash-avif/codec/enc/avif_enc.js')).default;
        avifModule = await initEmscriptenModule(factory);
        return avifModule;
    })();
    avifInit = promise;
    try {
        return await promise;
    } finally {
        if (avifInit === promise) avifInit = null;
    }
}

async function warm() {
    const data = new Uint8ClampedArray(2 * 2 * 4).fill(128);
    const module = await loadAvif();
    module.encode(new Uint8Array(data.buffer), 2, 2, {
        ...defaultOptions,
        speed: 10,
        quality: 50,
    });
}

async function encodeAvif(pixels, width, height, options, offset, length) {
    const module = await loadAvif();
    const output = module.encode(
        new Uint8Array(pixels, offset, length),
        width,
        height,
        {
            ...defaultOptions,
            ...options,
        },
    );
    if (!output) throw new Error('Encoding error.');
    return output.buffer;
}

self.onmessage = async (event) => {
    const {
        id,
        type,
        width,
        height,
        pixels,
        pixelsOffset = 0,
        pixelsLength = pixels?.byteLength,
        options,
    } = event.data;
    try {
        if (type === 'warm') {
            await warm();
            self.postMessage({ id, ok: true });
            return;
        }
        const buffer = await encodeAvif(
            pixels,
            width,
            height,
            options,
            pixelsOffset,
            pixelsLength,
        );
        self.postMessage({ id, buffer }, [buffer]);
    } catch (err) {
        self.postMessage({ id, error: err?.message || String(err) });
    }
};
