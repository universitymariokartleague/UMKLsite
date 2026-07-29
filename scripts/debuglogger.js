/*
    Shared styled console.debug helper used across scripts.
*/

function createDebugLogger(fileName, color, lightColor) {
    return message => console.debug(`%c${fileName} %c> %c${message}`, `color:${color}`, "color:#fff", `color:${lightColor}`);
}

export { createDebugLogger };
