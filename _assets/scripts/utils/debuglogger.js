/*
    Shared script for the site's styled console.debug() messages
*/
export { createDebugLogger };

function createDebugLogger(scriptName, scriptColor, messageColor) {
    return (message) => {
        console.debug(`%c${scriptName} %c> %c${message}`, `color:${scriptColor}`, "color:#fff", `color:${messageColor}`);
    };
}
