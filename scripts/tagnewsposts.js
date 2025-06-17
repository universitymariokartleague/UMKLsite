/*
    This script makes <tag> elements clickable, sending you to the news 
    page with the tag as a query parameter (to be used as a filter).
*/

document.addEventListener("DOMContentLoaded", () => {
    // Check for 'tag' URL parameter and highlight matching tags
    const params = new URLSearchParams(window.location.search);
    const selectedTag = params.get('tag');

    document.querySelectorAll('.news-date').forEach((element, index) => {
        // Wrap each <tag> inside .news-date with a hyperlink
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
    }
});