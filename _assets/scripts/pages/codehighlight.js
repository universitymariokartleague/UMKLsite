/*
    Lightweight syntax colouriser for <pre class="codeBox"> blocks (JSON/JS/SQL-ish
    snippets). Not a full tokenizer - just enough regex matching to colour strings,
    keys, numbers, booleans and comments consistently wherever a codeBox is used.
*/

const TOKEN_REGEX = /(\/\/[^\n]*|--[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')(\s*:)?|\b(true|false|null|None)\b|\b(-?\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)(\s*):|\b([A-Za-z_][\w]*)(?=\()/g;

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenize(text) {
    let result = '';
    let lastIndex = 0;
    let match;

    TOKEN_REGEX.lastIndex = 0;
    while ((match = TOKEN_REGEX.exec(text)) !== null) {
        const [full, comment, str, strColon, bool, num, unquotedKey, keySpacing, funcName] = match;
        result += escapeHtml(text.slice(lastIndex, match.index));

        if (comment) {
            result += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
        } else if (str !== undefined) {
            const cls = strColon ? 'tok-key' : 'tok-string';
            result += `<span class="${cls}">${escapeHtml(str)}</span>${strColon ? escapeHtml(strColon) : ''}`;
        } else if (bool) {
            result += `<span class="tok-bool">${escapeHtml(bool)}</span>`;
        } else if (num) {
            result += `<span class="tok-num">${escapeHtml(num)}</span>`;
        } else if (unquotedKey) {
            result += `<span class="tok-key">${escapeHtml(unquotedKey)}</span>${escapeHtml(keySpacing)}:`;
        } else if (funcName) {
            result += `<span class="tok-func">${escapeHtml(funcName)}</span>`;
        }

        lastIndex = TOKEN_REGEX.lastIndex;
    }
    result += escapeHtml(text.slice(lastIndex));
    return result;
}

function highlightCodeBoxes() {
    document.querySelectorAll('pre.codeBox').forEach(pre => {
        if (pre.dataset.highlighted) return;
        pre.dataset.highlighted = 'true';
        pre.innerHTML = tokenize(pre.textContent);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightCodeBoxes);
} else {
    highlightCodeBoxes();
}
