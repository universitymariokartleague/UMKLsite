window.addEventListener('load', function() {
    const newsContainer = document.getElementById("news-container");

    document.querySelectorAll('.news-date').forEach((element, index) => {
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