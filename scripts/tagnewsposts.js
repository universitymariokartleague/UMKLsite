/*
    This script makes <tag> elements clickable, sending you to the news 
    page with the tag as a query parameter (to be used as a filter).
*/

const newsReel = document.getElementById("news-reel");
const sliderInterval = 6500;
const params = new URLSearchParams(window.location.search);
const selectedTag = params.get('tag');
const existingSearch = params.get('search') || '';

function addLinksToTags() {
    const newsDates = document.querySelectorAll('.news-date');
    const tagLower = selectedTag ? selectedTag.toLowerCase() : null;
    let hasAnimatedTags = false;

    const style = document.createElement('style');
    style.textContent = `@keyframes news-tag-scroll { 0% { transform: translateX(0); } 50% { transform: translateX(var(--scroll-amount)); } 100% { transform: translateX(0); } }`;
    document.head.appendChild(style);

    newsDates.forEach((element) => {
        const tags = element.querySelectorAll('tag');

        tags.forEach(tag => {
            const tagText = tag.textContent.trim();
            const isSelected = tagLower && tagText.toLowerCase() === tagLower;
            const href = isSelected ? '/pages/news/' : `/pages/news/?tag=${encodeURIComponent(tagText.toLowerCase())}`;

            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.className = 'tag-link';

            tag.translate = false;
            tag.className = 'tag-link-text';
            tag.parentNode.replaceChild(anchor, tag);
            anchor.appendChild(tag);
        });

        const rect = element.getBoundingClientRect();
        const width = rect.width;

        if (width > 205) {
            element.style.setProperty('--scroll-amount', `-${width - 200}px`);
            element.style.animation = 'news-tag-scroll 5s ease-in-out infinite';
            hasAnimatedTags = true;
        }
    });

    if (!hasAnimatedTags) style.remove();

    if (tagLower) {
        document.querySelectorAll('.news-date tag').forEach(tag => {
            if (tag.textContent.trim().toLowerCase() === tagLower) {
                tag.classList.add('tag-selected');
            }
        });

        const containers = document.querySelectorAll('#news-container > *');
        containers.forEach(container => {
            const newsDate = container.querySelector('.news-date');
            if (newsDate) {
                const hasMatch = Array.from(newsDate.querySelectorAll('tag')).some(
                    tag => tag.textContent.trim().toLowerCase() === tagLower
                );
                if (!hasMatch) container.style.display = 'none';
            }
        });
    }
}

function addNewsReelArea() {
    const items = document.querySelectorAll('#news-container > *');
    if (!items.length) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const data = [];
    const firstThree = Math.min(3, items.length);

    for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (i < firstThree || !el.querySelector('.news-date')) {
            const linkEl = el.querySelector('a[href]');
            const imgEl = el.querySelector('img');
            const bgImg = (imgEl && imgEl.src) || el.dataset.image || 
                (el.style.backgroundImage && el.style.backgroundImage.replace(/^url\(["']?(.+?)["']?\)$/, '$1')) || '';

            const titleEl = el.querySelector('.news-title');
            const dateEl = el.querySelector('.news-date');
            const descEl = el.querySelector('.news-desc');

            const tagsHTML = Array.from(el.querySelectorAll('.news-date tag, .news-date .tag-link'))
                .map(tag => tag.outerHTML).join('');

            let date = '';
            if (dateEl) {
                date = dateEl.textContent.trim();
                const [day, month, year] = date.split(" ")[0].split('/');
                const itemDate = new Date(`${year}-${month}-${day}`);
                if (i >= firstThree && itemDate < sevenDaysAgo) continue;
            }

            data.push({
                href: linkEl ? linkEl.href : '#',
                img: bgImg,
                title: titleEl ? titleEl.textContent.trim() : (linkEl ? linkEl.textContent.trim() : 'Untitled'),
                date: date,
                description: descEl ? descEl.textContent.trim() : '',
                tagsHTML
            });
        }
    }

    if (!data.length) return;

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
    const fragment = document.createDocumentFragment();

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
        fragment.appendChild(slide);

        const dot = document.createElement('span');
        dot.className = 'news-reel-dot';
        dot.dataset.index = i;
        indicatorsContainer.appendChild(dot);
    });

    track.appendChild(fragment);
    newsReel.innerHTML = '';
    newsReel.appendChild(reelBox);

    let currentIndex = 0;
    const total = data.length;
    const dots = indicatorsContainer.querySelectorAll('.news-reel-dot');
    const progressBar = reelBox.querySelector('.news-reel-progress');

    function updateIndicators() {
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentIndex]?.classList.add('active');
    }

    function goToSlide(index) {
        currentIndex = (index + total) % total;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateIndicators();
        resetTimer();
    }

    function startProgressBar() {
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        progressBar.offsetWidth;
        progressBar.style.transition = `width ${sliderInterval}ms ease-in-out`;
        progressBar.style.width = '100%';
    }

    let timer;
    function resetTimer() {
        clearInterval(timer);
        startProgressBar();
        timer = setInterval(() => {
            goToSlide(currentIndex + 1);
            startProgressBar();
        }, sliderInterval);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', e => {
            clearInterval(timer);
            goToSlide(parseInt(e.target.dataset.index, 10));
        });
    });

    reelBox.addEventListener('mouseenter', () => {
        clearInterval(timer);
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
    });

    reelBox.addEventListener('mouseleave', resetTimer);

    window.addEventListener('resize', () => {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
    });

    startProgressBar();
    updateIndicators();
};

