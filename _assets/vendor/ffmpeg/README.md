# ffmpeg.wasm (vendored)

Used by the article builder to convert GIFs to animated 540p WebP in the browser.

- `@ffmpeg/ffmpeg` 0.12.15 (MIT) — see `LICENSE-ffmpeg-wasm.txt`
- `@ffmpeg/core` 0.12.10, ESM single-thread build (GPL-2.0-or-later) — see `LICENSE-ffmpeg-core.txt`

The ESM core build is required because the ffmpeg.wasm worker runs as a module worker.

Files:

- `index.js`, `classes.js`, `const.js`, `errors.js`, `types.js`, `utils.js`, `worker.js` — `@ffmpeg/ffmpeg` ESM build
- `core/ffmpeg-core.js`, `core/ffmpeg-core.wasm.gz` — `@ffmpeg/core` ESM build

The wasm is stored gzipped because Cloudflare Pages rejects individual assets over
25 MiB. The article builder decompresses it in the browser with `DecompressionStream`
before handing it to ffmpeg.wasm.
