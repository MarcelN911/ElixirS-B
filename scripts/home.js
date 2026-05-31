// ============================================
// HOME.JS — Elixir S&B
// Home page logic:
// hero search bar, bestsellers carousel,
// testimonials carousel, video reels carousel,
// content fetch (quote + reviews)
// ============================================

// ── Hero Search ───────────────────────────────

/**
 * Reads the search input on the home page and redirects to the products page.
 * The search term is passed as a URL parameter (?search=...) so that
 * products.js can pick it up and run the search automatically.
 */
function searchProductsMain() {
    const input = document.getElementById('searchInputMain').value.toLowerCase();
    if (input.length < 3) {
        showSearchHint('Ingresa al menos 3 letras para buscar');
        return;
    }
    location.replace('productos.html?search=' + encodeURIComponent(input));
}

/** Appends a hint message below the search form. Removes any previous hint first. */
function showSearchHint(message) {
    hideSearchHint();
    const hint     = document.createElement('p');
    hint.className = 'search-hint';
    hint.id        = 'searchHint';
    hint.textContent = message;
    document.getElementById('searchForm').parentNode.appendChild(hint);
}

/** Removes the search hint from the DOM if it exists. */
function hideSearchHint() {
    const hint = document.getElementById('searchHint');
    if (hint) {
        hint.remove();
    }
}

const searchForm = document.getElementById('searchForm');
if (searchForm && document.getElementById('searchInputMain')) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        searchProductsMain();
    });
}

// ── Bestsellers Carousel ──────────────────────

/** Shows skeleton placeholder cards in the bestsellers carousel while data is loading. */
function showBestsellerSkeletons() {
    const carousel = document.getElementById('bestsellersCarousel');
    if (!carousel) return;
    let html = '';
    for (let i = 0; i < 5; i++) {
        html += '<div class="product-card-skeleton"></div>';
    }
    carousel.innerHTML = html;
}

const BESTSELLER_MIN = 5;

/**
 * Fetches products and renders the bestsellers carousel.
 * If fewer than BESTSELLER_MIN products are marked as destacado,
 * fills the remaining slots with randomly selected active products.
 */
async function fetchBestsellers() {
    showBestsellerSkeletons();
    try {
        const response = await fetch(productsUrl);
        const json     = await response.json();
        data = json;

        const active      = data.filter(function(p) { return p.disponible !== false; });
        const bestsellers = active.filter(function(p) { return p.destacado === true; });
        const others      = active.filter(function(p) { return p.destacado !== true; });

        const needed  = Math.max(0, BESTSELLER_MIN - bestsellers.length);
        const shuffled = others.sort(function() { return Math.random() - 0.5; });
        const toShow  = bestsellers.concat(shuffled.slice(0, needed));

        document.getElementById('bestsellersCarousel').innerHTML = '';
        toShow.forEach(function(p) {
            createBestsellerTemplate(createProductData(data, data.indexOf(p)));
        });
    } catch (e) {
        console.error('[Elixir] fetchBestsellers error:', e);
        const c = document.getElementById('bestsellersCarousel');
        if (c) c.innerHTML = '';
    }
}

fetchBestsellers();

/**
 * Returns how many pixels the bestsellers carousel should scroll per click.
 * Based on the actual card width so it always scrolls exactly one card.
 */
function getScrollAmount(carousel) {
    const card = carousel.querySelector('.product-card');
    if (card) {
        return card.offsetWidth + 25;
    }
    return 300;
}

/** Wires up the left/right scroll buttons for the bestsellers carousel. */
function setupBestsellersNav() {
    const carousel = document.getElementById('bestsellersCarousel');
    const btnLeft  = document.getElementById('scrollLeft');
    const btnRight = document.getElementById('scrollRight');
    if (!carousel || !btnLeft || !btnRight) return;
    btnLeft.addEventListener('click',  function() { carousel.scrollBy({ left: -getScrollAmount(carousel), behavior: 'smooth' }); });
    btnRight.addEventListener('click', function() { carousel.scrollBy({ left:  getScrollAmount(carousel), behavior: 'smooth' }); });
}

setupBestsellersNav();

// ── Quotes ────────────────────────────────────

