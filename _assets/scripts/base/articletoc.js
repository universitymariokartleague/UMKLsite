const tocList = document.getElementById('articleToc');
const headings = Array.from(document.querySelectorAll(`.article-body :is(${tocList?.dataset.headings || 'h2'})`));

if (tocList && headings.length > 1) {
    const targets = headings.map((heading) => {
        const target = heading.id ? heading : heading.closest('section[id]') || heading;
        if (!target.id) {
            target.id = heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }

        const link = document.createElement('a');
        link.href = `#${target.id}`;
        // Cloned rather than textContent so inline icons in headings carry over
        const content = heading.cloneNode(true);
        content.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));
        link.append(...content.childNodes);
        tocList.appendChild(link);
        return { target, link };
    });

    let active;
    const setActive = (entry) => {
        if (entry === active) return;
        active?.link.classList.remove('active');
        entry.link.classList.add('active');
        active = entry;
    };

    // The section being read is the last one whose top has passed a line a quarter of the way down the viewport
    const update = () => {
        const line = innerHeight * 0.25;
        setActive(targets.findLast(({ target }) => target.getBoundingClientRect().top <= line) || targets[0]);
    };

    let queued = false;
    addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; update(); });
    }, { passive: true });
    update();
} else if (tocList) {
    tocList.closest('.article-toc-item')?.remove();
}
