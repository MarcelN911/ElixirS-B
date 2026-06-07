// ============================================
// PRODUCTS.JS — ScentScape
// Products grid page: fetch products,
// render cards, filter by category,
// search by name/brand, infinite scroll
// ============================================

// ── Init ──────────────────────────────────────

const ORDER_KEY = 'elixir_product_order';
const ORDER_TTL = 24 * 60 * 60 * 1000;

/**
 * Returns a shuffled copy of `rows` using a saved order from localStorage.
 * If no valid order exists (first visit, expired, or product count changed),
 * a new random order is created and saved for 24 hours.
 */
function getOrderedProducts(rows) {
    try {
        const saved = JSON.parse(localStorage.getItem(ORDER_KEY));
        if (saved && saved.order && saved.order.length === rows.length && Date.now() - saved.timestamp < ORDER_TTL) {
            return saved.order.map(function(i) { return rows[i]; });
        }
    } catch (e) {}

    const indices = rows.map(function(_, i) { return i; });
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }

    try {
        localStorage.setItem(ORDER_KEY, JSON.stringify({ order: indices, timestamp: Date.now() }));
    } catch (e) {}

    return indices.map(function(i) { return rows[i]; });
}

/** Shows 8 skeleton placeholder cards in the products grid while data is loading. */
function showSkeletonGrid() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    let html = '';
    for (let i = 0; i < 8; i++) {
        html += '<div class="product-card-skeleton"></div>';
    }
    grid.innerHTML = html;
}