const QUOTES = [
    { text: 'No se puede ser elegante sin perfume. Es el accesorio invisible, inolvidable y definitivo.', author: 'Estée Lauder' },
    { text: 'El perfume es el accesorio invisible, inolvidable y definitivo. Anuncia tu llegada y prolonga tu marcha.', author: 'Coco Chanel' },
    { text: 'El perfume es una historia en olor, a veces una poesía en memoria.', author: 'Jean-Claude Ellena' },
    { text: 'El perfume es la forma más intensa del recuerdo. Es la huella invisible que dejamos en el mundo.', author: 'Patrick Süskind' },
];

/** Updates the quote section with a quote object { text, author }. */
function updateQuote(quote) {
    document.getElementById('quoteText').textContent   = '"' + quote.text + '"';
    document.getElementById('quoteAuthor').textContent = '— ' + quote.author;
}

/**
 * Shows the quotes in random order, rotating every 10 seconds.
 * If there is only one quote, it is shown without rotation.
 */
function startQuoteRotation(quotes) {
    if (quotes.length === 0) return;
    const shuffled = [...quotes].sort(function() { return Math.random() - 0.5; });
    let index = 0;
    updateQuote(shuffled[0]);
    if (quotes.length === 1) return;
    setInterval(function() {
        const textEl   = document.getElementById('quoteText');
        const authorEl = document.getElementById('quoteAuthor');
        textEl.style.opacity   = '0';
        authorEl.style.opacity = '0';
        setTimeout(function() {
            index = (index + 1) % shuffled.length;
            updateQuote(shuffled[index]);
            textEl.style.opacity   = '1';
            authorEl.style.opacity = '0.8';
        }, 600);
    }, 10000);
}

/** Clears the testimonials carousel and renders each review card. */
function loadReviews(reviews) {
    const container     = document.getElementById('testimonialsCarousel');
    container.innerHTML = '';
    reviews.forEach(function(review) { createReviewTemplate(review); });
}

/**
 * Fetches shop reviews from the NEXOMAR API and renders them in the
 * testimonials carousel. Maps MongoDB fields to the template's expected format.
 */
async function fetchShopReviews() {
    try {
        const res = await fetch(reviewsUrl);
        if (!res.ok) return;
        const reviews = await res.json();
        if (!reviews.length) return;
        loadReviews(reviews.map(function(r) {
            return { stars: r.calificacion, text: r.texto, name: r.nombre, city: r.ciudad };
        }));
    } catch (e) {
        console.error('[Elixir] fetchShopReviews error:', e);
    }
}

// ── Reviews Carousel ──────────────────────────

/**
 * Returns the scroll amount for the reviews carousel.
 * Same logic as bestsellers — one card width + gap.
 */
function getReviewScrollAmount(carousel) {
    const card = carousel.querySelector('.testimonial-card');
    if (card) {
        return card.offsetWidth + 25;
    }
    return 300;
}

/** Wires up the left/right scroll buttons for the testimonials carousel. */
function setupReviewsNav() {
    const carousel = document.getElementById('testimonialsCarousel');
    const btnLeft  = document.getElementById('reviewScrollLeft');
    const btnRight = document.getElementById('reviewScrollRight');
    if (!carousel || !btnLeft || !btnRight) return;
    btnLeft.addEventListener('click',  function() { carousel.scrollBy({ left: -getReviewScrollAmount(carousel), behavior: 'smooth' }); });
    btnRight.addEventListener('click', function() { carousel.scrollBy({ left:  getReviewScrollAmount(carousel), behavior: 'smooth' }); });
}

setupReviewsNav();
startQuoteRotation(QUOTES);
fetchShopReviews();

// ── Video Reels Carousel ──────────────────────

/** Entry point for the video carousel — finds the container and starts setup. */
function setupReels() {
    const reels = document.getElementById('socialReels');
    if (!reels) {
        return;
    }
    setupMobileCarousel(reels);
}

/**
 * Infinite video carousel that works with 3 or more videos.
 * Always shows 3 slots: left (side), center, right (side).
 * A central index tracks which video is currently in the center.
 * When the carousel rotates, the exiting video is instantly moved
 * off-screen so it can re-enter from the other side.
 */
