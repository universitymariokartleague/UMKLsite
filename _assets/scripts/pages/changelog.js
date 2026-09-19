const entries = Array.from(document.querySelectorAll('.changelog-entry[id]'));
const tocList = document.getElementById('changelogToc');

if (tocList && entries.length) {
    const links = new Map();

    entries.forEach(entry => {
        const link = document.createElement('a');
        link.href = `#${entry.id}`;
        link.textContent = entry.querySelector('h2').textContent;
        tocList.appendChild(link);
        links.set(entry, link);
    });

    const setActive = (entry) => {
        links.forEach((link, el) => link.classList.toggle('active', el === entry));
    };

    setActive(entries.find(entry => `#${entry.id}` === location.hash) || entries[0]);

    // A band near the top of the viewport, so the entry being read is the one highlighted
    const observer = new IntersectionObserver((observed) => {
        observed.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) setActive(target);
        });
    }, { rootMargin: '-25% 0px -75% 0px' });

    entries.forEach(entry => observer.observe(entry));
}
