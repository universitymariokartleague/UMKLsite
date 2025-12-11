/*
    This script changes the theme of the site depending on the holiday.
*/

export { halloweenEasterEgg, winterEasterEgg };

function injectMusic(path) {
    if (document.getElementById('audio')) return;

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
    root.classList.replace("light-theme", "dark-theme");

    const themeColors = {
        '--accent-color': '#ff640a',
        '--link-color': '#ff640a',
        '--link-hover-color': '#ffcaab',
        '--highlight-color': '#ff640ad0',
        '--button-color': '#ff640a'
    };
    Object.entries(themeColors).forEach(([k, v]) => root.style.setProperty(k, v));

    const style = document.createElement('style');
    style.textContent = `
        a[target="_blank"]::after {
            content: "";
            width: 1em;
            height: 1em;
            margin: 0 0em 0.1em 0.15em;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M9 2v1h3.3L6 9.3l.7.7L13 3.7V7h1V2ZM4 4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V7l-1 1v4c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1h4l1-1Z' style='fill:%23ff640a'/%3E%3C/svg%3E");
            background-size: contain;
            display: inline-block;
            vertical-align: sub;
        }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('img').forEach(img => {
        img.style.boxShadow = '0 0 50px 5px rgba(255, 255, 255, 0.33)';
    });

    const decorations = [
        { side: 'left', size: 55, img: 'splunkin.avif', position: 'bottom' },
        { side: 'right', size: 75, img: 'jackogoomba.avif', position: 'bottom' },
        { side: 'left', size: 100, img: 'whiteweb.gif', position: 'top' },
        { side: 'right', size: 100, img: 'whiteweb.gif', position: 'top' },
        { side: 'left', size: 100, img: 'skel.gif', position: 'bottom' },
        { side: 'right', size: 100, img: 'skelbend.gif', position: 'bottom' }
    ];

    decorations.forEach(({ side, size, img, position }) => {
        document.body.appendChild(
            createElementWithStyles('div', {
                position: 'fixed',
                [position]: `2px`,
                [side]: `${Math.random() * 50}px`,
                width: `${size}px`,
                height: `${size}px`,
                background: `url("assets/media/eastereggs/halloween/${img}") no-repeat center/contain`,
                zIndex: '100',
                pointerEvents: 'none'
            })
        );
    });

    const createFlyingGhost = () => {
        const ghost = createElementWithStyles('div', {
            position: 'fixed',
            width: '50px',
            height: '50px',
            background: 'url("assets/media/eastereggs/halloween/ghost.avif") no-repeat center/contain',
            zIndex: '1000',
            pointerEvents: 'none',
            opacity: '0'
        });

        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const endX = Math.random() * window.innerWidth;
        const endY = Math.random() * window.innerHeight;

        if (endX < startX) ghost.style.backgroundImage = 'url("assets/media/eastereggs/halloween/ghost2.avif")';

        ghost.style.left = `${startX}px`;
        ghost.style.top = `${startY}px`;
        document.body.appendChild(ghost);

        const duration = 5000 + Math.random() * 3000;

        ghost.animate(
            [
                { transform: 'translate(0,0)', opacity: 0 },
                { transform: `translate(${(endX - startX) / 2}px, ${(endY - startY) / 2}px)`, opacity: 1 },
                { transform: `translate(${endX - startX}px, ${endY - startY}px)`, opacity: 0 }
            ],
            { duration, easing: 'ease-in-out' }
        ).onfinish = () => {
            ghost.remove();
            requestAnimationFrame(createFlyingGhost);
        };
    };

    for (let i = 0; i < 5; i++) {
        setTimeout(createFlyingGhost, Math.random() * 1000);
    }
    injectMusic("assets/bgm/halloween/loading playlist.mp3");
}

function winterEasterEgg() {
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
        .score-box {
            color: ${accentColor}
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

    document.addEventListener("mousemove", (event) => {
        createSnowflake(event.clientX, event.clientY);
    });

    function createSnowflake(x, y) {
        const snowflake = document.createElement("div");
        snowflake.className = "snowflake";
        snowflake.style.left = `${x}px`;
        snowflake.style.top = `${y}px`;

        const size = Math.random() * 4 + 2;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        snowflake.style.animationDuration = `${Math.random() * 2 + 3}s`;

        document.body.appendChild(snowflake);

        setTimeout(() => {
            snowflake.remove();
        }, 3000);
    }
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