const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        searchProductsMain();
    });
}

function searchProductsMain() {
    const searchInputMain = document.getElementById('searchInputMain').value.toLowerCase();
    if (searchInputMain.length < 3) {
        showSearchHint('Ingresa al menos 3 letras para buscar');
        return;
    }
    location.replace("productos.html?search=" + encodeURIComponent(searchInputMain));
}

function showSearchHint(message) {
    hideSearchHint();
    const form = document.getElementById('searchForm');
    const hint = document.createElement('p');
    hint.className = 'search-hint';
    hint.id = 'searchHint';
    hint.textContent = message;
    form.parentNode.appendChild(hint);
}

function hideSearchHint() {
    const hint = document.getElementById('searchHint');
    if (hint) {
        hint.remove();
    }
}

async function fetchBestsellers() {
    const db = await fetch(productsUrl);
    const content = await db.text();

    json = JSON.parse(content.substring(47).slice(0, -2));
    data = json.table.rows;
    for (let index = 0; index < data.length; index++) {
        if (data[index].c[7].v === 'No') continue;
        if (data[index].c[7] && data[index].c[7].v === 'Si') {
            const product = createProductData(data, index);
            createBestsellerTemplate(product);
        }
    }
}

fetchBestsellers();

function updateQuote(row) {
    if (row[0] && row[0].v && row[1] && row[1].v) {
        document.getElementById('quoteText').textContent = '"' + row[0].v + '"';
        document.getElementById('quoteAuthor').textContent = '— ' + row[1].v;
    }
}

function collectReviews(rows) {
    const reviews = [];
    for (let index = 0; index < rows.length; index++) {
        if (rows[index].c[4] && rows[index].c[4].v) {
            reviews.push({
                stars: rows[index].c[3] ? rows[index].c[3].v : 5,
                text: rows[index].c[4].v,
                name: rows[index].c[5] ? rows[index].c[5].v : 'Anónimo',
                city: rows[index].c[6] ? rows[index].c[6].v : ''
            });
        }
    }
    return reviews;
}

function loadReviews(reviews) {
    const container = document.getElementById('testimonialsCarousel');
    container.innerHTML = '';
    for (let index = 0; index < reviews.length; index++) {
        createReviewTemplate(reviews[index]);
    }
}

async function fetchContent() {
    const db = await fetch(dbUrl);
    const content = await db.text();
    const json = JSON.parse(content.substring(47).slice(0, -2));
    const rows = json.table.rows;
    if (rows.length === 0) return;
    updateQuote(rows[0].c);
    const reviews = collectReviews(rows);
    if (reviews.length > 0) loadReviews(reviews);
}

function getScrollAmount(carousel) {
    const card = carousel.querySelector('.product-card');
    if (!card) return 300;
    return card.offsetWidth + 25;
}

function setupBestsellersNav() {
    const carousel = document.getElementById('bestsellersCarousel');
    const btnLeft = document.getElementById('scrollLeft');
    const btnRight = document.getElementById('scrollRight');
    btnLeft.addEventListener('click', function() {
        carousel.scrollBy({ left: -getScrollAmount(carousel), behavior: 'smooth' });
    });
    btnRight.addEventListener('click', function() {
        carousel.scrollBy({ left: getScrollAmount(carousel), behavior: 'smooth' });
    });
}

setupBestsellersNav();

function getReviewScrollAmount(carousel) {
    const card = carousel.querySelector('.testimonial-card');
    if (!card) return 300;
    return card.offsetWidth + 25;
}

function setupReviewsNav() {
    const carousel = document.getElementById('testimonialsCarousel');
    const btnLeft = document.getElementById('reviewScrollLeft');
    const btnRight = document.getElementById('reviewScrollRight');
    btnLeft.addEventListener('click', function() {
        carousel.scrollBy({ left: -getReviewScrollAmount(carousel), behavior: 'smooth' });
    });
    btnRight.addEventListener('click', function() {
        carousel.scrollBy({ left: getReviewScrollAmount(carousel), behavior: 'smooth' });
    });
}