function setupMobileCarousel(reels) {
    const items = [...reels.querySelectorAll('.social-reel-item')];
    const N     = items.length;
    if (N < 3) {
        return;
    }

    // --- Shared state ---
    let centerIndex    = 1;     // which item index is currently in the center slot
    let isAnimating    = false; // prevents overlapping animations
    let centerHasSound = false; // tracks whether the center video is unmuted
    let preventNextClick = false; // prevents a click firing right after a swipe

    // CSS transform values for each slot position
    const T = {
        offLeft:  'translateX(-200%) scale(0.85)', // fully off-screen left
        left:     'translateX(-100%) scale(0.85)', // visible left side
        center:   'translateX(0)     scale(1)',    // center (full size)
        right:    'translateX(100%)  scale(0.85)', // visible right side
        offRight: 'translateX(200%)  scale(0.85)', // fully off-screen right
        hidden:   'translateX(400%)  scale(0.85)', // hidden far right (for N > 3)
    };

    // ── Inner Helpers ─────────────────────────

    /**
     * Calculates a wrapped index relative to `centerIndex`.
     * Example: idx(1) = the item to the right of center.
     * The modulo formula handles wrapping at both ends of the array.
     */
    function idx(offset) {
        return ((centerIndex + offset) % N + N) % N;
    }

    /** Enables or disables CSS transitions on items. Pass a subset via `targetItems`. */
    function setTransitions(enabled, targetItems) {
        const val = enabled ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease' : 'none';
        (targetItems || items).forEach(item => item.style.transition = val);
    }

    /** Syncs the `is-center` and `is-side` CSS classes to match the current centerIndex. */
    function updateOverlays() {
        items.forEach((item, i) => {
            item.classList.toggle('is-center', i === centerIndex);
            item.classList.toggle('is-side',   i !== centerIndex);
        });
    }

    /** Returns the <video> element that is currently in the center slot. */
    function centerVideo() {
        return items[centerIndex].querySelector('.social-reel-video');
    }

    /**
     * Instantly moves an incoming item to an off-screen position before
     * the transition starts. This is only needed when the item is genuinely
     * new (not the same item recycled from the other side, which happens with N=3).
     * `getBoundingClientRect()` forces the browser to apply the position before
     * we re-enable transitions — without it, the instant move would animate.
     */
    function prepareItemFromHidden(item, offScreenPos, isNew) {
        if (!isNew) return;
        setTransitions(false, [item]);
        item.style.transform = offScreenPos;
        item.getBoundingClientRect(); // force reflow
    }

    /** Pauses the old center video and starts playing the new center video. */
    function switchActiveVideo(oldCenterItem, newCenterItem, withSound) {
        oldCenterItem.querySelector('.social-reel-video').pause();
        const video        = newCenterItem.querySelector('.social-reel-video');
        video.currentTime  = 0;
        video.muted        = !withSound;
        video.play().catch(() => {});
        centerHasSound     = withSound;
    }

    /**
     * Runs after the rotation animation finishes (420ms timeout).
     * Moves the exiting item to its new off-screen resting position,
     * advances the centerIndex, and re-enables transitions.
     * The double requestAnimationFrame ensures the instant move is painted
     * by the browser before transitions are switched back on.
     */
    function finishRotation(exitItem, newTransform, direction) {
        setTransitions(false);
        exitItem.style.transform = newTransform;
        centerIndex = idx(direction);
        updateOverlays();
        isAnimating = false;
        requestAnimationFrame(() => requestAnimationFrame(() => setTransitions(true)));
    }

    // ── Rotation ──────────────────────────────

    /** Rotates the carousel to the right: the right item becomes the new center. */
    function rotateRight(withSound) {
        if (isAnimating) return;
        isAnimating = true;
        const iLeft = idx(-1), iCenter = centerIndex, iRight = idx(1), iNewRight = idx(2);
        prepareItemFromHidden(items[iNewRight], T.offRight, iNewRight !== iLeft);
        setTransitions(true);
        items[iLeft].style.transform   = T.offLeft;
        items[iCenter].style.transform = T.left;
        items[iRight].style.transform  = T.center;
        if (iNewRight !== iLeft) items[iNewRight].style.transform = T.right;
        switchActiveVideo(items[iCenter], items[iRight], withSound);
        items[iRight].classList.replace('is-side', 'is-center');
        items[iCenter].classList.replace('is-center', 'is-side');
        setTimeout(() => finishRotation(items[iLeft], iNewRight === iLeft ? T.right : T.hidden, 1), 420);
    }

    /** Rotates the carousel to the left: the left item becomes the new center. */
    function rotateLeft(withSound) {
        if (isAnimating) return;
        isAnimating = true;
        const iLeft = idx(-1), iCenter = centerIndex, iRight = idx(1), iNewLeft = idx(-2);
        prepareItemFromHidden(items[iNewLeft], T.offLeft, iNewLeft !== iRight);
        setTransitions(true);
        items[iLeft].style.transform   = T.center;
        items[iCenter].style.transform = T.right;
        items[iRight].style.transform  = T.offRight;
        if (iNewLeft !== iRight) items[iNewLeft].style.transform = T.left;
        switchActiveVideo(items[iCenter], items[iLeft], withSound);
        items[iLeft].classList.replace('is-side', 'is-center');
        items[iCenter].classList.replace('is-center', 'is-side');
        setTimeout(() => finishRotation(items[iRight], iNewLeft === iRight ? T.left : T.hidden, -1), 420);
    }

    // ── Interaction Handlers ──────────────────

    /**
     * Click handler for all reel items:
     * - Clicking the center video toggles its sound on/off.
     * - Clicking a side video rotates it to the center (with sound).
     * - Clicks on hidden items (N > 3) are ignored.
     */
    items.forEach(item => {
        item.addEventListener('click', () => {
            if (preventNextClick) { preventNextClick = false; return; }
            if (item === items[centerIndex]) {
                centerHasSound = !centerHasSound;
                const cv = centerVideo();
                cv.muted = !centerHasSound;
                if (centerHasSound && cv.paused) cv.play().catch(() => {});
            } else if (item === items[idx(1)]) {
                rotateRight(true);
            } else if (item === items[idx(-1)]) {
                rotateLeft(true);
            }
        });
    });

    /**
     * Swipe support: a horizontal swipe of more than 50px triggers a rotation.
     * Swipes do not activate sound (only taps do).
     * `preventNextClick` stops the touchend from also firing a click event.
     */
    let touchStartX = 0;
    reels.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    reels.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
            preventNextClick = true;
            if (dx < 0) rotateRight(false); else rotateLeft(false);
        }
    }, { passive: true });

    /**
     * Autoplay: the center video starts playing (muted) when the section
     * scrolls into view. All videos pause when the section is out of view.
     * threshold: 0.4 means 40% of the section must be visible to trigger.
     */
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const cv = centerVideo();
            if (entry.isIntersecting) {
                cv.muted = true; centerHasSound = false;
                cv.play().catch(() => {});
            } else {
                items.forEach(item => item.querySelector('.social-reel-video').pause());
            }
        });
    }, { threshold: 0.4 });
    observer.observe(reels);

    // ── Arrow Buttons (Desktop Only) ──────────
    // Buttons are always created in the DOM.
    // CSS `display: none` / `display: flex` controls when they are visible
    // (only shown at screen widths ≥ 900px via a media query in home.css).

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

    // ── Initialization ────────────────────────
    // Hide all items, then position the first three in their slots.
    // Transitions are disabled during init to prevent an animated entry.

    setTransitions(false);
    items.forEach(item => { item.style.transform = T.hidden; });
    items[idx(-1)].style.transform    = T.left;
    items[centerIndex].style.transform = T.center;
    items[idx(1)].style.transform     = T.right;
    updateOverlays();
    requestAnimationFrame(() => requestAnimationFrame(() => setTransitions(true)));
}

setupReels();

// Lazy-load video sources when the section scrolls into view (200px before)
(function() {
    var section = document.getElementById('socialSection');
    if (!section) return;
    var loaded = false;
    var lazyObserver = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting && !loaded) {
            loaded = true;
            section.querySelectorAll('video[data-src]').forEach(function(video) {
                video.src = video.dataset.src;
                video.load();
            });
            lazyObserver.disconnect();
        }
    }, { rootMargin: '200px' });
    lazyObserver.observe(section);
})();
