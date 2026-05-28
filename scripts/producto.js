// ============================================
// PRODUCTO.JS — Elixir S&B
// Single product detail page:
// fetch product by ID, render all sections
// (info, image, sizes, description, related),
// quantity stepper, and add to cart
// ============================================

// Stores the current product's key data after it is fetched.
// Used later when the customer clicks "Agregar al carrito".
let pdCurrentProduct = null;

// ── Fetch & Render ────────────────────────────

/**
 * Main entry point for this page.
 * Loads all products, finds the one matching the URL's ?id= parameter,
 * then renders the full product detail page.
 * Redirects to 404 if the product is not found or the request fails.
 */
async function fetchProduct() {
    try {
        const allData = await loadAllProductRows();
        const product = findProductById(allData);
        if (!product) {
            window.location.replace('404.html');
            return;
        }
        pdCurrentProduct = buildCurrentProductMeta(product);
        renderFullProductPage(product, allData);
    } catch (e) {
        window.location.replace('404.html');
    }
}

fetchProduct();

/** Fetches all products from the API and returns the array. */
async function loadAllProductRows() {
    const response = await fetch(productsUrl);
    return await response.json();
}

/** Reads the ?id= URL parameter and finds the matching product. */
function findProductById(allData) {
    var id = new URLSearchParams(window.location.search).get('id');
    return allData.find(function(row) { return String(row._id) === id; });
}

/** Extracts the minimal product fields needed for the add-to-cart function. */
function buildCurrentProductMeta(product) {
    return {
        id:    product._id,
        name:  product.nombre || 'Producto',
        brand: product.marca  || '',
        image: product.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : './assets/img/logo-transparent.png'
    };
}

/**
 * Calls all render functions in order, then shows the layout.
 * The layout is hidden by default and becomes visible after all data is ready.
 */
function renderFullProductPage(product, allData) {
    renderInfo(product);
    renderImage(product);
    renderDescription(product);
    renderSizes(product);
    renderRelated(allData, product);
    setupProductPage();
    document.querySelector('.pd-layout').classList.add('visible');
}

// ── Render Functions ──────────────────────────

/** Fills in the product name, brand, category eyebrow, and breadcrumb. */
function renderInfo(product) {
    var name     = product.nombre    || 'Producto Desconocido';
    var category = product.categoria ? 'Perfume para ' + product.categoria : 'Categoría desconocida';
    var brand    = getBrand(product);
    document.querySelector('.pd-eyebrow').textContent            = category;
    document.querySelector('.pd-title').textContent              = name;
    document.querySelector('.pd-breadcrumb-current').textContent = name;
    document.querySelector('.pd-inspiration em').textContent     = brand || '—';
}

/** Sets the main product image. Falls back to a placeholder if no image exists. */
function renderImage(product) {
    var imgEl = document.querySelector('.pd-image');
    imgEl.src = product.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : './assets/img/logo-transparent.png';
}

/** Fills in the product description text. */
function renderDescription(product) {
    var descEl = document.querySelector('#pdDescription p');
    descEl.textContent = product.descripcion || 'No hay descripción disponible.';
}

/**
 * Renders clickable size buttons from the product's presentaciones array.
 * Each button stores its price and sale price as data attributes.
 * Clicking a button updates the displayed price.
 */
function renderSizes(product) {
    var container = document.querySelector('.pd-sizes');
    container.innerHTML = '';

    if (!product.presentaciones || product.presentaciones.length === 0) {
        container.innerHTML = '<p class="pd-no-sizes">Talla no disponible</p>';
        document.querySelector('.pd-size-selected').textContent = '';
        renderPrice('', '');
        return;
    }

    product.presentaciones.forEach(function(pres, i) {
        container.appendChild(createSizeButton(pres.etiqueta, pres.precio, pres.precioSale, i === 0));
    });

    var first = product.presentaciones[0];
    renderPrice(first.precio, first.precioSale);
    document.querySelector('.pd-size-selected').textContent = first.etiqueta + ' ml';
    setupSizeClickListeners(container);
}

/** Creates a single size button with its price data stored as attributes. */
function createSizeButton(size, price, salePrice, isFirst) {
    var btn = document.createElement('button');
    btn.className         = isFirst ? 'pd-size-btn active' : 'pd-size-btn';
    btn.textContent       = size + ' ml';
    btn.dataset.price     = price     || 0;
    btn.dataset.priceSale = salePrice || 0;
    return btn;
}

/** Adds click listeners to size buttons so selecting one updates the price. */
function setupSizeClickListeners(container) {
    container.querySelectorAll('.pd-size-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            container.querySelectorAll('.pd-size-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            renderPrice(btn.dataset.price, btn.dataset.priceSale);
            document.querySelector('.pd-size-selected').textContent = 'Tamaño: ' + btn.textContent;
        });
    });
}

/**
 * Updates the price display area.
 * If a sale price exists, it shows the sale price and strikes through the original.
 */
function renderPrice(price, priceSale) {
    const priceEl = document.querySelector('#pdPrice');
    const oldEl   = document.querySelector('#pdPriceOld');
    const p  = parseFloat(price)    || 0;
    const ps = parseFloat(priceSale) || 0;
    if (!p) {
        priceEl.textContent = 'Precio no disponible';
        oldEl.textContent   = '';
        return;
    }
    if (ps > 0 && ps < p) {
        priceEl.textContent = formatPrice(ps);
        oldEl.textContent   = formatPrice(p);
    } else {
        priceEl.textContent = formatPrice(p);
        oldEl.textContent   = '';
    }
}

