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
        if (heading.tagName !== 'H2') link.dataset.level = heading.tagName;
        tocList.appendChild(link);
        return { target, link };
    });

    const revealActiveEntry = (link) => {
        const scroller = [...function* () {
            for (let el = link.parentElement; el; el = el.parentElement) yield el;
        }()].find((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
        if (!scroller) return;

        const pad = 10;
        const box = scroller.getBoundingClientRect();
        const item = link.getBoundingClientRect();
        const smooth = matchMedia('(prefers-reduced-motion: no-preference)').matches ? 'smooth' : 'auto';

        if (scroller.scrollHeight > scroller.clientHeight) {
            if (item.top < box.top + pad) {
                scroller.scrollTo({ top: scroller.scrollTop - (box.top + pad - item.top), behavior: smooth });
            } else if (item.bottom > box.bottom - pad) {
                scroller.scrollTo({ top: scroller.scrollTop + (item.bottom - box.bottom + pad), behavior: smooth });
            }
        }

        if (scroller.scrollWidth > scroller.clientWidth) {
            let delta = 0;
            if (item.left >= box.right) delta = item.left - box.left;
            else if (item.right <= box.left) delta = item.right - box.right;
            else if (item.left < box.left + pad) delta = item.left - (box.left + pad);
            else if (item.right > box.right - pad) delta = item.right - (box.right - pad);
            if (delta) scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: smooth });
        }
    };

    let active;
    const setActive = (entry) => {
        if (entry === active) return;
        active?.link.classList.remove('active');
        entry.link.classList.add('active');
        active = entry;
        revealActiveEntry(entry.link);
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
