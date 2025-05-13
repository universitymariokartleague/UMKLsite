export { halloweenEasterEgg, xmasEasterEgg };

function injectMusic(path) {
    const audioContainer = document.createElement('div');
    audioContainer.innerHTML = `
        <audio id="audio" src="${path}" preload="auto"></audio>
        <div id="audioStatus" data-playlist="bgm.txt" class="hidden">
            <span id="BGMName">Music</span></br>
            <span class="playContainer">
                <img src="" id="playIcon">
            </span>
            <span id="audioProgressBar"></span>
            <span id="currentTime" class="time">0:00</span> / <span id="totalTime" class="time">0:00</span>
            <p id="playlistText" class="hidden"></p>
        </div>
        <noscript><blockquote class="rainbow"><b>Javascript disabled!</b><br>Please enable javascript, as it is used on this page<br></blockquote></noscript>
    `;
    document.body.appendChild(audioContainer);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'scripts/audioplayer.js';
    script.defer = true;
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/audioplayer.css';
    document.head.appendChild(link);
}

function createElementWithStyles(tag, styles) {
    const element = document.createElement(tag);
    Object.assign(element.style, styles);
    return element;
}

function halloweenEasterEgg() {
    meta.content = "dark";
    root.classList.add("dark-theme");
    root.classList.remove("light-theme");

    const themeColors = {
        '--accent-color': '#ff640a',
        '--link-color': '#ff640a',
        '--link-hover-color': '#ffcaab',
        '--highlight-color': '#ff640ad0'
    };
    Object.entries(themeColors).forEach(([key, value]) => root.style.setProperty(key, value));

    document.querySelectorAll('img').forEach(img => {
        img.style.boxShadow = '0 0 100px 10px rgba(255, 255, 255, 0.25)';
    });

    const pumpkinLeft = createElementWithStyles('div', {
        position: 'fixed',
        bottom: '25px',
        left: '10px',
        width: '85px',
        height: '85px',
        backgroundImage: 'url("assets/image/eastereggs/halloween/splunkin.webp")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        zIndex: '1000'
    });

    const pumpkinRight = createElementWithStyles('div', {
        position: 'fixed',
        bottom: '22px',
        right: '10px',
        width: '100px',
        height: '100px',
        backgroundImage: 'url("assets/image/eastereggs/halloween/jackogoomba.webp")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        zIndex: '1000'
    });

    document.body.append(pumpkinLeft, pumpkinRight);

    const createFlyingGhost = () => {
        const ghost = createElementWithStyles('div', {
            position: 'fixed',
            width: '50px',
            height: '50px',
            backgroundImage: 'url("assets/image/eastereggs/halloween/ghost.webp")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            zIndex: '1000',
            pointerEvents: 'none',
            opacity: '0'
        });

        const [startX, startY, endX, endY] = [Math.random() * window.innerWidth, Math.random() * window.innerHeight, Math.random() * window.innerWidth, Math.random() * window.innerHeight];
        ghost.style.left = `${startX}px`;
        ghost.style.top = `${startY}px`;

        if (endX < startX) {
            ghost.style.backgroundImage = 'url("assets/image/eastereggs/halloween/ghost2.webp")';
        }

        document.body.appendChild(ghost);

        const animation = ghost.animate([
            { transform: `translate(${startX}px, ${startY}px)`, opacity: '0' },
            { transform: `translate(${(startX + endX) / 2}px, ${(startY + endY) / 2}px)`, opacity: '1' },
            { transform: `translate(${endX}px, ${endY}px)`, opacity: '0' }
        ], {
            duration: 5000 + Math.random() * 3000,
            iterations: 1,
            easing: 'ease-in-out'
        });

        animation.onfinish = () => {
            createFlyingGhost();
            ghost.remove();
        };
    };

    Array.from({ length: 10 }).forEach(() => setTimeout(createFlyingGhost, 1000));
    injectMusic("assets/bgm/halloween/loading playlist.mp3");
}

function xmasEasterEgg() {
    const themeColors = {
        '--accent-color': '#d2bce8',
        '--link-color': '#d2bce8',
        '--link-hover-color': '#ffffff',
        '--highlight-color': '#ffffff50'
    };
    Object.entries(themeColors).forEach(([key, value]) => root.style.setProperty(key, value));

    const accentColor = "#7025b8";
    const style = document.createElement('style');
    style.textContent = `
        .nav-bar-title, .nav-flex a, footer, footer .no-color-link {
            color: ${accentColor} !important;
        }
        .nav-selected {
            outline: ${accentColor}83 solid 1px;
        }
        .nav-dropdown-content a:hover {
            color: #fff !important;
        }
        @media screen and (max-width: 767px) {
            .nav-dropdown-content a:hover {
                background-color: ${accentColor};
            }
            .nav-dropdown-content a {
                color: ${accentColor} !important;
            }
        }
        a[target="_blank"]::after {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M9 2v1h3.3L6 9.3l.7.7L13 3.7V7h1V2ZM4 4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V7l-1 1v4c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1h4l1-1Z' style='fill:%23b07be3'/%3E%3C/svg%3E") !important;
        }
    `;
    document.head.appendChild(style);

    const createSnowflake = () => {
        const snowflake = createElementWithStyles('div', {
            position: 'fixed',
            width: '10px',
            height: '10px',
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: Math.random().toString(),
            pointerEvents: 'none',
            zIndex: '1000'
        });

        const [startX, endX, startY, endY] = [Math.random() * window.innerWidth, Math.random() * window.innerWidth, -10, window.innerHeight + 10];
        snowflake.style.left = `${startX}px`;
        snowflake.style.top = `${startY}px`;

        document.body.appendChild(snowflake);

        const animation = snowflake.animate([
            { transform: `translate(${startX}px, ${startY}px)`, opacity: snowflake.style.opacity },
            { transform: `translate(${endX}px, ${endY}px)`, opacity: '0' }
        ], {
            duration: 5000 + Math.random() * 3000,
            iterations: 1,
            easing: 'linear'
        });

        animation.onfinish = () => snowflake.remove();
    };

    setInterval(createSnowflake, 100);
    injectMusic("assets/bgm/xmas/loading playlist.mp3");
}