// ── Related Products ──────────────────────────

/**
 * Renders a horizontally scrollable carousel of related products.
 * Prioritizes bestsellers, then fills with random same-category products.
 * Maximum 8 items are shown.
 */
function renderRelated(allData, currentProduct) {
    const candidates = getRelatedCandidates(allData, currentProduct);
    const sorted     = sortAndLimitRelated(candidates);
    const carousel   = document.getElementById('pdRelatedCarousel');
    sorted.forEach(function(row) {
        const product = createProductData(allData, allData.indexOf(row));
        carousel.innerHTML += buildRelatedCardHtml(product);
    });
    setupRelatedNav(carousel);
}

/**
 * Filters all products to find active ones in the same category,
 * excluding the product currently being viewed.
 */
function getRelatedCandidates(allData, currentProduct) {
    var currentId       = String(currentProduct._id);
    var currentCategory = currentProduct.categoria || '';
    return allData.filter(function(row) {
        if (row.disponible === false) return false;
        if (String(row._id) === currentId) return false;
        if (row.categoria !== currentCategory) return false;
        return true;
    });
}

/**
 * Puts destacado products first, shuffles the rest randomly, then cuts to 8.
 */
function sortAndLimitRelated(candidates) {
    var bestsellers = candidates.filter(function(row) { return row.destacado === true; });
    var others      = candidates.filter(function(row) { return row.destacado !== true; });
    return bestsellers.concat(others.sort(function() { return Math.random() - 0.5; })).slice(0, 8);
}

/** Returns the HTML string for a single related product card link. */
function buildRelatedCardHtml(product) {
    return `<a href="producto.html?id=${product.id}" class="product-link">
        <article class="product-card">
            <div class="product-card-image">
                ${createImg(product.image)}
                <div class="product-card-overlay"></div>
                ${createBadge(product.badge)}
                <span class="product-card-gender">${product.categories}</span>
            </div>
            <div class="product-card-info">
                <div class="product-card-name-wrap"><h3 class="product-card-name">${product.name}</h3></div>
                <p class="product-card-brand">${product.brand}</p>
                ${createPrice(product.price)}
            </div>
        </article>
    </a>`;
}

/** Wires up the left/right scroll buttons for the related products carousel. */
function setupRelatedNav(carousel) {
    function getScrollAmount() {
        const card = carousel.querySelector('.product-card');
        if (card) {
            return card.offsetWidth + 15;
        }
        return 300;
    }
    document.getElementById('pdRelatedLeft').addEventListener('click', function() {
        carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });
    document.getElementById('pdRelatedRight').addEventListener('click', function() {
        carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
}

// ── Product Page Setup ────────────────────────

/** Wires up the quantity stepper (+/−) and the "Agregar al carrito" button. */
function setupProductPage() {
    document.getElementById('pdQtyMinus').addEventListener('click', function() {
        adjustQuantity(-1);
    });
    document.getElementById('pdQtyPlus').addEventListener('click', function() {
        adjustQuantity(1);
    });
    document.getElementById('pdAddCart').addEventListener('click', handleAddToCart);
}

/**
 * Increments or decrements the quantity display by `change`.
 * The minimum allowed quantity is 1.
 */
function adjustQuantity(change) {
    const el  = document.getElementById('pdQtyValue');
    const val = parseInt(el.textContent, 10);
    if (val + change >= 1) {
        el.textContent = val + change;
    }
}

// ── Add to Cart ───────────────────────────────

/**
 * Reads the active size button and returns its price data.
 * Returns null if no size button is selected.
 */
function readSelectedSizeData() {
    const btn = document.querySelector('.pd-size-btn.active');
    if (!btn) {
        return null;
    }
    const saleRaw = btn.dataset.priceSale;
    let salePrice;
    if (saleRaw && parseInt(saleRaw, 10) > 0) {
        salePrice = parseInt(saleRaw, 10);
    } else {
        salePrice = null;
    }
    return {
        size:         btn.textContent.replace(' ml', '').trim(),
        regularPrice: parseInt(btn.dataset.price, 10),
        salePrice:    salePrice
    };
}

/**
 * Reads the selected size and quantity, then adds the product to the cart.
 * Resets the quantity input back to 1 after adding.
 */
function handleAddToCart() {
    if (!pdCurrentProduct) {
        return;
    }
    const sizeData = readSelectedSizeData();
    if (!sizeData) {
        return;
    }
    const qty = parseInt(document.getElementById('pdQtyValue').textContent, 10) || 1;
    addToCart({
        sku:          `${pdCurrentProduct.id}-${sizeData.size}`,
        productId:    pdCurrentProduct.id,
        name:         pdCurrentProduct.name,
        brand:        pdCurrentProduct.brand,
        size:         sizeData.size,
        image:        pdCurrentProduct.image,
        regularPrice: sizeData.regularPrice,
        salePrice:    sizeData.salePrice,
        quantity:     qty
    });
    document.getElementById('pdQtyValue').textContent = '1';
}
