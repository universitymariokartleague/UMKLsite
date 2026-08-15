/*
    This script makes <tag> elements clickable, sending you to the news 
    page with the tag as a query parameter (to be used as a filter).
*/

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
            const href = isSelected ? '/news/' : `/news/?tag=${encodeURIComponent(tagText.toLowerCase())}`;

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
    addSearchBar();
    addLinksToTags();
});