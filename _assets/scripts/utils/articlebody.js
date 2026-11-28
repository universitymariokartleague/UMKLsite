/*
    Trims the blank space an Article Builder export leaves at the end of a page.
*/

export { trimTrailingPadding };

// Tags that only ever contain padding when they are empty.
const PADDING_TAGS = new Set(['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

function isPaddingNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.replace(/\u00a0/g, ' ').trim() === '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.tagName === 'BR') return true;
    if (!PADDING_TAGS.has(node.tagName)) return false;
    return [...node.childNodes].every(isPaddingNode);
}

// Empty paragraphs and line breaks at the end of an article render as a long
// run of blank space, so drop them along with any trailing whitespace.
function trimTrailingPadding(container) {
    let last = container.lastChild;
    while (last) {
        if (isPaddingNode(last)) {
            container.removeChild(last);
            last = container.lastChild;
            continue;
        }
        if (last.nodeType === Node.ELEMENT_NODE && PADDING_TAGS.has(last.tagName)) {
            trimTrailingPadding(last);
            if (isPaddingNode(last)) {
                container.removeChild(last);
                last = container.lastChild;
                continue;
            }
        }
        break;
    }
    return container;
}