/** Shows an inline error message if the product catalog fails to load. */
function showProductsLoadError() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="no-results">
            <p class="no-results-title">No pudimos cargar los productos</p>
            <p class="no-results-text">Verifica tu conexión e intenta recargar la página, o escríbenos directamente.</p>
            <a href="#" onclick="openWhatsAppContact(); return false;"
               style="display:inline-block;margin-top:24px;padding:12px 28px;background:#25D366;color:white;border-radius:6px;font-family:Montserrat,sans-serif;font-size:12px;font-weight:500;text-decoration:none;letter-spacing:1px;">
                Escribir por WhatsApp
            </a>
        </div>`;
}

/**
 * Entry point: fetches all products and renders the initial grid.
 * Also checks if a search term was passed in the URL from the home page.
 */
async function fetchProducts() {
    showSkeletonGrid();
    try {
        const response = await fetch(productsUrl);
        const json = await response.json();
        data = getOrderedProducts(json);
        document.getElementById('productsGrid').innerHTML = '';
        createProductCards(data);
        checkSearchOnLoad();
    } catch (e) {
        showProductsLoadError();
    }
}

fetchProducts();

/**
 * Reads the `?search=` URL parameter set by the home page search bar.
 * If present, pre-fills the input field and runs the search automatically.
 */
function checkSearchOnLoad() {
    const searchValue = new URLSearchParams(window.location.search).get('search');

    if (!searchValue) {
        return;
    }

    document.getElementById('searchInput').value = searchValue;
    searchProducts();
    searchClear.classList.add('visible');
}

// ── Render ────────────────────────────────────

/**
 * Renders the next batch of product cards into the grid.
 * Skips products marked as inactive (column 9 = 'No').
 * Pagination is managed via the shared `showProducts` counter.
 */
function createProductCards(data) {
    const end = Math.min(showProducts + productsPerLoad, data.length);
    for (let i = showProducts; i < end; i++) {
        if (data[i].disponible === false) {
            continue;
        }
        createProductTemplate(createProductData(data, i));
    }
    showProducts += productsPerLoad;
    startScrollObserver();
    animateCards();
}

/**
 * Clears the grid and resets all state before applying a filter or search.
 * Also resets the active filter tab and clears the search input.
 */
function resetProductView(category) {
    document.getElementById('productsGrid').innerHTML = '';
    showProducts = 0;
    switchFilterTab(category);
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.remove('visible');
}

/**
 * Returns the gender options of a product from its variantes.
 * @param {Object} product
 * @returns {string[]}
 */
function getProductGeneros(product) {
    if (!product.variantes) return [];
    var v = product.variantes.find(function(x) { return x.nombre === 'Género'; });
    return v ? (v.opciones || []) : [];
}

/**
 * Returns true if the product matches the gender filter.
 * Unisex products appear under Dama and Caballero as well.
 * @param {Object} product
 * @param {string} filter — 'Dama' | 'Caballero' | 'Unisex'
 */
function matchesGenderFilter(product, filter) {
    var generos = getProductGeneros(product);
    if (filter === 'Dama') {
        return generos.some(function(g) { return g === 'Damas' || g === 'Unisex'; });
    }
    if (filter === 'Caballero') {
        return generos.some(function(g) { return g === 'Caballeros' || g === 'Unisex'; });
    }
    if (filter === 'Unisex') {
        return generos.includes('Unisex');
    }
    return false;
}

/** Renders all active products that match the given gender filter. */
function showGenderProducts(filter) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].disponible === false) continue;
        if (matchesGenderFilter(data[i], filter)) {
            createProductTemplate(createProductData(data, i));
        }
    }
}

// ── Filter ────────────────────────────────────

/**
 * Filters the product grid by category.
 * Passing 'Todos' shows all products with normal pagination.
 */
function filterProducts(category) {
    resetProductView(category);
    if (category === 'Todos') {
        createProductCards(data);
    } else {
        showGenderProducts(category);
        animateCards();
    }
}

/**
 * Highlights the selected filter tab and deactivates all others.
 * Matches tabs by their visible text content.
 */
function switchFilterTab(category) {
    document.querySelectorAll('.filter-tab').forEach(function(tab) {
        if (tab.textContent === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// ── Search ────────────────────────────────────

/** Returns true if a product's name or brand contains the search term. */
function isProductMatch(index, searchInput) {
    const name  = (data[index].nombre || '').toLowerCase();
    const brand = getBrand(data[index]).toLowerCase();
    return name.includes(searchInput) || brand.includes(searchInput);
}

/**
 * Clears the grid and renders every product that matches the search term.
 * Returns the total number of results found.
 */
function findMatchingProducts(searchInput) {
    document.getElementById('productsGrid').innerHTML = '';
    let count = 0;
    for (let i = 0; i < data.length; i++) {
        if (data[i].disponible === false) {
            continue;
        }
        if (isProductMatch(i, searchInput)) {
            createProductTemplate(createProductData(data, i));
            count++;
        }
    }
    return count;
}

/**
 * Validates the search input before running a search.
 * Shows a hint and returns false if the input is too short or empty.
 */
function validateSearch(searchInput) {
    if (searchInput === '') {
        filterProducts('Todos');
        return false;
    }
    if (searchInput.length < 3) {
        showSearchHint('Ingresa al menos 3 letras para buscar');
        return false;
    }
    return true;
}

/** Runs the full search: validate → find matches → show results or empty state. */
function searchProducts() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    hideSearchHint();
    switchFilterTab('Todos');

    if (!validateSearch(input)) {
        return;
    }

    const count = findMatchingProducts(input);
    if (count === 0) {
        showNoResults(input);
    }
    animateCards();
}

// ── Search Hints ──────────────────────────────

/** Displays a hint message below the search form. Removes any previous hint first. */
function showSearchHint(message) {
    hideSearchHint();
    const hint       = document.createElement('p');
    hint.className   = 'search-hint';
    hint.id          = 'searchHint';
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

/** Shows a "no results" message inside the products grid container. */
function showNoResults(searchInput) {
    document.getElementById('productsGrid').innerHTML = `
        <div class="no-results">
            <p class="no-results-title">No encontramos "${searchInput}"</p>
            <p class="no-results-text">Intenta con otro nombre o marca</p>
        </div>
    `;
}

// ── Event Listeners ───────────────────────────

const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        searchProducts();
    });
}

const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

if (searchInput && searchClear) {
    // Show/hide the clear (×) button based on whether the input has text
    searchInput.addEventListener('input', function() {
        if (searchInput.value.length > 0) {
            searchClear.classList.add('visible');
        } else {
            searchClear.classList.remove('visible');
        }
    });

    // Clicking the clear button resets the search and shows all products
    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        hideSearchHint();
        filterProducts('Todos');
    });
}