function addSearchBar() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    let searchWrapper = document.getElementById('news-search-wrapper');
    let searchInput = document.getElementById('news-search');

    const tagChip = selectedTag ? `<span class="news-search-tag-chip">${selectedTag}<button class="news-search-tag-remove" aria-label="Remove tag">&times;</button></span>` : '';
    const disabledAttr = selectedTag ? 'disabled' : '';
    const placeholder = selectedTag ? '' : 'Search news...';

    searchWrapper.innerHTML = `
        ${tagChip}
        <input type="text" id="news-search" placeholder="${placeholder}" value="${existingSearch}" ${disabledAttr} />
    `;

    searchInput = document.getElementById('news-search');

    let noResultsMsg = document.getElementById('news-no-results');
    if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'news-no-results';
        noResultsMsg.innerHTML = `
            <p>No results found</p>
            <button id="news-clear-search">Clear search</button>
        `;
        noResultsMsg.style.display = "none";
        newsContainer.parentNode.insertBefore(noResultsMsg, newsContainer.nextSibling);
    }

    document.getElementById('news-clear-search')?.addEventListener('click', () => {
        const url = new URL(window.location);
        url.searchParams.delete('search');
        window.location.href = url.toString();
    });

    const tagRemoveBtn = searchWrapper.querySelector('.news-search-tag-remove');
    if (tagRemoveBtn) {
        tagRemoveBtn.addEventListener('click', () => {
            const url = new URL(window.location);
            url.searchParams.delete('tag');
            window.location.href = url.toString();
        });
    }

    const containers = document.querySelectorAll('#news-container > *');
    const tagLower = selectedTag ? selectedTag.toLowerCase() : null;
    let debounceTimer;

    function filterNews(searchTerm) {
        const term = searchTerm.toLowerCase();
        let visibleCount = 0;

        containers.forEach(container => {
            const titleEl = container.querySelector('.news-title');
            const descEl = container.querySelector('.news-desc');
            const dateEl = container.querySelector('.news-date');

            const title = titleEl ? titleEl.textContent.toLowerCase() : '';
            const desc = descEl ? descEl.textContent.toLowerCase() : '';
            const date = dateEl ? dateEl.textContent.toLowerCase() : '';

            let tagMatch = true;
            if (tagLower) {
                const tagElements = container.querySelectorAll('tag, .tag-link-text');
                tagMatch = Array.from(tagElements).some(tag =>
                    tag.textContent.trim().toLowerCase() === tagLower
                );
            }

            const textMatch = !term || title.includes(term) || desc.includes(term) || date.includes(term);

            container.style.display = (textMatch && tagMatch) ? '' : 'none';
            if (textMatch && tagMatch) visibleCount++;
        });

        noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    function updateURL(searchTerm) {
        const url = new URL(window.location);
        if (searchTerm) {
            url.searchParams.set('search', searchTerm);
        } else {
            url.searchParams.delete('search');
        }
        window.history.replaceState({}, '', url);
    }

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = e.target.value.trim();
            filterNews(searchTerm);
            updateURL(searchTerm);
        }, 10);
    });

    if (existingSearch) {
        filterNews(existingSearch);
    } else if (selectedTag) {
        filterNews('');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (newsReel) {
        addNewsReelArea();
    }
    addLinksToTags();
    addSearchBar();
});