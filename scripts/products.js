// ============================================
// PRODUCTS.JS — Elixir S&B
// Products grid page: fetch products,
// render cards, filter by category,
// search by name/brand, infinite scroll
// ============================================

// ── Init ──────────────────────────────────────

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
        const db      = await fetch(productsUrl);
        const content = await db.text();
        const json = JSON.parse(content.substring(47).slice(0, -2));
        data = json.table.rows;
        for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
        }
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
        if (data[i].c[10].v === 'No') {
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

/** Renders all active products that belong to the given category. */
function showCategoryProducts(category) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].c[10].v === 'No') {
            continue;
        }
        if (data[i].c[8].v === category) {
            createProductTemplate(createProductData(data, i));
        }
    }
}

/** Renders all active products that have Unisex = Si. */
function showUnisexProducts() {
    for (let i = 0; i < data.length; i++) {
        if (data[i].c[10].v === 'No') {
            continue;
        }
        if (data[i].c[9] && data[i].c[9].v === 'Si') {
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
    } else if (category === 'Unisex') {
        showUnisexProducts();
    } else {
        showCategoryProducts(category);
    }
    animateCards();
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
    const name  = data[index].c[1].v.toLowerCase();
    const brand = data[index].c[2].v.toLowerCase();
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
        if (data[i].c[10].v === 'No') {
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
