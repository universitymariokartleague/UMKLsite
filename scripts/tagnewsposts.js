/*
    This script makes <tag> elements clickable, sending you to the news 
    page with the tag as a query parameter (to be used as a filter).
*/

const newsReel = document.getElementById("news-reel");
const sliderInterval = 6500;

function addLinksToTags() {
    const params = new URLSearchParams(window.location.search);
    const selectedTag = params.get('tag');

    document.querySelectorAll('.news-date').forEach((element, index) => {
        element.querySelectorAll('tag').forEach(tag => {
            const tagText = tag.textContent.trim();
            const anchor = document.createElement('a');
            if (selectedTag && tagText.toLowerCase() === selectedTag.toLowerCase()) {
                anchor.href = '/pages/news/';
            } else {
                anchor.href = `/pages/news/?tag=${encodeURIComponent(tagText.toLowerCase())}`;
            }
            anchor.className = 'tag-link';

            tag.className = 'tag-link-text';
            tag.parentNode.replaceChild(anchor, tag);
            anchor.appendChild(tag);
        });

        const rect = element.getBoundingClientRect();
        const width = rect.width;

        if (width > 205) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes news-date${index}scrollBackForth {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(-${width - 200}px); }
                    100% { transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
            element.style.animation = `news-date${index}scrollBackForth 5s ease-in-out infinite`;
        };
    });

    if (selectedTag) {
        document.querySelectorAll('.news-date tag').forEach(tag => {
            if (tag.textContent.trim().toLowerCase() === selectedTag.toLowerCase()) {
                tag.classList.add('tag-selected');
            }
        });

        document.querySelectorAll('#news-container > *').forEach(container => {
            const newsDate = container.querySelector('.news-date');
            if (newsDate) {
                const tagElements = newsDate.querySelectorAll('tag');
                let matchFound = false;
                tagElements.forEach(tag => {
                    if (tag.textContent.trim().toLowerCase() === selectedTag.toLowerCase()) {
                        matchFound = true;
                    }
                });
                if (!matchFound) {
                    container.style.display = 'none';
                }
            }
        });
    };
};

function addNewsReelArea() {
    const items = document.querySelectorAll('#news-container > *');
    if (!items.length) return;

    const data = Array.from(items).map(el => {
        const linkEl = el.querySelector('a[href]');
        const imgEl  = el.querySelector('img');
        const bgImg  = (imgEl && imgEl.src)
            || el.dataset.image
            || (el.style.backgroundImage && el.style.backgroundImage.replace(/^url\(["']?(.+?)["']?\)$/, '$1'))
            || '';

        const titleEl = el.querySelector('.news-title');
        const dateEl  = el.querySelector('.news-date');
        const descEl  = el.querySelector('.news-desc');

        const tagsHTML = Array.from(el.querySelectorAll('.news-date tag, .news-date .tag-link'))
            .map(tag => tag.outerHTML)
            .join('');

        return {
            href: linkEl ? linkEl.href : '#',
            img: bgImg,
            title: titleEl ? titleEl.textContent.trim() : (linkEl ? linkEl.textContent.trim() : 'Untitled'),
            date: dateEl ? dateEl.textContent.trim() : '',
            description: descEl ? descEl.textContent.trim() : '',
            tagsHTML: tagsHTML
        };
    });

    const reelBox = document.createElement('div');
    reelBox.id = 'news-reel-box';
    reelBox.innerHTML = `
        <div class="news-reel-viewport">
            <div class="news-reel-track"></div>
            <div class="news-reel-indicators"></div>
            <div class="news-reel-progress-bar">
                <div class="news-reel-progress"></div>
            </div>
        </div>
    `;

    const track = reelBox.querySelector('.news-reel-track');
    const indicatorsContainer = reelBox.querySelector('.news-reel-indicators');

    data.forEach((item, i) => {
        const slide = document.createElement('div');
        slide.className = 'news-reel-slide';
        slide.innerHTML = `
            <img class="news-reel-bg" src="${item.img}" alt="" onload="this.style.opacity=1" loading="lazy">
            <div class="news-reel-gradient"></div>
            <a class="news-reel-card" href="${item.href}">
                <div class="news-reel-meta">
                    ${item.date ? `<span class="news-reel-date">${item.date.split(" ")[0]}</span>` : ''}
                    <span class="news-reel-tags">${item.tagsHTML}</span>
                </div>
                <h3 class="news-reel-title">${item.title}</h3>
                <p class="news-reel-desc">${item.description}</p>
            </a>
        `;
        track.appendChild(slide);

        const dot = document.createElement('span');
        dot.className = 'news-reel-dot';
        dot.dataset.index = i;
        indicatorsContainer.appendChild(dot);
    });

    newsReel.innerHTML = '';
    newsReel.appendChild(reelBox);

    let item = 0;
    const total = data.length;
    let timer = setInterval(next, sliderInterval);

    const dots = indicatorsContainer.querySelectorAll('.news-reel-dot');

    function updateIndicators() {
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[item]) dots[item].classList.add('active');
    }

    function goToSlide(index) {
        item = (index + total) % total;
        track.style.transform = `translateX(-${item * 100}%)`;
        updateIndicators();
        resetTimer();
    }

    function next() {
        goToSlide(item + 1);
        resetTimer();
    }

    dots.forEach(dot => {
        dot.addEventListener('click', e => {
            clearInterval(timer);
            goToSlide(parseInt(e.target.dataset.index, 10));
            resetTimer();
        });
    });

    reelBox.addEventListener('mouseenter', () => clearInterval(timer));
    reelBox.addEventListener('mouseleave', () => (timer = setInterval(next, sliderInterval)));

    window.addEventListener('resize', () => {
        track.style.transform = `translateX(-${item * 100}%)`;
    });

    const progressBar = reelBox.querySelector('.news-reel-progress');

    function startProgressBar() {
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        progressBar.offsetWidth;

        progressBar.style.transition = `width ${sliderInterval}ms ease-in-out`;
        progressBar.style.width = '100%';
    }

    function resetTimer() {
        clearInterval(timer);
        startProgressBar();
        timer = setInterval(() => {
            next();
            startProgressBar();
        }, sliderInterval);
    }

    reelBox.addEventListener('mouseenter', () => {
        resetTimer();
        clearInterval(timer);
        progressBar.style.width = '0';
    });

    reelBox.addEventListener('mouseleave', () => {
        resetTimer();
    });

    startProgressBar();
    updateIndicators();
};

document.addEventListener("DOMContentLoaded", () => {
    if (newsReel) {
        addNewsReelArea();
    }
    addLinksToTags();
});