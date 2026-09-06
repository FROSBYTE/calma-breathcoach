document.addEventListener('DOMContentLoaded', () => {
    // 1. Set current year dynamically
    const yearElem = document.getElementById('current-year');
    if (yearElem) {
        yearElem.textContent = new Date().getFullYear();
    }

    // 2. Screenshot Carousel in Why Calma section
    (function initScreenshotCarousel() {
        const track = document.getElementById('carouselTrack');
        const dotsBox = document.getElementById('carouselDots');
        if (!track || !dotsBox) return;

        const slides = track.children;
        let index = 0;
        let timer = null;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Create pagination dots
        for (let i = 0; i < slides.length; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'View screenshot ' + (i + 1));
            dot.addEventListener('click', () => {
                goTo(i);
                restart();
            });
            dotsBox.appendChild(dot);
        }

        function goTo(i) {
            index = (i + slides.length) % slides.length;
            track.scrollTo({
                left: index * track.clientWidth,
                behavior: reducedMotion ? 'auto' : 'smooth'
            });
        }

        function updateDots() {
            for (let i = 0; i < dotsBox.children.length; i++) {
                dotsBox.children[i].classList.toggle('active', i === index);
            }
        }

        track.addEventListener('scroll', () => {
            const i = Math.round(track.scrollLeft / track.clientWidth);
            if (i !== index) {
                index = i;
                updateDots();
            }
        }, { passive: true });

        const prevBtn = document.querySelector('.carousel-phone-container .carousel-btn.prev');
        const nextBtn = document.querySelector('.carousel-phone-container .carousel-btn.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                goTo(index - 1);
                restart();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goTo(index + 1);
                restart();
            });
        }

        function start() {
            if (!reducedMotion) {
                timer = setInterval(() => { goTo(index + 1); }, 4500);
            }
        }
        function stop() { clearInterval(timer); }
        function restart() { stop(); start(); }

        const container = document.querySelector('.carousel-phone-container');
        if (container) {
            container.addEventListener('mouseenter', stop);
            container.addEventListener('mouseleave', restart);
            track.addEventListener('pointerdown', stop, { passive: true });
            track.addEventListener('pointerup', restart, { passive: true });
        }

        start();
    })();
});