setupReviewsNav();
fetchContent();

function setupReels() {
    const reels = document.getElementById('socialReels');
    if (!reels) return;
    setupMobileCarousel(reels);
}

function setupMobileCarousel(reels) {
    const items = [...reels.querySelectorAll('.social-reel-item')];
    const N = items.length;
    if (N < 3) return;

    // centerIndex: welches item gerade in der Mitte ist
    // Start bei 1, damit items[0]=links, items[1]=mitte, items[2]=rechts (wie vorher)
    let centerIndex = 1;
    let isAnimating = false;
    let centerHasSound = false;
    let preventNextClick = false;

    const T = {
        offLeft:  'translateX(-200%) scale(0.85)',
        left:     'translateX(-100%) scale(0.85)',
        center:   'translateX(0) scale(1)',
        right:    'translateX(100%) scale(0.85)',
        offRight: 'translateX(200%) scale(0.85)',
        hidden:   'translateX(400%) scale(0.85)',  // weit außerhalb, unsichtbar
    };

    // Hilfs-Funktion: Index mit Wrap-Around berechnen
    function idx(offset) {
        return ((centerIndex + offset) % N + N) % N;
    }

    function setTransitions(enabled, targetItems) {
        const val = enabled
            ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease'
            : 'none';
        (targetItems || items).forEach(item => item.style.transition = val);
    }

    function updateOverlays() {
        items.forEach((item, i) => {
            item.classList.toggle('is-center', i === centerIndex);
            item.classList.toggle('is-side',   i !== centerIndex);
        });
    }

    function centerVideo() {
        return items[centerIndex].querySelector('.social-reel-video');
    }

    function rotateRight(withSound) {
        if (isAnimating) return;
        isAnimating = true;

        const iLeft     = idx(-1);
        const iCenter   = centerIndex;
        const iRight    = idx(1);
        const iNewRight = idx(2);

        const oldLeft   = items[iLeft];
        const oldCenter = items[iCenter];
        const oldRight  = items[iRight];
        const newRight  = items[iNewRight];

        // Bei N>3: neues rechtes Item aus dem Verborgenen holen (instant, kein Transition)
        if (iNewRight !== iLeft) {
            setTransitions(false, [newRight]);
            newRight.style.transform = T.offRight;
            newRight.getBoundingClientRect(); // reflow erzwingen
        }

        setTransitions(true);
        oldLeft.style.transform   = T.offLeft;
        oldCenter.style.transform = T.left;
        oldRight.style.transform  = T.center;
        if (iNewRight !== iLeft) {
            newRight.style.transform = T.right;
        }

        oldCenter.querySelector('.social-reel-video').pause();
        const newCenterVideo = oldRight.querySelector('.social-reel-video');
        newCenterVideo.currentTime = 0;
        newCenterVideo.muted = !withSound;
        newCenterVideo.play().catch(() => {});
        centerHasSound = withSound;

        oldRight.classList.replace('is-side', 'is-center');
        oldCenter.classList.replace('is-center', 'is-side');

        setTimeout(() => {
            setTransitions(false);
            // Bei N=3: teleportieren (gleiche Item wird rechts wieder gebraucht)
            // Bei N>3: verstecken
            oldLeft.style.transform = iNewRight === iLeft ? T.right : T.hidden;
            centerIndex = idx(1);
            updateOverlays();
            isAnimating = false;
            requestAnimationFrame(() => requestAnimationFrame(() => setTransitions(true)));
        }, 420);
    }

    function rotateLeft(withSound) {
        if (isAnimating) return;
        isAnimating = true;

        const iLeft    = idx(-1);
        const iCenter  = centerIndex;
        const iRight   = idx(1);
        const iNewLeft = idx(-2);

        const oldLeft   = items[iLeft];
        const oldCenter = items[iCenter];
        const oldRight  = items[iRight];
        const newLeft   = items[iNewLeft];

        // Bei N>3: neues linkes Item aus dem Verborgenen holen (instant, kein Transition)
        if (iNewLeft !== iRight) {
            setTransitions(false, [newLeft]);
            newLeft.style.transform = T.offLeft;
            newLeft.getBoundingClientRect(); // reflow erzwingen
        }

        setTransitions(true);
        oldLeft.style.transform   = T.center;
        oldCenter.style.transform = T.right;
        oldRight.style.transform  = T.offRight;
        if (iNewLeft !== iRight) {
            newLeft.style.transform = T.left;
        }

        oldCenter.querySelector('.social-reel-video').pause();
        const newCenterVideo = oldLeft.querySelector('.social-reel-video');
        newCenterVideo.currentTime = 0;
        newCenterVideo.muted = !withSound;
        newCenterVideo.play().catch(() => {});
        centerHasSound = withSound;

        oldLeft.classList.replace('is-side', 'is-center');
        oldCenter.classList.replace('is-center', 'is-side');

        setTimeout(() => {
            setTransitions(false);
            oldRight.style.transform = iNewLeft === iRight ? T.left : T.hidden;
            centerIndex = idx(-1);
            updateOverlays();
            isAnimating = false;
            requestAnimationFrame(() => requestAnimationFrame(() => setTransitions(true)));
        }, 420);
    }

    // Klick-Handler für alle Items
    items.forEach(item => {
        item.addEventListener('click', () => {
            if (preventNextClick) { preventNextClick = false; return; }
            if (item === items[centerIndex]) {
                // Mitte: Ton an/aus
                centerHasSound = !centerHasSound;
                const cv = centerVideo();
                cv.muted = !centerHasSound;
                if (centerHasSound && cv.paused) cv.play().catch(() => {});
            } else if (item === items[idx(1)]) {
                rotateRight(true);
            } else if (item === items[idx(-1)]) {
                rotateLeft(true);
            }
            // Klicks auf versteckte Items werden ignoriert
        });
    });

    // Swipe-Unterstützung (kein Ton beim Wischen)
    let touchStartX = 0;
    reels.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    reels.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
            preventNextClick = true;
            if (dx < 0) rotateRight(false);
            else rotateLeft(false);
        }
    }, { passive: true });

    // Autoplay wenn section sichtbar wird
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const cv = centerVideo();
            if (entry.isIntersecting) {
                cv.muted = true;
                centerHasSound = false;
                cv.play().catch(() => {});
            } else {
                items.forEach(item => item.querySelector('.social-reel-video').pause());
            }
        });
    }, { threshold: 0.4 });

    observer.observe(reels);

    // Pfeil-Buttons erstellen (CSS steuert Sichtbarkeit: nur ab 900px)
    const prevBtn = document.createElement('button');
    prevBtn.className = 'social-carousel-btn social-carousel-prev';
    prevBtn.setAttribute('aria-label', 'Anterior');
    prevBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'social-carousel-btn social-carousel-next';
    nextBtn.setAttribute('aria-label', 'Siguiente');
    nextBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;

    reels.appendChild(prevBtn);
    reels.appendChild(nextBtn);

    prevBtn.addEventListener('click', () => rotateLeft(false));
    nextBtn.addEventListener('click', () => rotateRight(false));

    // Initialisierung: alle Items verstecken, dann die 3 sichtbaren positionieren
    setTransitions(false);
    items.forEach(item => { item.style.transform = T.hidden; });
    items[idx(-1)].style.transform = T.left;
    items[centerIndex].style.transform = T.center;
    items[idx(1)].style.transform  = T.right;
    updateOverlays();
    requestAnimationFrame(() => requestAnimationFrame(() => setTransitions(true)));
}

setupReels();
