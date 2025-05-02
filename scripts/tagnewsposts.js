window.addEventListener('load', function() {
    document.querySelectorAll('.news-date').forEach((element, index) => {
        // Wrap each <tag> inside .news-date with a hyperlink
        element.querySelectorAll('tag').forEach(tag => {
            const tagText = tag.textContent.trim();
            const anchor = document.createElement('a');
            anchor.href = `/pages/news/?tag=${encodeURIComponent(tagText)}`;
            anchor.className = 'tag-link';

            // Move the <tag> inside the <a>
            tag.className = 'tag-link-text';
            tag.parentNode.replaceChild(anchor, tag);
            anchor.appendChild(tag);
        });

        const rect = element.getBoundingClientRect();
        const width = rect.width;

        if (width > 200) {
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
});