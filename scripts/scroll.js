// ============================================
// SCROLL.JS — Elixir S&B
// Infinite scroll for the products grid.
// A loading spinner is placed at the bottom
// of the grid. When it scrolls into view,
// the next batch of product cards is loaded.
// ============================================

/** Removes any existing scroll loader from the DOM before creating a new one. */
function removeOldLoader() {
    const oldLoader = document.getElementById('scrollLoader');
    if (oldLoader) {
        oldLoader.remove();
    }
}

/** Creates and appends the loading spinner to the products grid. */
function createLoader() {
    const container  = document.getElementById('productsGrid');
    const loader     = document.createElement('div');
    loader.id        = 'scrollLoader';
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="loader-spinner"></div>
        <p class="loader-text">Más productos...</p>
    `;
    container.appendChild(loader);
    return loader;
}

/**
 * Called when the loader spinner enters the viewport.
 * Stops watching the loader, removes it, and loads the next batch of cards.
 */
function onLoaderVisible(observer, loader) {
    observer.unobserve(loader);
    loader.remove();
    createProductCards(data);
    startScrollObserver();
}

/**
 * Places a loader at the bottom of the grid and starts watching it.
 * When the user scrolls down to the loader, `onLoaderVisible` fires.
 * Does nothing if all products are already displayed.
 */
function startScrollObserver() {
    removeOldLoader();

    if (showProducts >= data.length) {
        return;
    }

    const loader   = createLoader();
    const observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
            onLoaderVisible(observer, loader);
        }
    });
    observer.observe(loader);
}

/**
 * Animates product cards as they scroll into view.
 * Cards start hidden (CSS class `fade-hidden`) and become visible
 * (CSS class `fade-visible`) as each one enters the viewport.
 */
function animateCards() {
    const cards    = document.querySelectorAll('.fade-hidden');
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-visible');
                observer.unobserve(entry.target);
            }
        });
    });
    cards.forEach(function(card) {
        observer.observe(card);
    });
}
