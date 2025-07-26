/*
    This script changes the theme of the site depending on the holiday.
*/

export { halloweenEasterEgg, xmasEasterEgg };

function injectMusic(path) {
    const audioContainer = document.createElement('div');
    audioContainer.innerHTML = `
        <audio id="audio" src="${path}" preload="auto"></audio>
        <script type="text/javascript" src="scripts/audioplayer.js" id="audioPlayerScript" defer></script>
        <div id="audioStatus" data-playlist="bgm.txt" class="hidden">
            <span id="BGMName">Music</span><br />
            <div class="audioControls">
                <span class="playContainer">
                    <img src="" id="playIcon" />
                </span>
                <div id="audioProgressBar">
                    <div id="audioBufferBar"></div>
                </div>
                <span id="currentTime" class="time">0:00</span>
                <span>/</span>
                <span id="totalTime" class="time">0:00</span>
            </div>
            <p id="playlistText" class="hidden"></p>
        </div>
        <noscript><blockquote class="rainbow"><b>Javascript disabled!</b><br />Please enable javascript, as is it used on this page<br /></blockquote></noscript>
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
        backgroundImage: 'url("assets/media/eastereggs/halloween/splunkin.webp")',
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
        backgroundImage: 'url("assets/media/eastereggs/halloween/jackogoomba.webp")',
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
            backgroundImage: 'url("assets/media/eastereggs/halloween/ghost.webp")',
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
            ghost.style.backgroundImage = 'url("assets/media/eastereggs/halloween/ghost2.webp")';
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

    for (const [key, value] of Object.entries(themeColors)) {
        root.style.setProperty(key, value);
    }

    const accentColor = "#7025b8";
    const style = document.createElement('style');
    style.textContent = `
        .nav-bar-title, .nav-flex a, footer, footer .no-color-link {
            color: ${accentColor} !important;
        }
        .nav-selected {
            outline: ${accentColor}83 solid 1px;
        }
        a:link {
            transition: unset;
        }
        .nav-dropdown-content a:hover {
            color: #fff !important;
            transition: unset;
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
        .day.selected {
            background-color: ${accentColor}30!important;
            outline: 1px solid ${accentColor}D0;
            border: 1px solid ${accentColor}D0;
        }
        .day.selected:hover {
            background-color: ${accentColor}80!important;
        }
        .today:hover {
            background-color: ${accentColor};
        }
    `;
    document.head.appendChild(style);

    setupSnowflakes();
    injectMusic("assets/bgm/xmas/loading playlist.mp3");

    setTimeout(() => {
        const style = document.createElement('style');
        style.textContent = `
            a:link {
                transition: color 0.10s;
            }
        `;
        document.head.appendChild(style);
    }, 500);
}

function setupSnowflakes() {
    const createElementWithStyles = (tag, styles) => {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        return el;
    };

    const createSnowflake = () => {
        const opacity = (Math.random() * 0.5 + 0.3).toFixed(2);
        const size = Math.random() * 5 + 1;

        let startX = Math.random() * window.innerWidth;
        let startY = -10;
        let endX = startX + (Math.random() * 100 - 50);
        let endY = window.innerHeight + 10;

        const avoidRadius = 100;

        const dx = startX;
        const dy = startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < avoidRadius) {
            const angle = Math.atan2(dy, dx);
            const pushDistance = avoidRadius - dist;

            startX += Math.cos(angle) * pushDistance;
            endX += Math.cos(angle) * pushDistance;
        }

        const snowflake = createElementWithStyles('div', {
            position: 'fixed',
            left: `${startX}px`,
            top: `${startY}px`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: '#FFF',
            borderRadius: '50%',
            opacity: opacity,
            pointerEvents: 'none',
            zIndex: '4',
        });

        document.body.appendChild(snowflake);

        const duration = 5000 + Math.random() * 3000;

        const animation = snowflake.animate([
            {
                transform: `translate(0, 0)`,
                opacity: opacity
            },
            {
                transform: `translate(${endX - startX}px, ${endY - startY}px)`,
                opacity: '0'
            }
        ], {
            duration: duration,
            iterations: 1,
            easing: 'linear'
        });

        animation.onfinish = () => snowflake.remove();
    };

    setInterval(createSnowflake, 50);
}